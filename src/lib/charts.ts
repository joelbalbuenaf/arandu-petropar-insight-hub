// Catálogo de gráficos: cada gráfico se construye desde la capa de datos, nunca con valores
// provistos por la IA. Lo usan los dashboards y Arandu (la IA solo elige tipo y filtros).
import {
  competencia,
  competenciaVsAprovechamiento,
  emblemas,
  etiquetaRango,
  FILTROS_POR_DEFECTO,
  mixProductos,
  nombreFiltroProducto,
  nombreForecast,
  normalizarFiltros,
  operadoresDetalle,
  participacionMercado,
  plantas,
  porDepartamento,
  presupuestoComercial,
  prospectos,
  sectores,
  serieConProyeccion,
  serieLogistica,
  seriePorPeriodo,
  seriePorProducto,
  seriePrecios,
  unidadDe,
  type FiltroProducto,
  type ProductoForecast,
} from "@/lib/data";

export type TipoGrafico = "linea" | "barras" | "area" | "torta" | "dispersion";

export type ChartSpec = {
  id: string;
  titulo: string;
  tipo: TipoGrafico;
  unidad: string;
  /** Clave del eje X (o de la categoría en torta). */
  x: string;
  series: { clave: string; nombre: string; estilo?: "punteada" | "banda" }[];
  datos: Record<string, string | number | null | undefined>[];
  apilado?: boolean;
  nota?: string;
  /** Pregunta sugerida para profundizar con Arandu. */
  pregunta?: string;
};

export const graficosDisponibles = [
  "ventas_mensuales",
  "ventas_por_producto",
  "ventas_por_departamento",
  "mix_productos",
  "glp_mensual",
  "metas_vs_realizado",
  "operadores",
  "presupuesto",
  "forecast",
  "estaciones_competencia",
  "stock_plantas",
  "importaciones",
  "nivel_rio",
  "precios",
  "participacion",
  "competencia_emblemas",
  "prospectos_sector",
] as const;
export type GraficoId = (typeof graficosDisponibles)[number];

export const descripcionGraficos: Record<GraficoId, string> = {
  ventas_mensuales:
    "Línea mensual de un producto (o líquidos) con meta y año anterior. Filtros: producto, depto, desde, hasta.",
  ventas_por_producto:
    "Barras apiladas mensuales de diésel, naftas y etanol. Filtros: depto, desde, hasta.",
  ventas_por_departamento:
    "Barras de volumen y meta por departamento. Filtros: producto, desde, hasta, limite.",
  mix_productos: "Torta de participación de diésel, naftas y etanol. Filtros: depto, desde, hasta.",
  glp_mensual: "Línea mensual de GLP en kt (unidad propia). Filtros: depto, desde, hasta.",
  metas_vs_realizado:
    "Barras mensuales de líquidos realizado vs. meta (solo 2026). Filtros: depto.",
  operadores: "Barras de volumen realizado vs. meta por operador.",
  presupuesto: "Barras de presupuesto vs. ejecutado (costos comerciales, USD M) por operador.",
  forecast:
    "Histórico + proyección Oct–Dic 2026 con intervalo del 80%. Filtros: producto (total|diesel|naftas|etanol|glp), ajuste_pct.",
  estaciones_competencia:
    "Dispersión: competidores a 3 km vs. aprovechamiento del potencial por estación.",
  stock_plantas: "Barras de capacidad y stock por planta (m³).",
  importaciones: "Barras mensuales de importaciones fluviales y terrestres (miles de m³).",
  nivel_rio: "Línea mensual del nivel del río Paraguay (m).",
  precios: "Línea mensual del precio de diésel Petropar vs. mercado (Gs/L).",
  participacion: "Torta de participación de mercado por empresa.",
  competencia_emblemas: "Barras de estaciones de la competencia por emblema.",
  prospectos_sector: "Barras de prospectos B2B y consumo estimado por sector.",
};

