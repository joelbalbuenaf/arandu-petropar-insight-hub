// Estadística descriptiva e inferencial simple sobre los datos de la demo.
import { departamentos } from "./geografia";
import { desplazar, etiquetaPeriodo, rango } from "./periodos";
import { volumen, type FiltroProducto } from "./query";
import { redondear } from "./random";
import { estaciones } from "./red";

export const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / (v.length || 1);

export function desvio(v: number[]) {
  const m = media(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, v.length - 1));
}

/** Coeficiente de correlación de Pearson. */
export function correlacion(x: number[], y: number[]) {
  const mx = media(x);
  const my = media(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  x.forEach((xi, i) => {
    const yi = y[i] ?? 0;
    num += (xi - mx) * (yi - my);
    dx += (xi - mx) ** 2;
    dy += (yi - my) ** 2;
  });
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

/** Regresión lineal simple y = a + b·x con R². */
export function regresion(x: number[], y: number[]) {
  const mx = media(x);
  const my = media(y);
  const b =
    x.reduce((s, xi, i) => s + (xi - mx) * ((y[i] ?? 0) - my), 0) /
    x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  const a = my - b * mx;
  const r = correlacion(x, y);
  return { a, b, r, r2: r * r };
}

const fuerza = (r: number) => {
  const a = Math.abs(r);
  return a >= 0.7 ? "fuerte" : a >= 0.4 ? "moderada" : a >= 0.2 ? "débil" : "muy débil o nula";
};

/** ¿La competencia cercana explica el bajo aprovechamiento de las estaciones? */
export function competenciaVsAprovechamiento() {
  const x = estaciones.map((e) => e.competidores3km);
  const y = estaciones.map((e) => e.aprovechamientoPct);
  const reg = regresion(x, y);
  return {
    n: estaciones.length,
    r: redondear(reg.r, 2),
    r2: redondear(reg.r2, 2),
    pendiente: redondear(reg.b, 2),
    lectura: `Correlación ${fuerza(reg.r)} (${reg.r < 0 ? "negativa" : "positiva"}): cada competidor adicional a 3 km se asocia con ${redondear(Math.abs(reg.b), 1)} puntos ${reg.b < 0 ? "menos" : "más"} de aprovechamiento. La competencia explica el ${Math.round(reg.r2 * 100)}% de la variación; correlación no implica causalidad.`,
    puntos: estaciones.map((e) => ({
      nombre: e.nombre,
      competidores: e.competidores3km,
      aprovechamiento: e.aprovechamientoPct,
    })),
  };
}

/** Meses atípicos: variación interanual por departamento con |z| ≥ umbral frente a su propia historia. */
export function mesesAtipicos(producto: FiltroProducto = "liquidos", umbral = 1.8) {
  const meses = rango("2026-01", "2026-09");
  const out: {
    depto: string;
    periodo: string;
    etiqueta: string;
    variacionPct: number;
    z: number;
  }[] = [];
  for (const d of departamentos) {
    const variaciones = meses.map((p) => {
      const f = { desde: p, hasta: p, producto, depto: d.nombre };
      const prev = desplazar(p, -12);
      const base = volumen({ ...f, desde: prev, hasta: prev });
      return base ? ((volumen(f) - base) / base) * 100 : 0;
    });
    const m = media(variaciones);
    const s = desvio(variaciones);
    variaciones.forEach((v, i) => {
      const z = s ? (v - m) / s : 0;
      const periodo = meses[i] ?? "";
      if (Math.abs(z) >= umbral)
        out.push({
          depto: d.nombre,
          periodo,
          etiqueta: etiquetaPeriodo(periodo),
          variacionPct: redondear(v, 1),
          z: redondear(z, 2),
        });
    });
  }
  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}
