import { useEffect, useState } from "react";
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
  fetchDashboardData,
  SEMAFORO_COLORS,
  ESTADO_COLORS,
  type DashboardData,
  type Order,
  type Semaforo,
} from "../data/dashboard";

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

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-gray-500 border-b border-gray-200">
          <tr>
            <th className="py-2 pr-4">Orden ID</th>
            <th className="py-2 pr-4">Proveedor</th>
            <th className="py-2 pr-4">Producto</th>
            <th className="py-2 pr-4 text-right">Monto</th>
            <th className="py-2 pr-4">Etapa actual</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4 text-right">Avance</th>
            <th className="py-2 pr-4">ETA bodega</th>
            <th className="py-2">Semáforo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="py-2 pr-4 font-medium text-gray-900">{o.id}</td>
              <td className="py-2 pr-4 text-gray-600">{o.proveedor}</td>
              <td className="py-2 pr-4 text-gray-600">{o.productoSku || "—"}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                {o.monto ? currency(o.monto) : "—"}
              </td>
              <td className="py-2 pr-4 text-gray-600">{o.etapaActual}</td>
              <td className="py-2 pr-4 text-gray-600">{o.estado}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-gray-700">
                {percent(o.avance)}
              </td>
              <td className="py-2 pr-4 text-gray-600">
                {o.etaBodega
                  ? new Date(o.etaBodega).toLocaleDateString("es-MX")
                  : "—"}
              </td>
              <td className="py-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEMAFORO_BADGE[o.semaforo]}`}
                >
                  {o.semaforo}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Cargando dashboard…
      </div>
    );
  }

  const { kpis, porProveedor, porSemaforo, porEstado, funnel, orders } = data;

  // Embudo con color por profundidad (de azul intenso a claro).
  const funnelColors = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"];

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard General</h1>
          <p className="text-gray-500">
            Órdenes a proveedores · {kpis.ordenesTotales} órdenes activas
          </p>
        </header>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Órdenes totales" value={String(kpis.ordenesTotales)} />
          <KpiCard
            label="Monto total"
            value={currency(kpis.montoTotal)}
            sub={`Caja comprometida ${currency(kpis.cajaComprometida)}`}
          />
          <KpiCard
            label="Órdenes en rojo"
            value={String(kpis.ordenesEnRojo)}
            accent="text-red-600"
            sub="Vencidas vs. ETA bodega"
          />
          <KpiCard
            label="% avance promedio"
            value={percent(kpis.avancePromedio)}
            sub={`${kpis.ordenesCompletas} completas · ${kpis.ordenesActivas} activas`}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-4">
              Monto por proveedor
            </h2>
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
            <h2 className="font-semibold text-gray-800 mb-4">
              Órdenes por semáforo
            </h2>
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
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <h2 className="font-semibold text-gray-800 mb-4">
              Órdenes por estado
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={porEstado}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  label
                >
                  {porEstado.map((s) => (
                    <Cell key={s.name} fill={ESTADO_COLORS[s.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-1">
              Embudo de avance por hito
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Órdenes que han alcanzado cada etapa del proceso
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
                    fontSize={12}
                  />
                  <LabelList
                    position="left"
                    dataKey="ordenes"
                    fill="#374151"
                    stroke="none"
                    fontSize={12}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Orders table */}
        <Card>
          <h2 className="font-semibold text-gray-800 mb-4">Detalle de órdenes</h2>
          <OrdersTable orders={orders} />
        </Card>
      </div>
    </div>
  );
}
