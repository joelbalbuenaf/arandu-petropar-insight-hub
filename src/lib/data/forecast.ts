// Proyección de demanda: tendencia lineal sobre la serie desestacionalizada, con índices
// estacionales del año 2025. Incluye un backtest honesto (Jul–Sep 2026) para mostrar su error.
import {
  desplazar,
  etiquetaCorta,
  etiquetaPeriodo,
  mesDe,
  periodos,
  ULTIMO_PERIODO,
} from "./periodos";
import { redondear } from "./random";
import { productosLiquidos, serieNacional, type Producto } from "./ventas";

export type ProductoForecast = "total" | Producto;

export const nombreForecast: Record<ProductoForecast, string> = {
  total: "Combustibles líquidos",
  diesel: "Diésel",
  naftas: "Naftas",
  etanol: "Etanol",
  glp: "GLP",
};

function valorEn(producto: ProductoForecast, periodo: string) {
  if (producto === "total")
    return productosLiquidos.reduce((s, p) => s + (serieNacional[p][periodo] ?? 0), 0);
  return serieNacional[producto][periodo] ?? 0;
}

function indicesEstacionales(producto: ProductoForecast) {
  const anio = periodos.filter((p) => p.startsWith("2025"));
  const valores = anio.map((p) => valorEn(producto, p));
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  return valores.map((v) => v / media); // índice por mes 1..12 (posición 0..11)
}

function ajustar(producto: ProductoForecast, hasta: string) {
  const idx = indicesEstacionales(producto);
  const serie = periodos.filter((p) => p <= hasta);
  const y = serie.map((p) => valorEn(producto, p) / (idx[mesDe(p) - 1] ?? 1));
  const n = y.length;
  const xMedia = (n - 1) / 2;
  const yMedia = y.reduce((s, v) => s + v, 0) / n;
  const pendiente =
    y.reduce((s, v, i) => s + (i - xMedia) * (v - yMedia), 0) /
    y.reduce((s, _, i) => s + (i - xMedia) ** 2, 0);
  const predecir = (periodo: string, i: number) =>
    Math.max(0, (yMedia + pendiente * (i - xMedia)) * (idx[mesDe(periodo) - 1] ?? 1));
  // Error relativo del ajuste dentro de la muestra (desvío estándar de los residuos).
  const residuos = serie.map((p, i) => valorEn(producto, p) / (predecir(p, i) || 1) - 1);
  const sigmaRel = Math.sqrt(residuos.reduce((s, r) => s + r * r, 0) / Math.max(1, n - 2));
  return { n, predecir, pendientePorMes: pendiente, sigmaRel };
}

/** z para un intervalo de predicción del 80%. */
const Z80 = 1.2816;

export function proyectar(producto: ProductoForecast = "total", ajustePct = 0, horizonte = 3) {
  const modelo = ajustar(producto, ULTIMO_PERIODO);
  const meses = Array.from({ length: horizonte }, (_, i) => {
    const periodo = desplazar(ULTIMO_PERIODO, i + 1);
    const base = redondear(modelo.predecir(periodo, modelo.n + i), 2);
    // El intervalo se ensancha con el horizonte.
    const margen = base * Z80 * modelo.sigmaRel * Math.sqrt(1 + (i + 1) / modelo.n);
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      etiqueta: etiquetaPeriodo(periodo),
      base,
      minimo: redondear(base - margen, 2),
      maximo: redondear(base + margen, 2),
      escenario: redondear(base * (1 + ajustePct / 100), 2),
    };
  });

  // Backtest: entrenar hasta Jun 2026 y comparar contra Jul–Sep 2026 reales.
  const corte = desplazar(ULTIMO_PERIODO, -3);
  const prueba = ajustar(producto, corte);
  const backtest = [1, 2, 3].map((k) => {
    const periodo = desplazar(corte, k);
    const real = valorEn(producto, periodo);
    const pronostico = redondear(prueba.predecir(periodo, prueba.n + k - 1), 2);
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      real,
      pronostico,
      errorPct: redondear((Math.abs(pronostico - real) / real) * 100, 1),
    };
  });
  const mapePct = redondear(backtest.reduce((s, b) => s + b.errorPct, 0) / backtest.length, 1);

  return {
    producto,
    unidad: producto === "glp" ? "kt" : "ML",
    ajustePct,
    meses,
    totalBase: redondear(
      meses.reduce((s, m) => s + m.base, 0),
      2,
    ),
    totalEscenario: redondear(
      meses.reduce((s, m) => s + m.escenario, 0),
      2,
    ),
    backtest,
    mapePct,
    pendientePorMes: redondear(modelo.pendientePorMes, 2),
    metodo:
      "Tendencia lineal sobre la serie mensual desestacionalizada (Ene 2025 – Sep 2026) con índices estacionales de 2025. Intervalo de predicción del 80% según el error del ajuste. Un solo año de estacionalidad: es una referencia, no un compromiso comercial.",
  };
}

/** Serie histórica + proyección, lista para graficar. */
export function serieConProyeccion(producto: ProductoForecast = "total", ajustePct = 0) {
  const p = proyectar(producto, ajustePct);
  const historico = periodos.map((periodo) => ({
    periodo,
    mes: etiquetaCorta(periodo),
    real: redondear(valorEn(producto, periodo), 2),
  }));
  // El último mes real también abre la proyección, para que las líneas empalmen.
  const ultimo = historico[historico.length - 1];
  if (ultimo)
    Object.assign(ultimo, {
      base: ultimo.real,
      minimo: ultimo.real,
      maximo: ultimo.real,
      ...(ajustePct ? { escenario: ultimo.real } : {}),
    });
  return [
    ...historico,
    ...p.meses.map((m) => ({
      periodo: m.periodo,
      mes: m.mes,
      base: m.base,
      minimo: m.minimo,
      maximo: m.maximo,
      ...(ajustePct ? { escenario: m.escenario } : {}),
    })),
  ];
}
