// Datos de ejemplo (ficticios) para la demo del Hub Analítico de Petropar.
export const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep"];

export const ventasMensuales = [
  { mes: "Ene", diesel: 118, naftas: 64, glp: 21, etanol: 9 },
  { mes: "Feb", diesel: 112, naftas: 61, glp: 20, etanol: 9 },
  { mes: "Mar", diesel: 131, naftas: 66, glp: 22, etanol: 10 },
  { mes: "Abr", diesel: 142, naftas: 65, glp: 24, etanol: 10 },
  { mes: "May", diesel: 149, naftas: 67, glp: 27, etanol: 11 },
  { mes: "Jun", diesel: 138, naftas: 63, glp: 29, etanol: 11 },
  { mes: "Jul", diesel: 135, naftas: 66, glp: 30, etanol: 12 },
  { mes: "Ago", diesel: 140, naftas: 68, glp: 28, etanol: 12 },
  { mes: "Sep", diesel: 152, naftas: 70, glp: 25, etanol: 13 },
]; // millones de litros (GLP en miles de toneladas)

export const kpisComerciales = {
  ventasTotalesMl: 1876,
  facturacionMMUSD: 1642,
  margenBrutoPct: 8.4,
  crecimientoInteranualPct: 6.2,
};

export const ventasPorDepartamento = [
  { depto: "Central", litros: 412 },
  { depto: "Alto Paraná", litros: 236 },
  { depto: "Itapúa", litros: 178 },
  { depto: "Asunción", litros: 165 },
  { depto: "Caaguazú", litros: 121 },
  { depto: "San Pedro", litros: 98 },
  { depto: "Boquerón", litros: 74 },
];

export const logistica = {
  kpis: { stockDiasDiesel: 18, stockDiasNaftas: 22, ocupacionTanquesPct: 71, entregasATiempoPct: 94.3 },
  plantas: [
    { planta: "Villa Elisa", capacidadM3: 120000, stockM3: 86000 },
    { planta: "Hernandarias", capacidadM3: 45000, stockM3: 29500 },
    { planta: "Mauricio J. Troche (alcohol)", capacidadM3: 30000, stockM3: 21800 },
    { planta: "San Antonio (GLP)", capacidadM3: 8000, stockM3: 5100 },
  ],
  importaciones: [
    { mes: "Jul", fluvial: 210, terrestre: 48 },
    { mes: "Ago", fluvial: 195, terrestre: 55 },
    { mes: "Sep", fluvial: 172, terrestre: 66 },
  ], // miles de m3
  nivelRioParaguayM: 0.85,
};

export const mercado = {
  participacion: [
    { empresa: "Petropar", pct: 31 },
    { empresa: "Copetrol", pct: 22 },
    { empresa: "Puma", pct: 14 },
    { empresa: "Shell (Enex)", pct: 12 },
    { empresa: "Petrobras (Copec)", pct: 10 },
    { empresa: "Otros", pct: 11 },
  ],
  precios: [
    { mes: "Jul", petroparDiesel: 7290, mercadoDiesel: 7650, brent: 78 },
    { mes: "Ago", petroparDiesel: 7290, mercadoDiesel: 7700, brent: 80 },
    { mes: "Sep", petroparDiesel: 7390, mercadoDiesel: 7790, brent: 83 },
  ], // Gs por litro, Brent USD/bbl
};

export const operadores = [
  { operador: "Emblemas Petropar Propias", estaciones: 42, litrosMl: 312, crecimientoPct: 8.1, cumplimientoPct: 104 },
  { operador: "Red Franquiciada Norte", estaciones: 61, litrosMl: 268, crecimientoPct: 5.4, cumplimientoPct: 98 },
  { operador: "Red Franquiciada Sur", estaciones: 55, litrosMl: 241, crecimientoPct: 3.2, cumplimientoPct: 95 },
  { operador: "Grandes Clientes Industriales", estaciones: 0, litrosMl: 389, crecimientoPct: 11.7, cumplimientoPct: 109 },
  { operador: "Distribuidores Mayoristas", estaciones: 0, litrosMl: 455, crecimientoPct: -2.3, cumplimientoPct: 91 },
  { operador: "Sector Público", estaciones: 0, litrosMl: 211, crecimientoPct: 4.0, cumplimientoPct: 100 },
];

export const AGENTE = "Arandu";

