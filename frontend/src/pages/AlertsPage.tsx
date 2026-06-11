import { useMemo } from "react";
import {
  IoWarningOutline,
  IoCashOutline,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";

import { saldo, pagoEnRiesgo, type Order } from "../data/dashboard";
import { useOrders } from "../store/OrdersContext";

const currency = (n: number) =>
  n.toLocaleString("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function KpiCard({
  label,
  value,
  accent = "text-gray-900",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

// Una sección de alertas (un nivel de prioridad).
function AlertSection({
  title,
  subtitle,
  tone,
  icon,
  orders,
  onMarkPaid,
}: {
  title: string;
  subtitle: string;
  tone: "red" | "amber" | "gray";
  icon: React.ReactNode;
  orders: Order[];
  onMarkPaid: (id: string, monto: number) => void;
}) {
  if (orders.length === 0) return null;

  const tones = {
    red: { border: "border-red-200", bg: "bg-red-50", title: "text-red-800", sub: "text-red-700" },
    amber: { border: "border-amber-200", bg: "bg-amber-50", title: "text-amber-800", sub: "text-amber-700" },
    gray: { border: "border-gray-200", bg: "bg-gray-50", title: "text-gray-700", sub: "text-gray-500" },
  }[tone];

  return (
    <div className={`rounded-xl border ${tones.border} ${tones.bg} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h2 className={`font-semibold ${tones.title}`}>
            {title} · {orders.length}
          </h2>
          <p className={`text-sm ${tones.sub}`}>{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-12 items-center gap-3 rounded-lg bg-white border border-gray-100 px-4 py-3"
          >
            <div className="col-span-12 sm:col-span-4 min-w-0">
              <p className="font-medium text-gray-900 truncate">{o.id}</p>
              <p className="text-xs text-gray-500 truncate">
                {o.proveedor} · {o.etapaActual}
              </p>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="text-xs text-gray-400">Monto / pagado</p>
              <p className="text-sm text-gray-700 tabular-nums">
                {currency(o.monto)} · {currency(o.montoPagado)}
              </p>
            </div>
            <div className="col-span-6 sm:col-span-2">
              <p className="text-xs text-gray-400">Saldo</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">
                {currency(saldo(o))}
              </p>
            </div>
            <div className="col-span-12 sm:col-span-3 flex sm:justify-end">
              <button
                onClick={() => onMarkPaid(o.id, o.monto)}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                <IoCheckmarkDoneOutline size={15} />
                Marcar pagado
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { orders, updateOrder, loading } = useOrders();

  const groups = useMemo(() => {
    const enMarcha: Order[] = []; // en proceso, sin ningún pago
    const porIniciar: Order[] = []; // con monto, sin pago, aún sin arrancar
    const saldoPendiente: Order[] = []; // pago parcial, saldo por cubrir

    for (const o of orders) {
      if (o.monto <= 0) continue;
      if (pagoEnRiesgo(o)) enMarcha.push(o);
      else if (o.montoPagado === 0) porIniciar.push(o);
      else if (o.montoPagado < o.monto) saldoPendiente.push(o);
    }

    const ordByMonto = (a: Order, b: Order) => b.monto - a.monto;
    enMarcha.sort(ordByMonto);
    porIniciar.sort(ordByMonto);
    saldoPendiente.sort((a, b) => saldo(b) - saldo(a));

    const totalPorPagar =
      enMarcha.reduce((s, o) => s + saldo(o), 0) +
      porIniciar.reduce((s, o) => s + saldo(o), 0) +
      saldoPendiente.reduce((s, o) => s + saldo(o), 0);

    const montoEnRiesgo = enMarcha.reduce((s, o) => s + o.monto, 0);
    const totalOrdenes =
      enMarcha.length + porIniciar.length + saldoPendiente.length;

    return {
      enMarcha,
      porIniciar,
      saldoPendiente,
      totalPorPagar,
      montoEnRiesgo,
      totalOrdenes,
    };
  }, [orders]);

  const markPaid = (id: string, monto: number) =>
    updateOrder(id, { montoPagado: monto });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Cargando alertas…
      </div>
    );
  }

  const sinAlertas = groups.totalOrdenes === 0;

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Alertas de pago</h1>
          <p className="text-gray-500">
            Órdenes que requieren pago, ordenadas por prioridad.
          </p>
        </header>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Órdenes con pago pendiente"
            value={String(groups.totalOrdenes)}
          />
          <KpiCard
            label="Total por pagar"
            value={currency(groups.totalPorPagar)}
            accent="text-amber-600"
          />
          <KpiCard
            label="En riesgo (en marcha, sin pago)"
            value={currency(groups.montoEnRiesgo)}
            accent="text-red-600"
          />
        </div>

        {sinAlertas ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 flex flex-col items-center gap-3 text-center">
            <IoCheckmarkCircle className="text-green-600" size={36} />
            <p className="text-green-800 font-medium">
              Sin alertas de pago. Todas las órdenes están al corriente.
            </p>
          </div>
        ) : (
          <>
            <AlertSection
              title="En marcha sin pago"
              subtitle="El proveedor ya está trabajando la orden y no hay ningún pago registrado. Prioridad alta."
              tone="red"
              icon={<IoWarningOutline className="text-red-600 shrink-0" size={24} />}
              orders={groups.enMarcha}
              onMarkPaid={markPaid}
            />
            <AlertSection
              title="Saldo pendiente"
              subtitle="Órdenes con anticipo pagado pero saldo por cubrir."
              tone="amber"
              icon={<IoCashOutline className="text-amber-600 shrink-0" size={24} />}
              orders={groups.saldoPendiente}
              onMarkPaid={markPaid}
            />
            <AlertSection
              title="Por iniciar sin anticipo"
              subtitle="Órdenes con monto definido que aún no arrancan y no tienen anticipo."
              tone="gray"
              icon={<IoTimeOutline className="text-gray-500 shrink-0" size={24} />}
              orders={groups.porIniciar}
              onMarkPaid={markPaid}
            />
          </>
        )}
      </div>
    </div>
  );
}
