import { IoAlertCircle, IoWarningOutline, IoBoatOutline } from "react-icons/io5";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

import {
  saldo,
  pagoEstado,
  pagoEnRiesgo,
  SEMAFORO_COLORS,
  PAGO_COLORS,
  type Order,
  type Semaforo,
  type PagoEstado,
  type Tracking,
} from "../data/dashboard";
import { useOrders } from "../store/OrdersContext";

const currency = (n: number) =>
  n.toLocaleString("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const percent = (n: number) => `${Math.round(n * 100)}%`;

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent = "text-gray-900",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </Card>
  );
}

const SEMAFORO_BADGE: Record<Semaforo, string> = {
  ROJO: "bg-red-100 text-red-700",
  AMARILLO: "bg-yellow-100 text-yellow-700",
  VERDE: "bg-green-100 text-green-700",
  GRIS: "bg-gray-100 text-gray-600",
};

const PAGO_BADGE: Record<PagoEstado, string> = {
  "SIN PAGO": "bg-red-100 text-red-700",
  PARCIAL: "bg-amber-100 text-amber-700",
  PAGADO: "bg-green-100 text-green-700",
};

// Banner que resalta las órdenes en marcha sin pago registrado.
function PaymentAlert({
  alertas,
  montoEnRiesgo,
}: {
  alertas: Order[];
  montoEnRiesgo: number;
}) {
  if (alertas.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center gap-3">
        <IoAlertCircle className="text-green-600 shrink-0" size={22} />
        <p className="text-sm text-green-800">
          Todas las órdenes en marcha tienen al menos un pago registrado.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-3">
        <IoWarningOutline className="text-red-600 shrink-0" size={22} />
        <div>
          <h2 className="font-semibold text-red-800">
            {alertas.length} órdenes en marcha sin pago registrado
          </h2>
          <p className="text-sm text-red-700">
            {currency(montoEnRiesgo)} comprometidos con proveedores sin haber
            recibido pago. Revisar antes de que avancen más.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {alertas.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-lg bg-white border border-red-100 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{o.id}</p>
              <p className="text-xs text-gray-500 truncate">
                {o.proveedor} · {o.etapaActual}
              </p>
            </div>
            <span className="ml-3 shrink-0 font-semibold text-red-700 tabular-nums">
              {currency(o.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-gray-500 border-b border-gray-200">
          <tr>
            <th className="py-2 pr-4">Orden ID</th>
            <th className="py-2 pr-4">Proveedor</th>
            <th className="py-2 pr-4 text-right">Monto</th>
            <th className="py-2 pr-4 text-right">Pagado</th>
            <th className="py-2 pr-4 text-right">Saldo</th>
            <th className="py-2 pr-4">Pago</th>
            <th className="py-2 pr-4">Etapa actual</th>
            <th className="py-2 pr-4 text-right">Avance</th>
            <th className="py-2">Semáforo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => {
            const enRiesgo = pagoEnRiesgo(o);
            const ep = pagoEstado(o);
            return (
              <tr
                key={o.id}
                className={enRiesgo ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-gray-50"}
              >
                <td className="py-2 pr-4 font-medium text-gray-900">
                  {enRiesgo && (
                    <IoWarningOutline
                      className="inline mr-1 text-red-500 align-text-bottom"
                      size={15}
                    />
                  )}
                  {o.id}
                </td>
                <td className="py-2 pr-4 text-gray-600">{o.proveedor}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                  {o.monto ? currency(o.monto) : "—"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                  {o.monto ? currency(o.montoPagado) : "—"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                  {o.monto ? currency(saldo(o)) : "—"}
                </td>
                <td className="py-2 pr-4">
                  {o.monto ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAGO_BADGE[ep]}`}
                    >
                      {ep}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4 text-gray-600">{o.etapaActual}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                  {percent(o.avance)}
                </td>
                <td className="py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEMAFORO_BADGE[o.semaforo]}`}
                  >
                    {o.semaforo}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Días entre hoy y una fecha ISO (negativo = ya pasó).
function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className="h-2 rounded-full bg-blue-500"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

// Panel de próximas llegadas, alimentado por la API de rastreo.
function UpcomingArrivals({
  orders,
  trackings,
}: {
  orders: Order[];
  trackings: Record<string, Tracking>;
}) {
  const arrivals = orders
    .map((o) => ({ order: o, t: trackings[o.id] }))
    .filter(
      (x): x is { order: Order; t: Tracking } =>
        !!x.t && !!x.t.estimatedArrival && x.t.progress < 1,
    )
    .sort((a, b) =>
      a.t.estimatedArrival! < b.t.estimatedArrival! ? -1 : 1,
    )
    .slice(0, 6);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <IoBoatOutline className="text-blue-600" size={20} />
        <h2 className="font-semibold text-gray-800">Próximas llegadas a bodega</h2>
      </div>
      {arrivals.length === 0 ? (
        <p className="text-sm text-gray-400">Sin envíos en tránsito.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {arrivals.map(({ order, t }) => {
            const dias = daysUntil(t.estimatedArrival!);
            const atrasado = dias < 0;
            return (
              <div
                key={order.id}
                className="grid grid-cols-12 items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
              >
                <div className="col-span-4 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{order.id}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.proveedor} · {t.currentStage}
                  </p>
                </div>
                <div className="col-span-5">
                  <ProgressBar value={t.progress} />
                  <p className="mt-1 text-xs text-gray-400">
                    {percent(t.progress)} · ETA{" "}
                    {new Date(t.estimatedArrival!).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <div className="col-span-3 text-right">
                  <span
                    className={`text-xs font-medium ${
                      atrasado ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {atrasado
                      ? `Atrasado ${Math.abs(dias)} d`
                      : dias === 0
                      ? "Llega hoy"
                      : `En ${dias} d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { dashboard: data, trackings, loading } = useOrders();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Cargando dashboard…
      </div>
    );
  }

  const {
    kpis,
    porProveedor,
    pagoPorProveedor,
    porSemaforo,
    porPagoEstado,
    funnel,
    orders,
    alertasPago,
  } = data;

  const funnelColors = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"];

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard General</h1>
          <p className="text-gray-500">
            Órdenes a proveedores · {kpis.ordenesTotales} órdenes en total
          </p>
        </header>

        {/* Alerta principal: pagos pendientes */}
        <PaymentAlert
          alertas={alertasPago}
          montoEnRiesgo={kpis.montoEnRiesgo}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Órdenes totales" value={String(kpis.ordenesTotales)} />
          <KpiCard label="Monto total" value={currency(kpis.montoTotal)} />
          <KpiCard
            label="Saldo pendiente"
            value={currency(kpis.saldoPendiente)}
            accent="text-amber-600"
            sub="Por cobrar / pagar"
          />
          <KpiCard
            label="Pagos en riesgo"
            value={String(kpis.ordenesSinPago)}
            accent="text-red-600"
            sub={`${currency(kpis.montoEnRiesgo)} sin pago`}
          />
        </div>

        {/* Charts row 1 — foco en pagos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-4">
              Pagado vs. saldo por proveedor
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pagoPorProveedor} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="proveedor" tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => currency(Number(v))}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Legend />
                <Bar dataKey="pagado" name="Pagado" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="saldo" name="Saldo" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="font-semibold text-gray-800 mb-4">Estado de pago</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={porPagoEstado}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {porPagoEstado.map((s) => (
                    <Cell key={s.name} fill={PAGO_COLORS[s.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts row 2 — operación */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <h2 className="font-semibold text-gray-800 mb-4">Monto por proveedor</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porProveedor} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="proveedor" tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => currency(Number(v))}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="monto" name="Monto" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="font-semibold text-gray-800 mb-4">Órdenes por semáforo</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={porSemaforo}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                >
                  {porSemaforo.map((s) => (
                    <Cell key={s.name} fill={SEMAFORO_COLORS[s.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="font-semibold text-gray-800 mb-1">Avance por hito</h2>
            <p className="text-xs text-gray-400 mb-4">
              Órdenes que alcanzaron cada etapa
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="ordenes" data={funnel} isAnimationActive>
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={funnelColors[i % funnelColors.length]} />
                  ))}
                  <LabelList
                    position="right"
                    dataKey="etapa"
                    fill="#374151"
                    stroke="none"
                    fontSize={11}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Rastreo de envíos */}
        <UpcomingArrivals orders={orders} trackings={trackings} />

        {/* Orders table */}
        <Card>
          <h2 className="font-semibold text-gray-800 mb-4">Detalle de órdenes</h2>
          <OrdersTable orders={orders} />
        </Card>
      </div>
    </div>
  );
}