export type ParametrosGrafico = {
  grafico: GraficoId;
  producto?: FiltroProducto | "total" | undefined;
  depto?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  ajuste_pct?: number | undefined;
  limite?: number | undefined;
  titulo?: string | undefined;
};

const nota = "Datos de ejemplo (ficticios).";
let contador = 0;
const nuevoId = (g: string) => `${g}-${(contador++).toString(36)}`;

export function construirGrafico(p: ParametrosGrafico): ChartSpec {
  const productoVentas = p.producto === "total" ? "liquidos" : p.producto;
  const f = normalizarFiltros({
    desde: p.desde,
    hasta: p.hasta,
    producto: productoVentas,
    depto: p.depto,
  });
  const sufijo = `${f.depto ? ` · ${f.depto}` : ""} · ${etiquetaRango(f.desde, f.hasta)}`;
  const base = { id: nuevoId(p.grafico), nota };
  const titulo = (t: string) => p.titulo || t;

  switch (p.grafico) {
    case "ventas_mensuales": {
      const datos = seriePorPeriodo(f);
      const conMeta = datos.some((d) => d.meta !== null);
      return {
        ...base,
        titulo: titulo(`${nombreFiltroProducto[f.producto]}${sufijo}`),
        tipo: "linea",
        unidad: unidadDe(f.producto),
        x: "mes",
        datos,
        series: [
          { clave: "valor", nombre: "Realizado" },
          ...(conMeta ? [{ clave: "meta", nombre: "Meta", estilo: "punteada" as const }] : []),
          { clave: "anioAnterior", nombre: "Año anterior", estilo: "punteada" as const },
        ],
        pregunta: `Analiza la evolución de ${nombreFiltroProducto[f.producto].toLowerCase()}${f.depto ? ` en ${f.depto}` : ""}.`,
      };
    }
    case "ventas_por_producto":
      return {
        ...base,
        titulo: titulo(`Combustibles líquidos por producto${sufijo}`),
        tipo: "barras",
        apilado: true,
        unidad: "ML",
        x: "mes",
        datos: seriePorProducto(f),
        series: [
          { clave: "diesel", nombre: "Diésel" },
          { clave: "naftas", nombre: "Naftas" },
          { clave: "etanol", nombre: "Etanol" },
        ],
        pregunta: "Analiza el mix de combustibles líquidos.",
      };
    case "glp_mensual": {
      const g = { ...f, producto: "glp" as const };
      return {
        ...base,
        titulo: titulo(`GLP${g.depto ? ` · ${g.depto}` : ""} · ${etiquetaRango(g.desde, g.hasta)}`),
        tipo: "area",
        unidad: "kt",
        x: "mes",
        datos: seriePorPeriodo(g),
        series: [
          { clave: "valor", nombre: "GLP" },
          { clave: "anioAnterior", nombre: "Año anterior", estilo: "punteada" },
        ],
        nota: "GLP en miles de toneladas: no se suma con combustibles líquidos.",
        pregunta: "Grafica el GLP por separado y explica su evolución.",
      };
    }
    case "ventas_por_departamento": {
      const filas = porDepartamento(f).slice(0, p.limite ?? 18);
      const conMeta = filas.some((d) => d.meta !== null);
      return {
        ...base,
        titulo: titulo(
          `${nombreFiltroProducto[f.producto]} por departamento · ${etiquetaRango(f.desde, f.hasta)}`,
        ),
        tipo: "barras",
        unidad: unidadDe(f.producto),
        x: "depto",
        datos: filas,
        series: [
          { clave: "valor", nombre: "Realizado" },
          ...(conMeta ? [{ clave: "meta", nombre: "Meta" }] : []),
        ],
        pregunta: "¿Dónde hay mayor brecha contra la meta?",
      };
    }
    case "mix_productos":
      return {
        ...base,
        titulo: titulo(`Mix de líquidos${sufijo}`),
        tipo: "torta",
        unidad: "ML",
        x: "nombre",
        datos: mixProductos(f).map((m) => ({ ...m, nombre: nombreFiltroProducto[m.producto] })),
        series: [{ clave: "valor", nombre: "Volumen" }],
      };
    case "metas_vs_realizado": {
      const m = { ...f, producto: "liquidos" as const, desde: "2026-01", hasta: "2026-09" };
      return {
        ...base,
        titulo: titulo(`Metas vs. realizado · líquidos${m.depto ? ` · ${m.depto}` : ""} · 2026`),
        tipo: "barras",
        unidad: "ML",
        x: "mes",
        datos: seriePorPeriodo(m),
        series: [
          { clave: "valor", nombre: "Realizado" },
          { clave: "meta", nombre: "Meta" },
        ],
        nota: "Metas ficticias definidas solo para 2026.",
        pregunta: "¿Cuál es la brecha acumulada contra la meta?",
      };
    }
    case "operadores":
      return {
        ...base,
        titulo: titulo("Operadores · realizado vs. meta · Ene–Sep 2026"),
        tipo: "barras",
        unidad: "ML",
        x: "operador",
        datos: operadoresDetalle,
        series: [
          { clave: "litrosMl", nombre: "Realizado" },
          { clave: "metaMl", nombre: "Meta" },
        ],
        nota: "Universo comercial por operador, independiente de la serie por departamento.",
        pregunta: "¿Qué operador está por debajo de su meta?",
      };
    case "presupuesto":
      return {
        ...base,
        titulo: titulo("Presupuesto comercial vs. ejecutado · USD M"),
        tipo: "barras",
        unidad: "USD M",
        x: "operador",
        datos: presupuestoComercial,
        series: [
          { clave: "presupuesto", nombre: "Presupuesto" },
          { clave: "ejecutado", nombre: "Ejecutado" },
        ],
        nota: "Costos comerciales, no ingresos.",
        pregunta: "Compara presupuesto y ejecución por operador y prioriza los desvíos.",
      };
    case "forecast": {
      const prod = (
        p.producto === "liquidos" || !p.producto ? "total" : p.producto
      ) as ProductoForecast;
      const ajuste = p.ajuste_pct ?? 0;
      return {
        ...base,
        titulo: titulo(
          `Proyección · ${nombreForecast[prod]}${ajuste ? ` · escenario ${ajuste > 0 ? "+" : ""}${ajuste}%` : ""}`,
        ),
        tipo: "linea",
        unidad: prod === "glp" ? "kt" : "ML",
        x: "mes",
        datos: serieConProyeccion(prod, ajuste),
        series: [
          { clave: "real", nombre: "Real" },
          { clave: "base", nombre: "Proyección", estilo: "punteada" },
          { clave: "minimo", nombre: "Mínimo (80%)", estilo: "banda" },
          { clave: "maximo", nombre: "Máximo (80%)", estilo: "banda" },
          ...(ajuste
            ? [{ clave: "escenario", nombre: `Escenario ${ajuste}%`, estilo: "punteada" as const }]
            : []),
        ],
        nota: "Tendencia + estacionalidad de 2025; intervalo de predicción del 80%. No es una predicción validada.",
        pregunta:
          "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
      };
    }
    case "estaciones_competencia": {
      const c = competenciaVsAprovechamiento();
      return {
        ...base,
        titulo: titulo(`Competencia vs. aprovechamiento · r = ${c.r}`),
        tipo: "dispersion",
        unidad: "%",
        x: "competidores",
        datos: c.puntos,
        series: [{ clave: "aprovechamiento", nombre: "Aprovechamiento del potencial" }],
        nota: c.lectura,
        pregunta: "¿Qué estaciones están más lejos de su potencial y por qué?",
      };
    }
    case "stock_plantas":
      return {
        ...base,
        titulo: titulo("Capacidad y stock por planta · m³"),
        tipo: "barras",
        unidad: "m³",
        x: "planta",
        datos: plantas,
        series: [
          { clave: "capacidadM3", nombre: "Capacidad" },
          { clave: "stockM3", nombre: "Stock" },
        ],
        pregunta: "¿Cuántos días de stock tenemos y qué riesgo hay?",
      };
    case "importaciones":
      return {
        ...base,
        titulo: titulo("Importaciones · miles de m³"),
        tipo: "barras",
        apilado: true,
        unidad: "miles m³",
        x: "mes",
        datos: serieLogistica.filter((s) => s.periodo >= f.desde && s.periodo <= f.hasta),
        series: [
          { clave: "fluvial", nombre: "Fluvial" },
          { clave: "terrestre", nombre: "Terrestre" },
        ],
        pregunta: "Compara importaciones fluviales y terrestres.",
      };
    case "nivel_rio":
      return {
        ...base,
        titulo: titulo("Nivel del río Paraguay · m"),
        tipo: "area",
        unidad: "m",
        x: "mes",
        datos: serieLogistica,
        series: [{ clave: "nivelRioM", nombre: "Nivel del río" }],
        pregunta: "¿Qué riesgos plantea el nivel del río?",
      };
    case "precios":
      return {
        ...base,
        titulo: titulo("Precio del diésel · Gs/L"),
        tipo: "linea",
        unidad: "Gs/L",
        x: "mes",
        datos: seriePrecios.filter((s) => s.periodo >= f.desde && s.periodo <= f.hasta),
        series: [
          { clave: "petroparDiesel", nombre: "Petropar" },
          { clave: "mercadoDiesel", nombre: "Mercado" },
        ],
        pregunta: "Compara nuestro precio de diésel con el mercado",
      };
    case "participacion":
      return {
        ...base,
        titulo: titulo("Participación de mercado · %"),
        tipo: "torta",
        unidad: "%",
        x: "empresa",
        datos: participacionMercado,
        series: [{ clave: "pct", nombre: "Participación" }],
        pregunta: "Grafica la participación de mercado.",
      };
    case "competencia_emblemas":
      return {
        ...base,
        titulo: titulo(`Estaciones de la competencia${f.depto ? ` · ${f.depto}` : ""}`),
        tipo: "barras",
        unidad: "estaciones",
        x: "emblema",
        datos: emblemas.map((e) => ({
          emblema: e,
          estaciones: competencia.filter(
            (c) => c.emblema === e && (!f.depto || c.depto === f.depto),
          ).length,
        })),
        series: [{ clave: "estaciones", nombre: "Estaciones" }],
        pregunta: "¿Dónde hay vacíos de cobertura frente a la competencia?",
      };
    case "prospectos_sector":
      return {
        ...base,
        titulo: titulo("Prospectos B2B por sector"),
        tipo: "barras",
        unidad: "m³/mes",
        x: "sector",
        datos: sectores.map((s) => {
          const lista = prospectos.filter((x) => x.sector === s && x.estado !== "Cliente actual");
          return {
            sector: s,
            prospectos: lista.length,
            consumoM3Mes: lista.reduce((t, x) => t + x.consumoM3Mes, 0),
          };
        }),
        series: [{ clave: "consumoM3Mes", nombre: "Consumo estimado" }],
        pregunta: "¿Qué prospectos B2B priorizarías y por qué?",
      };
  }
}

/** Marcadores del prototipo original ([[grafico:id]]) → gráficos del catálogo. */
const legado: Record<string, ParametrosGrafico> = {
  ventas: { grafico: "ventas_por_producto" },
  glp: { grafico: "glp_mensual" },
  territorio: { grafico: "ventas_por_departamento", limite: 10 },
  operadores: { grafico: "operadores" },
  metas: { grafico: "metas_vs_realizado" },
  presupuesto: { grafico: "presupuesto" },
  forecast: { grafico: "forecast" },
  stock: { grafico: "stock_plantas" },
  importaciones: { grafico: "importaciones", ...FILTROS_POR_DEFECTO },
  mercado: { grafico: "participacion" },
  precios: { grafico: "precios" },
};

export const graficoLegado = (id: string) => (legado[id] ? construirGrafico(legado[id]) : null);
