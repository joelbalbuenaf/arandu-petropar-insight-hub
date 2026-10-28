// Motor de consulta único: lo usan los dashboards y las herramientas de Arandu, así las cifras
// coinciden en todas partes.
import { departamentos, nombresDepartamentos } from "./geografia";
import {
  desplazar,
  etiquetaCorta,
  etiquetaPeriodo,
  periodos,
  rango,
  ULTIMO_PERIODO,
} from "./periodos";
import { redondear } from "./random";
import { hechosVentas, metasDepto, productosLiquidos, type Producto } from "./ventas";

export type FiltroProducto = "liquidos" | Producto;

export type FiltrosVentas = {
  desde: string;
  hasta: string;
  producto: FiltroProducto;
  depto?: string | undefined;
};

export const FILTROS_POR_DEFECTO: FiltrosVentas = {
  desde: "2026-01",
  hasta: ULTIMO_PERIODO,
  producto: "liquidos",
};

export const unidadDe = (producto: FiltroProducto) => (producto === "glp" ? "kt" : "ML");
export const nombreFiltroProducto: Record<FiltroProducto, string> = {
  liquidos: "Combustibles líquidos",
  diesel: "Diésel",
  naftas: "Naftas",
  etanol: "Etanol",
  glp: "GLP",
};

const coincideProducto = (p: Producto, f: FiltroProducto) =>
  f === "liquidos" ? (productosLiquidos as readonly string[]).includes(p) : p === f;

/** Normaliza filtros que llegan de la URL o de la IA a valores válidos. */
export function normalizarFiltros(f: {
  [K in keyof FiltrosVentas]?: FiltrosVentas[K] | undefined;
}): FiltrosVentas {
  const valido = (p: unknown, def: string) =>
    typeof p === "string" && periodos.includes(p) ? p : def;
  let desde = valido(f.desde, FILTROS_POR_DEFECTO.desde);
  let hasta = valido(f.hasta, FILTROS_POR_DEFECTO.hasta);
  if (desde > hasta) [desde, hasta] = [hasta, desde];
  const producto: FiltroProducto = (
    ["liquidos", "diesel", "naftas", "etanol", "glp"] as const
  ).includes(f.producto as FiltroProducto)
    ? (f.producto as FiltroProducto)
    : "liquidos";
  const depto = f.depto && nombresDepartamentos.includes(f.depto) ? f.depto : undefined;
  return { desde, hasta, producto, depto };
}

export function volumen(f: FiltrosVentas): number {
  let s = 0;
  for (const h of hechosVentas) {
    if (h.periodo < f.desde || h.periodo > f.hasta) continue;
    if (f.depto && h.depto !== f.depto) continue;
    if (!coincideProducto(h.producto, f.producto)) continue;
    s += h.valor;
  }
  return redondear(s, 2);
}

/** Meta de líquidos (solo 2026). `null` si el período o el producto no tienen meta. */
export function meta(f: FiltrosVentas): number | null {
  if (f.producto !== "liquidos") return null;
  const metas = metasDepto.filter(
    (m) => m.periodo >= f.desde && m.periodo <= f.hasta && (!f.depto || m.depto === f.depto),
  );
  if (!metas.length) return null;
  return redondear(
    metas.reduce((s, m) => s + m.meta, 0),
    2,
  );
}

const variacion = (actual: number, base: number | null) =>
  base && base > 0 ? redondear(((actual - base) / base) * 100, 1) : null;

/** Mismo rango desplazado 12 meses atrás, si hay datos. */
function rangoInteranual(f: FiltrosVentas): FiltrosVentas | null {
  const desde = desplazar(f.desde, -12);
  return periodos.includes(desde) ? { ...f, desde, hasta: desplazar(f.hasta, -12) } : null;
}

/** Rango inmediatamente anterior de igual duración, si hay datos. */
function rangoAnterior(f: FiltrosVentas): FiltrosVentas | null {
  const n = rango(f.desde, f.hasta).length;
  const desde = desplazar(f.desde, -n);
  return periodos.includes(desde) ? { ...f, desde, hasta: desplazar(f.desde, -1) } : null;
}

export function resumen(f: FiltrosVentas) {
  const actual = volumen(f);
  const ia = rangoInteranual(f);
  const ant = rangoAnterior(f);
  const interanual = ia ? volumen(ia) : null;
  const anterior = ant ? volumen(ant) : null;
  const m = meta(f);
  return {
    actual,
    unidad: unidadDe(f.producto),
    interanual,
    variacionInteranualPct: variacion(actual, interanual),
    anterior,
    variacionAnteriorPct: variacion(actual, anterior),
    meta: m,
    cumplimientoPct: m ? redondear((actual / m) * 100, 1) : null,
  };
}

export function seriePorPeriodo(f: FiltrosVentas) {
  return rango(f.desde, f.hasta).map((periodo) => {
    const mes = { ...f, desde: periodo, hasta: periodo };
    const prev = desplazar(periodo, -12);
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      etiqueta: etiquetaPeriodo(periodo),
      valor: volumen(mes),
      meta: meta(mes),
      anioAnterior: periodos.includes(prev) ? volumen({ ...mes, desde: prev, hasta: prev }) : null,
    };
  });
}

export function seriePorProducto(f: FiltrosVentas) {
  return rango(f.desde, f.hasta).map((periodo) => {
    const mes = { ...f, desde: periodo, hasta: periodo };
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      diesel: volumen({ ...mes, producto: "diesel" }),
      naftas: volumen({ ...mes, producto: "naftas" }),
      etanol: volumen({ ...mes, producto: "etanol" }),
      glp: volumen({ ...mes, producto: "glp" }),
    };
  });
}

export function porDepartamento(f: FiltrosVentas) {
  const total = volumen({ ...f, depto: undefined });
  return departamentos
    .map((d) => {
      const r = resumen({ ...f, depto: d.nombre });
      return {
        depto: d.nombre,
        region: d.region,
        valor: r.actual,
        meta: r.meta,
        cumplimientoPct: r.cumplimientoPct,
        brecha: r.meta === null ? null : redondear(r.actual - r.meta, 2),
        participacionPct: total ? redondear((r.actual / total) * 100, 1) : 0,
        variacionInteranualPct: r.variacionInteranualPct,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

export function mixProductos(f: FiltrosVentas) {
  const liquidos = productosLiquidos.map((p) => ({
    producto: p,
    valor: volumen({ ...f, producto: p }),
  }));
  const total = liquidos.reduce((s, v) => s + v.valor, 0);
  return liquidos.map((v) => ({
    ...v,
    participacionPct: total ? redondear((v.valor / total) * 100, 1) : 0,
  }));
}
