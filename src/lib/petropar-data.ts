// Fachada de compatibilidad: los datos viven en src/lib/data/. Mantiene los nombres del
// prototipo original para las pantallas que todavía los usan.
import {
  FILTROS_POR_DEFECTO,
  departamentos,
  kpisLogistica,
  metaNacional2026,
  nivelRioParaguayM,
  participacionMercado,
  plantas,
  porDepartamento,
  proyectar,
  serieLogistica,
  serieNacional,
  seriePrecios,
  type ProductoLiquido,
} from "./data";

export {
  kpisComerciales,
  operadores,
  operadoresDetalle,
  presupuestoComercial,
  productosLiquidos,
  type ProductoLiquido,
} from "./data";

export const AGENTE = "Arandu";

export const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep"];

export const ventasMensuales = meses.map((mes, i) => {
  const p = `2026-${String(i + 1).padStart(2, "0")}`;
  return {
    mes,
    diesel: serieNacional.diesel[p] ?? 0,
    naftas: serieNacional.naftas[p] ?? 0,
    glp: serieNacional.glp[p] ?? 0,
    etanol: serieNacional.etanol[p] ?? 0,
  };
}); // millones de litros (GLP en miles de toneladas)

export const ventasLiquidas = ventasMensuales.map((v, i) => ({
  ...v,
  realizado: v.diesel + v.naftas + v.etanol,
  meta: metaNacional2026[i] ?? 0,
}));

const coords = Object.fromEntries(departamentos.map((d) => [d.nombre, d.ciudades[0]]));

export const ventasGeograficas = porDepartamento(FILTROS_POR_DEFECTO).map((d) => ({
  depto: d.depto,
  litros: d.valor,
  meta: d.meta ?? 0,
  lat: coords[d.depto]?.lat ?? 0,
  lng: coords[d.depto]?.lng ?? 0,
}));

export const ventasPorDepartamento = ventasGeograficas.map(({ depto, litros }) => ({
  depto,
  litros,
}));

const ultimos3 = serieLogistica.slice(-3);
export const logistica = {
  kpis: kpisLogistica,
  plantas,
  importaciones: ultimos3.map((m) => ({ mes: m.mes, fluvial: m.fluvial, terrestre: m.terrestre })),
  nivelRioParaguayM,
};

export const mercado = {
  participacion: participacionMercado,
  precios: seriePrecios.slice(-3).map((p) => ({
    mes: p.mes,
    petroparDiesel: p.petroparDiesel,
    mercadoDiesel: p.mercadoDiesel,
    brent: p.brent,
  })),
};

export function proyectarVentas(producto: ProductoLiquido | "total" = "total", ajustePct = 0) {
  return proyectar(producto, ajustePct).meses.map(({ mes, base, escenario }) => ({
    mes,
    base,
    escenario,
  }));
}

export const oportunidades = [
  {
    titulo: "Recuperar el canal mayorista",
    evidencia: "91% de cumplimiento · caída de 2,3%",
    accion: "Revisar cuentas de mayor volumen, frecuencia de compra y condiciones comerciales.",
    pregunta:
      "Analiza la brecha de Distribuidores Mayoristas y propone acciones con su impacto en ML.",
    prioridad: "Alta",
  },
  {
    titulo: "Revisar desvíos de presupuesto",
    evidencia: "Mayoristas: USD 423 M ejecutados vs. USD 405 M presupuestados",
    accion: "Desglosar los USD 18 M de desvío antes de reasignar recursos.",
    pregunta: "Compara presupuesto y ejecución por operador y prioriza los desvíos.",
    prioridad: "Alta",
  },
  {
    titulo: "Potenciar clientes industriales",
    evidencia: "109% de cumplimiento · crecimiento de 11,7%",
    accion: "Evaluar capacidad de abastecimiento antes de ampliar acuerdos industriales.",
    pregunta:
      "¿Qué oportunidades muestran los clientes industriales? Contrasta crecimiento, margen y meta.",
    prioridad: "Media",
  },
  {
    titulo: "Preparar el cierre del año",
    evidencia: "Proyección de octubre a diciembre con estacionalidad de 2025",
    accion: "Contrastar la tendencia con stock, contratos confirmados y la zafra.",
    pregunta:
      "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
    prioridad: "Media",
  },
];
