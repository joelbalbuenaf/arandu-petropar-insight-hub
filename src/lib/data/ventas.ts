import { departamentos } from "./geografia";
import { anioDe, mesDe, periodos } from "./periodos";
import { crearAzar, entre, redondear, repartir } from "./random";

export const productos = ["diesel", "naftas", "etanol", "glp"] as const;
export type Producto = (typeof productos)[number];
export const productosLiquidos = ["diesel", "naftas", "etanol"] as const;
export type ProductoLiquido = (typeof productosLiquidos)[number];

export const nombreProducto: Record<Producto, string> = {
  diesel: "Diésel",
  naftas: "Naftas",
  etanol: "Etanol",
  glp: "GLP",
};

// Serie nacional Ene–Sep 2026 (ML; GLP en kt). Es la serie original del prototipo y se conserva
// tal cual para que los reportes y cálculos existentes no cambien.
const serie2026: Record<Producto, number[]> = {
  diesel: [118, 112, 131, 142, 149, 138, 135, 140, 152],
  naftas: [64, 61, 66, 65, 67, 63, 66, 68, 70],
  etanol: [9, 9, 10, 10, 11, 11, 12, 12, 13],
  glp: [21, 20, 22, 24, 27, 29, 30, 28, 25],
};

// Crecimiento interanual ficticio 2026 vs. 2025 y estacionalidad de Oct–Dic (relativa a septiembre).
const crecimiento: Record<Producto, number> = {
  diesel: 0.065,
  naftas: 0.04,
  etanol: 0.09,
  glp: 0.02,
};
const cierreDeAnio: Record<Producto, [number, number, number]> = {
  diesel: [1.05, 0.98, 0.94], // siembra de soja en octubre
  naftas: [1.0, 1.01, 1.09], // fiestas de fin de año
  etanol: [1.0, 1.01, 1.08],
  glp: [0.9, 0.84, 0.82], // el GLP baja en verano
};

function construirSerieNacional(): Record<Producto, Record<string, number>> {
  const azar = crearAzar("serie-nacional");
  const out = {} as Record<Producto, Record<string, number>>;
  for (const prod of productos) {
    const serie: Record<string, number> = {};
    serie2026[prod].forEach((v, i) => {
      serie[`2026-${String(i + 1).padStart(2, "0")}`] = v;
      serie[`2025-${String(i + 1).padStart(2, "0")}`] = redondear(
        (v / (1 + crecimiento[prod])) * entre(azar, 0.975, 1.025),
      );
    });
    const sep = serie["2025-09"] ?? 0;
    cierreDeAnio[prod].forEach((f, i) => {
      serie[`2025-${10 + i}`] = redondear(sep * f * entre(azar, 0.985, 1.015));
    });
    out[prod] = serie;
  }
  return out;
}

export const serieNacional = construirSerieNacional();

/** Hechos: volumen por período × departamento × producto. Los departamentos suman exactamente
 *  la serie nacional de cada mes y producto. */
export type HechoVenta = { periodo: string; depto: string; producto: Producto; valor: number };

function construirHechos(): HechoVenta[] {
  const azar = crearAzar("hechos-departamento");
  const hechos: HechoVenta[] = [];
  // Ruido persistente por depto (tendencias propias) + ruido mensual.
  const tendencia = Object.fromEntries(
    departamentos.map((d) => [d.nombre, entre(azar, -0.05, 0.06)]),
  );
  for (const periodo of periodos) {
    const t = (anioDe(periodo) - 2025) * 12 + mesDe(periodo); // 1..21
    for (const prod of productos) {
      const pesos = departamentos.map((d) => {
        const base =
          prod === "glp"
            ? d.pesoGlp
            : prod === "diesel"
              ? d.pesoLiquidos * d.sesgoDiesel
              : d.pesoLiquidos / d.sesgoDiesel;
        return base * (1 + (tendencia[d.nombre] ?? 0) * (t / 21)) * entre(azar, 0.95, 1.05);
      });
      const valores = repartir(serieNacional[prod][periodo] ?? 0, pesos, 2);
      departamentos.forEach((d, i) =>
        hechos.push({ periodo, depto: d.nombre, producto: prod, valor: valores[i] ?? 0 }),
      );
    }
  }
  return hechos;
}

export const hechosVentas = construirHechos();

// Metas 2026 de combustibles líquidos por mes (ML), del prototipo original.
export const metaNacional2026 = [198, 195, 215, 225, 232, 222, 220, 228, 242];

/** Metas mensuales 2026 por departamento (líquidos, ML). Cada mes suma la meta nacional. */
export type MetaDepto = { periodo: string; depto: string; meta: number };

function construirMetas(): MetaDepto[] {
  const azar = crearAzar("metas-departamento");
  // >1: meta exigente (el depto queda bajo meta); <1: meta holgada.
  const exigencia = Object.fromEntries(
    departamentos.map((d) => [d.nombre, entre(azar, 0.94, 1.09)]),
  );
  const metas: MetaDepto[] = [];
  metaNacional2026.forEach((metaMes, i) => {
    const periodo = `2026-${String(i + 1).padStart(2, "0")}`;
    const pesos = departamentos.map((d) => {
      const real = hechosVentas
        .filter((h) => h.periodo === periodo && h.depto === d.nombre && h.producto !== "glp")
        .reduce((s, h) => s + h.valor, 0);
      return real * (exigencia[d.nombre] ?? 1);
    });
    const valores = repartir(metaMes, pesos, 2);
    departamentos.forEach((d, j) =>
      metas.push({ periodo, depto: d.nombre, meta: valores[j] ?? 0 }),
    );
  });
  return metas;
}

export const metasDepto = construirMetas();
