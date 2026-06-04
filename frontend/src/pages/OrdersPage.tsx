import { useEffect, useMemo, useState } from "react";
import {
  IoAddOutline,
  IoCloseOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoSearchOutline,
  IoWarningOutline,
  IoBoatOutline,
  IoCheckmarkCircle,
  IoEllipseOutline,
} from "react-icons/io5";

import {
  blankOrder,
  fetchTracking,
  saldo,
  pagoEstado,
  pagoEnRiesgo,
  ETAPAS,
  type Order,
  type Etapa,
  type EstadoOrden,
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

const ETAPA_OPTIONS: Etapa[] = ["Sin iniciar", ...ETAPAS];
const ESTADO_OPTIONS: EstadoOrden[] = [
  "EN GESTIÓN",
  "EN PRODUCCIÓN",
  "PAGADA / EN ESPERA",
  "COMPLETA",
];
const SEMAFORO_OPTIONS: Semaforo[] = ["GRIS", "VERDE", "AMARILLO", "ROJO"];

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

// --- Campos reutilizables del formulario ---
function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function OrderForm({
  initial,
  isNew,
  existingIds,
  providers,
  onSave,
  onClose,
}: {
  initial: Order;
  isNew: boolean;
  existingIds: string[];
  providers: { nombre: string }[];
  onSave: (order: Order) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Order>(initial);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Order>(key: K, value: Order[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const pagoCompleto = draft.monto > 0 && draft.montoPagado >= draft.monto;

  const submit = () => {
    const id = draft.id.trim();
    if (!id) return setError("La orden necesita un ID.");
    if (isNew && existingIds.includes(id))
      return setError(`Ya existe una orden con el ID "${id}".`);
    if (draft.monto < 0 || draft.montoPagado < 0)
      return setError("Los montos no pueden ser negativos.");
    onSave({ ...draft, id });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? "Registrar orden" : `Editar ${initial.id}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-5">
          <Field label="Orden ID">
            <input
              className={inputCls}
              value={draft.id}
              disabled={!isNew}
              placeholder="PB2020260301"
              onChange={(e) => set("id", e.target.value)}
            />
          </Field>
          <Field label="Proveedor">
            <select
              className={inputCls}
              value={draft.proveedor}
              onChange={(e) => set("proveedor", e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Producto / SKU">
            <input
              className={inputCls}
              value={draft.productoSku}
              onChange={(e) => set("productoSku", e.target.value)}
            />
          </Field>
          <Field label="Contenedor">
            <input
              className={inputCls}
              value={draft.contenedor}
              onChange={(e) => set("contenedor", e.target.value)}
            />
          </Field>
          <Field label="Responsable">
            <input
              className={inputCls}
              value={draft.responsable}
              onChange={(e) => set("responsable", e.target.value)}
            />
          </Field>
          <Field label="Avance (%)">
            <input
              type="number"
              min={0}
              max={100}
              className={inputCls}
              value={Math.round(draft.avance * 100)}
              onChange={(e) =>
                set("avance", Math.min(100, Math.max(0, Number(e.target.value))) / 100)
              }
            />
          </Field>

          <Field label="Monto de la orden (USD)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={draft.monto}
              onChange={(e) => set("monto", Number(e.target.value))}
            />
          </Field>
          <Field label="Monto pagado (USD)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={draft.montoPagado}
              onChange={(e) => set("montoPagado", Number(e.target.value))}
            />
          </Field>

          {/* Atajo de pago */}
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={pagoCompleto}
              onChange={(e) =>
                set("montoPagado", e.target.checked ? draft.monto : 0)
              }
            />
            Marcar pago completo (pagado = monto)
          </label>

          <Field label="ETA Puerto MX">
            <input
              type="date"
              className={inputCls}
              value={draft.etaPuertoMx ?? ""}
              onChange={(e) => set("etaPuertoMx", e.target.value || null)}
            />
          </Field>
          <Field label="ETA Bodega">
            <input
              type="date"
              className={inputCls}
              value={draft.etaBodega ?? ""}
              onChange={(e) => set("etaBodega", e.target.value || null)}
            />
          </Field>

          <Field label="Etapa actual">
            <select
              className={inputCls}
              value={draft.etapaActual}
              onChange={(e) => set("etapaActual", e.target.value as Etapa)}
            >
              {ETAPA_OPTIONS.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado de la orden">
            <select
              className={inputCls}
              value={draft.estado}
              onChange={(e) => set("estado", e.target.value as EstadoOrden)}
            >
              {ESTADO_OPTIONS.map((es) => (
                <option key={es} value={es}>
                  {es}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semáforo">
            <select
              className={inputCls}
              value={draft.semaforo}
              onChange={(e) => set("semaforo", e.target.value as Semaforo)}
            >
              {SEMAFORO_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p className="px-6 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isNew ? "Registrar orden" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de rastreo: consulta la API por Orden ID y muestra ETA + avance + hitos.
function TrackingModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTracking(order.id).then((t) => {
      if (cancelled) return;
      setTracking(t);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <IoBoatOutline className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              Rastreo · {order.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <p className="text-sm text-gray-400">Consultando al transportista…</p>
          ) : !tracking ? (
            <p className="text-sm text-gray-400">
              Sin información de rastreo para esta orden todavía.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-xs text-gray-500">Llegada estimada</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {tracking.estimatedArrival
                      ? new Date(tracking.estimatedArrival).toLocaleDateString(
                          "es-MX",
                        )
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {percent(tracking.progress)}
                  </p>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-gray-100 mb-6">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.round(tracking.progress * 100)}%` }}
                />
              </div>

              <ol className="flex flex-col gap-3">
                {tracking.events.map((e) => (
                  <li key={e.etapa} className="flex items-start gap-3">
                    {e.completed ? (
                      <IoCheckmarkCircle
                        className="text-green-500 shrink-0 mt-0.5"
                        size={18}
                      />
                    ) : (
                      <IoEllipseOutline
                        className="text-gray-300 shrink-0 mt-0.5"
                        size={18}
                      />
                    )}
                    <div className="flex-1 flex items-center justify-between">
                      <span
                        className={
                          e.completed ? "text-gray-800" : "text-gray-400"
                        }
                      >
                        {e.etapa}
                      </span>
                      {e.date && (
                        <span className="text-xs text-gray-400">
                          {new Date(e.date).toLocaleDateString("es-MX")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-5 text-xs text-gray-400">
                Última actualización:{" "}
                {new Date(tracking.lastUpdate).toLocaleString("es-MX")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { orders, providers, addOrder, updateOrder, deleteOrder, loading } =
    useOrders();

  const [query, setQuery] = useState("");
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  // null = cerrado; objeto = formulario abierto (con isNew para distinguir).
  const [editing, setEditing] = useState<{ order: Order; isNew: boolean } | null>(
    null,
  );
  // Orden cuyo rastreo se está consultando (null = modal cerrado).
  const [tracking, setTracking] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (soloRiesgo && !pagoEnRiesgo(o)) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.proveedor.toLowerCase().includes(q) ||
        o.productoSku.toLowerCase().includes(q)
      );
    });
  }, [orders, query, soloRiesgo]);

  const handleSave = (order: Order) => {
    if (editing?.isNew) addOrder(order);
    else updateOrder(order.id, order);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Cargando órdenes…
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-8">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Órdenes</h1>
            <p className="text-gray-500">
              {orders.length} órdenes registradas · {filtered.length} mostradas
            </p>
          </div>
          <button
            onClick={() => setEditing({ order: blankOrder(), isNew: true })}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <IoAddOutline size={18} />
            Registrar orden
          </button>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <IoSearchOutline
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Buscar por ID, proveedor o producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={soloRiesgo}
              onChange={(e) => setSoloRiesgo(e.target.checked)}
            />
            Solo pagos en riesgo
          </label>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Orden ID</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-right">Pagado</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4">Pago</th>
                  <th className="py-3 px-4">Etapa</th>
                  <th className="py-3 px-4 text-right">Avance</th>
                  <th className="py-3 px-4">Semáforo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => {
                  const enRiesgo = pagoEnRiesgo(o);
                  const ep = pagoEstado(o);
                  return (
                    <tr
                      key={o.id}
                      className={
                        enRiesgo ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-gray-50"
                      }
                    >
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {enRiesgo && (
                          <IoWarningOutline
                            className="inline mr-1 text-red-500 align-text-bottom"
                            size={15}
                          />
                        )}
                        {o.id}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{o.proveedor}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                        {o.monto ? currency(o.monto) : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                        {o.monto ? currency(o.montoPagado) : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                        {o.monto ? currency(saldo(o)) : "—"}
                      </td>
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-4 text-gray-600">{o.etapaActual}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">
                        {percent(o.avance)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEMAFORO_BADGE[o.semaforo]}`}
                        >
                          {o.semaforo}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Rastreo"
                            onClick={() => setTracking(o)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <IoBoatOutline size={17} />
                          </button>
                          <button
                            title="Editar"
                            onClick={() => setEditing({ order: o, isNew: false })}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <IoPencilOutline size={17} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => {
                              if (
                                window.confirm(`¿Eliminar la orden ${o.id}?`)
                              )
                                deleteOrder(o.id);
                            }}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <IoTrashOutline size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 text-center text-gray-400"
                    >
                      No hay órdenes que coincidan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <OrderForm
          initial={editing.order}
          isNew={editing.isNew}
          existingIds={orders.map((o) => o.id)}
          providers={providers}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {tracking && (
        <TrackingModal order={tracking} onClose={() => setTracking(null)} />
      )}
    </div>
  );
}
