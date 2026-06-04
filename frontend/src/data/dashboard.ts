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
  anticipo: number;
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
    cajaComprometida: number; // monto - anticipos pagados
  };
  porProveedor: {
    proveedor: string;
    ordenes: number;
    monto: number;
    enRojo: number;
  }[];
  porSemaforo: { name: Semaforo; value: number }[];
  porEstado: { name: EstadoOrden; value: number }[];
  funnel: { etapa: string; ordenes: number }[];
}

// --- Colores compartidos (también los usa el dashboard) ---
export const SEMAFORO_COLORS: Record<Semaforo, string> = {
  ROJO: "#ef4444",
  AMARILLO: "#eab308",
  VERDE: "#22c55e",
  GRIS: "#9ca3af",
};

export const ESTADO_COLORS: Record<EstadoOrden, string> = {
  "EN GESTIÓN": "#60a5fa",
  "EN PRODUCCIÓN": "#a78bfa",
  "PAGADA / EN ESPERA": "#fbbf24",
  COMPLETA: "#34d399",
};

// Índice de etapa: 0 = Sin iniciar, 1..8 = hitos.
export function etapaIndex(e: Etapa): number {
  if (e === "Sin iniciar") return 0;
  return ETAPAS.indexOf(e) + 1;
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
    anticipo: 10000,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
    anticipo: 0,
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
  const cajaComprometida = orders.reduce((s, o) => s + (o.monto - o.anticipo), 0);
  const avancePromedio =
    orders.length === 0
      ? 0
      : orders.reduce((s, o) => s + o.avance, 0) / orders.length;

  const porProveedor = providers.map((p) => {
    const os = orders.filter((o) => o.proveedor === p.nombre);
    return {
      proveedor: p.nombre,
      ordenes: os.length,
      monto: os.reduce((s, o) => s + o.monto, 0),
      enRojo: os.filter((o) => o.semaforo === "ROJO").length,
    };
  });

  const semaforos: Semaforo[] = ["ROJO", "AMARILLO", "VERDE", "GRIS"];
  const porSemaforo = semaforos
    .map((name) => ({
      name,
      value: orders.filter((o) => o.semaforo === name).length,
    }))
    .filter((s) => s.value > 0);

  const estados: EstadoOrden[] = [
    "EN GESTIÓN",
    "EN PRODUCCIÓN",
    "PAGADA / EN ESPERA",
    "COMPLETA",
  ];
  const porEstado = estados
    .map((name) => ({
      name,
      value: orders.filter((o) => o.estado === name).length,
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
      cajaComprometida,
    },
    porProveedor,
    porSemaforo,
    porEstado,
    funnel,
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