// Serie homogénea: no sumar GLP (miles de toneladas) con combustibles (ML).
export const productosLiquidos = ["diesel", "naftas", "etanol"] as const;
export type ProductoLiquido = typeof productosLiquidos[number];
export const ventasLiquidas = ventasMensuales.map((v, i) => ({
  ...v, realizado: v.diesel + v.naftas + v.etanol,
  meta: [198, 195, 215, 225, 232, 222, 220, 228, 242][i] ?? 0,
}));
export const operadoresDetalle = operadores.map((o, i) => {
  const metaMl = Number((o.litrosMl / (o.cumplimientoPct / 100)).toFixed(2));
  const presupuestoMUSD = [275, 240, 216, 334, 405, 172][i] ?? 0;
  const ejecutadoMUSD = [272, 247, 222, 322, 423, 156][i] ?? 0;
  return { ...o, metaMl, brechaMl: Number((o.litrosMl - metaMl).toFixed(2)), presupuestoMUSD, ejecutadoMUSD,
    facturacionMUSD: [279, 233, 207, 344, 398, 181][i] ?? 0,
    margenPct: [9.2, 8.1, 7.8, 10.3, 6.4, 8.7][i] ?? 0 };
});
export const ventasGeograficas = ventasPorDepartamento.map((d, i) => ({
  ...d, lat: [-25.35, -25.5, -27.33, -25.29, -25.46, -24.09, -22.35][i] ?? 0,
  lng: [-57.45, -54.64, -55.87, -57.63, -56.02, -57.08, -60.03][i] ?? 0,
  meta: [430, 245, 185, 160, 130, 105, 70][i] ?? 0,
}));
export function proyectarVentas(producto: ProductoLiquido | "total" = "total", ajustePct = 0) {
  const valores = ventasLiquidas.map(v => producto === "total" ? v.realizado : v[producto]);
  const n = valores.length;
  const media = valores.reduce((s, v) => s + v, 0) / n;
  const xMedia = (n - 1) / 2;
  const pendiente = valores.reduce((s, v, i) => s + (i - xMedia) * (v - media), 0) / valores.reduce((s, _, i) => s + (i - xMedia) ** 2, 0);
  return ["Oct", "Nov", "Dic"].map((mes, i) => {
    const base = Number(Math.max(0, media + pendiente * (n + i - xMedia)).toFixed(2));
    return { mes, base, escenario: Number((base * (1 + ajustePct / 100)).toFixed(2)) };
  });
}
export const presupuestoComercial = operadoresDetalle.map(o => ({ operador: o.operador, presupuesto: o.presupuestoMUSD, ejecutado: o.ejecutadoMUSD }));
export const oportunidades = [
  { titulo: "Recuperar el canal mayorista", evidencia: "91% de cumplimiento · caída de 2,3%", accion: "Revisar cuentas de mayor volumen, frecuencia de compra y condiciones comerciales.", pregunta: "Analiza la brecha de Distribuidores Mayoristas y propone acciones con su impacto en ML.", prioridad: "Alta" },
  { titulo: "Revisar desvíos de presupuesto", evidencia: "Mayoristas: USD 423 M ejecutados vs. USD 405 M presupuestados", accion: "Desglosar los USD 18 M de desvío antes de reasignar recursos.", pregunta: "Compara presupuesto y ejecución por operador y prioriza los desvíos.", prioridad: "Alta" },
  { titulo: "Potenciar clientes industriales", evidencia: "109% de cumplimiento · crecimiento de 11,7%", accion: "Evaluar capacidad de abastecimiento antes de ampliar acuerdos industriales.", pregunta: "¿Qué oportunidades muestran los clientes industriales? Contrasta crecimiento, margen y meta.", prioridad: "Media" },
  { titulo: "Preparar el cierre del año", evidencia: "Proyección de octubre a diciembre sobre nueve meses de ejemplo", accion: "Contrastar la tendencia con estacionalidad, stock y contratos confirmados.", pregunta: "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.", prioridad: "Media" },
];

export function contextoDatos() {
  return JSON.stringify({ ventasMensuales, kpisComerciales, ventasPorDepartamento, logistica, mercado, operadores, ventasLiquidas, operadoresDetalle, ventasGeograficas, presupuestoComercial, forecastLiquidos: proyectarVentas(), oportunidades,
    metodologia: "Datos ficticios Ene–Sep 2026. Forecast: regresión lineal mensual de combustibles líquidos, sin estacionalidad ni validación predictiva; no es compromiso comercial. Geografía: siete departamentos seleccionados; coordenadas representativas, no estaciones. Metas y presupuestos son de ejemplo. Ventas por operadores son una serie comercial independiente de la serie mensual por producto; no reconciliar ni tratar como mismo universo. GLP se mide en miles de toneladas y no se suma a ML. Presupuesto: costos comerciales en millones de USD, no facturación." });
}
