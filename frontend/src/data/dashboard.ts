// GEESNA — Modelo de datos del dashboard de órdenes a proveedores.
//
// Por ahora los datos son SIMULADOS (extraídos de GEESNA_dashboard_proveedores_v2.xlsx).
// Cuando el backend esté listo, sólo hay que cambiar el cuerpo de `fetchDashboardData`
// por un `fetch("/api/...")`; los componentes no cambian.

export type Semaforo = "ROJO" | "AMARILLO" | "VERDE" | "GRIS";

export type EstadoOrden =
  | "EN GESTIÓN"
  | "EN PRODUCCIÓN"
  | "PAGADA / EN ESPERA"
  | "COMPLETA";

// Estado de pago derivado del monto pagado vs. el monto de la orden.
export type PagoEstado = "SIN PAGO" | "PARCIAL" | "PAGADO";

// Hitos del proceso, en orden. La orden avanza de izquierda a derecha.
export const ETAPAS = [
  "Cotizar",
  "Aprobar",
  "Info empaque",
  "Anticipo",
  "Producción OK",
  "Sale puerto origen",
  "Llega puerto MX",
  "Llega bodega",
] as const;

export type Etapa = (typeof ETAPAS)[number] | "Sin iniciar";

export interface Order {
  id: string;
  proveedor: string;
  productoSku: string;
  contenedor: string;
  responsable: string;
  monto: number;
  montoPagado: number; // total cobrado al cliente / pagado al proveedor
  etaPuertoMx: string | null; // ISO date
  etaBodega: string | null; // ISO date
  etapaActual: Etapa;
  estado: EstadoOrden;
  avance: number; // 0..1
  semaforo: Semaforo;
  diasSinMovimiento: number | null;
}

export interface Provider {
  nombre: string;
  pais: string;
}

export interface DashboardData {
  providers: Provider[];
  orders: Order[];
  kpis: {
    ordenesTotales: number;
    montoTotal: number;
    ordenesCompletas: number;
    ordenesActivas: number;
    ordenesEnRojo: number;
    avancePromedio: number; // 0..1
    saldoPendiente: number; // suma de saldos por cobrar/pagar
    ordenesSinPago: number; // órdenes en marcha SIN pago registrado
    montoEnRiesgo: number; // monto de esas órdenes
  };
  porProveedor: {
    proveedor: string;
    ordenes: number;
    monto: number;
    enRojo: number;
  }[];
  pagoPorProveedor: {
    proveedor: string;
    pagado: number;
    saldo: number;
  }[];
  porSemaforo: { name: Semaforo; value: number }[];
  porPagoEstado: { name: PagoEstado; value: number }[];
  funnel: { etapa: string; ordenes: number }[];
  // Órdenes en marcha sin pago registrado — el riesgo principal a vigilar.
  alertasPago: Order[];
}

// --- Colores compartidos (también los usa el dashboard) ---
export const SEMAFORO_COLORS: Record<Semaforo, string> = {
  ROJO: "#ef4444",
  AMARILLO: "#eab308",
  VERDE: "#22c55e",
  GRIS: "#9ca3af",
};

export const PAGO_COLORS: Record<PagoEstado, string> = {
  "SIN PAGO": "#ef4444",
  PARCIAL: "#f59e0b",
  PAGADO: "#22c55e",
};

// Índice de etapa: 0 = Sin iniciar, 1..8 = hitos.
export function etapaIndex(e: Etapa): number {
  if (e === "Sin iniciar") return 0;
  return ETAPAS.indexOf(e) + 1;
}

// --- Helpers de pago ---
export function saldo(o: Order): number {
  return Math.max(o.monto - o.montoPagado, 0);
}

export function pagoEstado(o: Order): PagoEstado {
  if (o.montoPagado <= 0) return "SIN PAGO";
  if (o.montoPagado >= o.monto) return "PAGADO";
  return "PARCIAL";
}

// Riesgo de pago: la orden ya está en marcha (aprobada o más avanzada) y tiene
// monto, pero NO se ha registrado ningún pago. Es el caso que el equipo suele
// dejar pasar y el que el dashboard debe resaltar.
export function pagoEnRiesgo(o: Order): boolean {
  return o.monto > 0 && o.montoPagado === 0 && etapaIndex(o.etapaActual) >= 2;
}

// --- Datos simulados (de las hojas FINE CREATIONS y CANPY LINA) ---
const PROVIDERS: Provider[] = [
  { nombre: "Fine Creations", pais: "China" },
  { nombre: "Lina", pais: "China" },
];

