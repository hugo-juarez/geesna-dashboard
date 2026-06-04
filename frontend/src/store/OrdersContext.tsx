import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchOrders,
  fetchTracking,
  buildDashboard,
  PROVIDERS,
  type Order,
  type Provider,
  type DashboardData,
  type Tracking,
} from "../data/dashboard";

interface OrdersContextValue {
  orders: Order[];
  providers: Provider[];
  dashboard: DashboardData;
  trackings: Record<string, Tracking>;
  loading: boolean;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * Fuente única de verdad de las órdenes. Hoy arranca con datos simulados y los
 * mantiene en memoria; cuando exista backend, addOrder/updateOrder/deleteOrder
 * pueden hacer también el POST/PUT/DELETE correspondiente.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders().then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, []);

  // El dashboard se deriva siempre de las órdenes vigentes.
  const dashboard = useMemo(
    () => buildDashboard(orders, PROVIDERS),
    [orders],
  );

  // Rastreo de envíos (API externa por Orden ID). Se carga para el conjunto
  // actual de órdenes y se reconsulta cuando cambia ese conjunto.
  const [trackings, setTrackings] = useState<Record<string, Tracking>>({});
  const idKey = orders.map((o) => o.id).join("|");
  useEffect(() => {
    if (orders.length === 0) {
      setTrackings({});
      return;
    }
    let cancelled = false;
    Promise.all(orders.map((o) => fetchTracking(o.id))).then((list) => {
      if (cancelled) return;
      const map: Record<string, Tracking> = {};
      for (const t of list) if (t) map[t.orderId] = t;
      setTrackings(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  const addOrder = (order: Order) =>
    setOrders((prev) => [...prev, order]);

  const updateOrder = (id: string, patch: Partial<Order>) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );

  const deleteOrder = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  return (
    <OrdersContext.Provider
      value={{
        orders,
        providers: PROVIDERS,
        dashboard,
        trackings,
        loading,
        addOrder,
        updateOrder,
        deleteOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders debe usarse dentro de <OrdersProvider>");
  }
  return ctx;
}