const ORDERS: Order[] = [
  // Fine Creations — China
  {
    id: "PB2020251013",
    proveedor: "Fine Creations",
    productoSku: "RED / GEN / 80",
    contenedor: "MSCU1234",
    responsable: "Gerardo",
    monto: 50000,
    montoPagado: 10000, // anticipo
    etaPuertoMx: "2026-05-04",
    etaBodega: "2026-05-05",
    etapaActual: "Producción OK",
    estado: "EN PRODUCCIÓN",
    avance: 0,
    semaforo: "ROJO",
    diasSinMovimiento: null,
  },
  {
    id: "PB2020251014-A",
    proveedor: "Fine Creations",
    productoSku: "NAR / PRO / 180",
    contenedor: "MSCU1235",
    responsable: "Gerardo",
    monto: 70000,
    montoPagado: 0, // ⚠️ aprobada pero sin pago
    etaPuertoMx: "2026-05-05",
    etaBodega: "2026-05-23",
    etapaActual: "Aprobar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "ROJO",
    diasSinMovimiento: null,
  },
  {
    id: "PB2020251014-B",
    proveedor: "Fine Creations",
    productoSku: "BLUE / PRO / 180",
    contenedor: "MSCU1236",
    responsable: "Gerardo",
    monto: 70000,
    montoPagado: 35000, // entregada con saldo pendiente
    etaPuertoMx: "2026-05-15",
    etaBodega: "2026-07-18",
    etapaActual: "Llega bodega",
    estado: "COMPLETA",
    avance: 0.25,
    semaforo: "VERDE",
    diasSinMovimiento: null,
  },
  {
    id: "PB2020251119",
    proveedor: "Fine Creations",
    productoSku: "MIX",
    contenedor: "MSCU1237",
    responsable: "Gerardo",
    monto: 90000,
    montoPagado: 90000,
    etaPuertoMx: "2026-05-16",
    etaBodega: "2026-07-19",
    etapaActual: "Llega bodega",
    estado: "COMPLETA",
    avance: 0.125,
    semaforo: "VERDE",
    diasSinMovimiento: 115,
  },
  {
    id: "PB2020251128",
    proveedor: "Fine Creations",
    productoSku: "NAR / GEN / 80",
    contenedor: "MSCU1238",
    responsable: "",
    monto: 110000,
    montoPagado: 0, // sin iniciar — aún no es riesgo
    etaPuertoMx: "2026-05-17",
    etaBodega: "2026-07-20",
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PB2020260202",
    proveedor: "Fine Creations",
    productoSku: "",
    contenedor: "",
    responsable: "",
    monto: 0,
    montoPagado: 0,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },

  // Lina — China
  {
    id: "PXK-25L1117-1",
    proveedor: "Lina",
    productoSku: "3x3 W R B",
    contenedor: "TCLU9134729",
    responsable: "",
    monto: 13590,
    montoPagado: 13590,
    etaPuertoMx: "2026-01-15",
    etaBodega: "2026-01-30",
    etapaActual: "Llega bodega",
    estado: "COMPLETA",
    avance: 0.375,
    semaforo: "VERDE",
    diasSinMovimiento: 120,
  },
  {
    id: "PXK-25L1117-2",
    proveedor: "Lina",
    productoSku: "2x2 W R B",
    contenedor: "MSNU7986327",
    responsable: "",
    monto: 12240,
    montoPagado: 0, // ⚠️ en producción sin pago
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Producción OK",
    estado: "EN PRODUCCIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-25L1117-3",
    proveedor: "Lina",
    productoSku: "Cubierta / Laterales",
    contenedor: "TIIU4416290",
    responsable: "",
    monto: 21276.4,
    montoPagado: 6000,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Producción OK",
    estado: "EN PRODUCCIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-25L1117-4",
    proveedor: "Lina",
    productoSku: "3x4.5 W R B",
    contenedor: "MSBU5256338",
    responsable: "",
    monto: 14693.8,
    montoPagado: 7000,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Anticipo",
    estado: "PAGADA / EN ESPERA",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-25L1117-5",
    proveedor: "Lina",
    productoSku: "3x6 W R B",
    contenedor: "MEDU4653752",
    responsable: "",
    monto: 14031,
    montoPagado: 7000,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Anticipo",
    estado: "PAGADA / EN ESPERA",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-25L1117-6",
    proveedor: "Lina",
    productoSku: "2x3 W R B",
    contenedor: "MSNU5184549",
    responsable: "",
    monto: 11977.8,
    montoPagado: 0, // ⚠️ info empaque sin pago
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Info empaque",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-25L1117-7",
    proveedor: "Lina",
    productoSku: "residuales",
    contenedor: "MSMU6514615",
    responsable: "",
    monto: 12983.7,
    montoPagado: 0, // ⚠️ aprobada sin pago
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Aprobar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-26L0108 (SG-08)",
    proveedor: "Lina",
    productoSku: "3x3 W R B",
    contenedor: "",
    responsable: "",
    monto: 0,
    montoPagado: 0,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "PXK-26L0112 (SG-09)",
    proveedor: "Lina",
    productoSku: "",
    contenedor: "",
    responsable: "",
    monto: 0,
    montoPagado: 0,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "SG-10",
    proveedor: "Lina",
    productoSku: "",
    contenedor: "",
    responsable: "",
    monto: 0,
    montoPagado: 0,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
  {
    id: "SG-11",
    proveedor: "Lina",
    productoSku: "",
    contenedor: "",
    responsable: "",
    monto: 0,
    montoPagado: 0,
    etaPuertoMx: null,
    etaBodega: null,
    etapaActual: "Sin iniciar",
    estado: "EN GESTIÓN",
    avance: 0,
    semaforo: "GRIS",
    diasSinMovimiento: null,
  },
];

// Deriva KPIs y agregados a partir de las órdenes (una sola fuente de verdad).
function buildDashboard(orders: Order[], providers: Provider[]): DashboardData {
  const montoTotal = orders.reduce((s, o) => s + o.monto, 0);
  const ordenesCompletas = orders.filter((o) => o.estado === "COMPLETA").length;
  const ordenesEnRojo = orders.filter((o) => o.semaforo === "ROJO").length;
  const ordenesActivas = orders.filter((o) => o.estado !== "COMPLETA").length;
  const saldoPendiente = orders.reduce((s, o) => s + saldo(o), 0);
  const avancePromedio =
    orders.length === 0
      ? 0
      : orders.reduce((s, o) => s + o.avance, 0) / orders.length;

  const alertasPago = orders
    .filter(pagoEnRiesgo)
    .sort((a, b) => b.monto - a.monto);
  const ordenesSinPago = alertasPago.length;
  const montoEnRiesgo = alertasPago.reduce((s, o) => s + o.monto, 0);

  const porProveedor = providers.map((p) => {
    const os = orders.filter((o) => o.proveedor === p.nombre);
    return {
      proveedor: p.nombre,
      ordenes: os.length,
      monto: os.reduce((s, o) => s + o.monto, 0),
      enRojo: os.filter((o) => o.semaforo === "ROJO").length,
    };
  });

  const pagoPorProveedor = providers.map((p) => {
    const os = orders.filter((o) => o.proveedor === p.nombre);
    return {
      proveedor: p.nombre,
      pagado: os.reduce((s, o) => s + o.montoPagado, 0),
      saldo: os.reduce((s, o) => s + saldo(o), 0),
    };
  });

  const semaforos: Semaforo[] = ["ROJO", "AMARILLO", "VERDE", "GRIS"];
  const porSemaforo = semaforos
    .map((name) => ({
      name,
      value: orders.filter((o) => o.semaforo === name).length,
    }))
    .filter((s) => s.value > 0);

  // Estado de pago sólo para órdenes con monto (las vacías no aplican).
  const conMonto = orders.filter((o) => o.monto > 0);
  const pagoEstados: PagoEstado[] = ["SIN PAGO", "PARCIAL", "PAGADO"];
  const porPagoEstado = pagoEstados
    .map((name) => ({
      name,
      value: conMonto.filter((o) => pagoEstado(o) === name).length,
    }))
    .filter((s) => s.value > 0);

  // Embudo: cuántas órdenes han alcanzado (al menos) cada hito.
  const funnel = ETAPAS.map((etapa, i) => ({
    etapa,
    ordenes: orders.filter((o) => etapaIndex(o.etapaActual) >= i + 1).length,
  }));

  return {
    providers,
    orders,
    kpis: {
      ordenesTotales: orders.length,
      montoTotal,
      ordenesCompletas,
      ordenesActivas,
      ordenesEnRojo,
      avancePromedio,
      saldoPendiente,
      ordenesSinPago,
      montoEnRiesgo,
    },
    porProveedor,
    pagoPorProveedor,
    porSemaforo,
    porPagoEstado,
    funnel,
    alertasPago,
  };
}

/**
 * Punto único de acceso a los datos del dashboard.
 * Hoy devuelve datos simulados; para conectar el backend reemplaza el cuerpo por:
 *   const res = await fetch("/api/dashboard");
 *   return res.json();
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  // Simula latencia de red.
  await new Promise((r) => setTimeout(r, 300));
  return buildDashboard(ORDERS, PROVIDERS);
}
