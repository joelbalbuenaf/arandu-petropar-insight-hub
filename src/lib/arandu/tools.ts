// Herramientas de Arandu. Las comparten el agente con Claude y el modo demo sin IA:
// todas leen la capa de datos (src/lib/data) y devuelven resultados compactos.
import * as z from "zod/v4";
import { construirGrafico, graficosDisponibles, type ChartSpec } from "@/lib/charts";
import {
  competencia,
  competenciaVsAprovechamiento,
  detectarAlertas,
  emblemas,
  estaciones,
  evaluarSitio,
  kpisComerciales,
  kpisLogistica,
  mesesAtipicos,
  mixProductos,
  nivelRioParaguayM,
  nombresDepartamentos,
  nombresOperadores,
  normalizarFiltros,
  operadoresDetalle,
  participacionMercado,
  periodos,
  plantas,
  porDepartamento,
  prospectos,
  proyectar,
  redondear,
  resumen,
  sectores,
  serieLogistica,
  seriePorPeriodo,
  seriePorProducto,
  seriePrecios,
  vaciosDeCobertura,
  ciudades,
  normalizar,
} from "@/lib/data";

const producto = z
  .enum(["liquidos", "diesel", "naftas", "etanol", "glp"])
  .describe("liquidos = diésel + naftas + etanol (ML). GLP va en kt y nunca se suma con líquidos.");
const periodo = z
  .string()
  .regex(/^\d{4}-\d{2}$/)
  .describe(`Mes AAAA-MM entre ${periodos[0]} y ${periodos[periodos.length - 1]}.`);
const depto = z.enum(nombresDepartamentos as [string, ...string[]]);

export type ResultadoHerramienta = { resultado: unknown; graficos?: ChartSpec[] };

type Definicion<S extends z.ZodType> = {
  name: string;
  /** Texto corto para mostrar mientras corre ("Consultando ventas…"). */
  etiqueta: string;
  description: string;
  inputSchema: S;
  run: (input: z.infer<S>) => ResultadoHerramienta;
};

const definir = <S extends z.ZodType>(d: Definicion<S>) => d;

export const herramientas = [
  definir({
    name: "consultar_ventas",
    etiqueta: "Consultando ventas",
    description:
      "Ventas de Petropar por período, producto y departamento (Ene 2025 – Sep 2026). Devuelve resumen con variación interanual, variación vs. período anterior, meta y cumplimiento (metas solo 2026, solo líquidos) y el desglose pedido.",
    inputSchema: z.object({
      producto: producto.optional(),
      desde: periodo.optional(),
      hasta: periodo.optional(),
      depto: depto.optional(),
      agrupar: z
        .enum(["total", "mes", "departamento", "producto"])
        .describe("Desglose a devolver."),
    }),
    run: (i) => {
      const f = normalizarFiltros(i);
      const r = resumen(f);
      const desglose =
        i.agrupar === "mes"
          ? seriePorPeriodo(f).map(({ etiqueta, valor, meta, anioAnterior }) => ({
              mes: etiqueta,
              valor,
              meta,
              anioAnterior,
            }))
          : i.agrupar === "departamento"
            ? porDepartamento(f)
            : i.agrupar === "producto"
              ? { mixLiquidos: mixProductos(f), mensualPorProducto: seriePorProducto(f) }
              : undefined;
      return { resultado: { filtros: f, ...r, desglose } };
    },
  }),
  definir({
    name: "consultar_operadores",
    etiqueta: "Revisando operadores",
    description:
      "Desempeño Ene–Sep 2026 por operador: volumen (ML), meta, brecha, crecimiento, cumplimiento, margen, facturación y presupuesto de costos comerciales vs. ejecutado (USD M). Universo independiente de la serie por departamento.",
    inputSchema: z.object({}),
    run: () => ({ resultado: { operadores: operadoresDetalle, kpisComerciales } }),
  }),
  definir({
    name: "consultar_estaciones",
    etiqueta: "Analizando estaciones",
    description:
      "Red de 158 estaciones Petropar (propias y franquiciadas): ventas Ene–Sep 2026, potencial de la zona, aprovechamiento, competidores a 3 km, formato y tienda. Incluye correlación competencia vs. aprovechamiento.",
    inputSchema: z.object({
      operador: z.enum(nombresOperadores.slice(0, 3) as [string, ...string[]]).optional(),
      depto: depto.optional(),
      orden: z.enum(["ventas", "menor_aprovechamiento", "potencial_no_capturado"]),
      limite: z.number().int().min(1).max(30).optional(),
    }),
    run: (i) => {
      const lista = estaciones.filter(
        (e) => (!i.operador || e.operador === i.operador) && (!i.depto || e.depto === i.depto),
      );
      const ordenada = [...lista].sort((a, b) =>
        i.orden === "ventas"
          ? b.ventasMl - a.ventasMl
          : i.orden === "menor_aprovechamiento"
            ? a.aprovechamientoPct - b.aprovechamientoPct
            : b.potencialMl - b.ventasMl - (a.potencialMl - a.ventasMl),
      );
      const total = lista.reduce((s, e) => s + e.ventasMl, 0);
      const potencial = lista.reduce((s, e) => s + e.potencialMl, 0);
      const c = competenciaVsAprovechamiento();
      return {
        resultado: {
          cantidad: lista.length,
          ventasMl: redondear(total, 2),
          potencialMl: redondear(potencial, 2),
          aprovechamientoPct: potencial ? redondear((total / potencial) * 100, 1) : null,
          estaciones: ordenada.slice(0, i.limite ?? 10).map(({ mensual, ...e }) => e),
          correlacionCompetencia: { r: c.r, r2: c.r2, lectura: c.lectura },
        },
      };
    },
  }),
  definir({
    name: "consultar_logistica",
    etiqueta: "Revisando logística",
    description:
      "Stock y capacidad por planta, días de cobertura, entregas a tiempo, importaciones fluviales/terrestres mensuales y nivel del río Paraguay (Ene 2025 – Sep 2026).",
    inputSchema: z.object({}),
    run: () => ({
      resultado: {
        kpis: kpisLogistica,
        nivelRioActualM: nivelRioParaguayM,
        plantas: plantas.map((p) => ({
          ...p,
          ocupacionPct: redondear((p.stockM3 / p.capacidadM3) * 100, 1),
        })),
        mensual: serieLogistica.map(({ periodo: _p, ...s }) => s),
      },
    }),
  }),
  definir({
    name: "consultar_mercado",
    etiqueta: "Revisando mercado",
    description:
      "Participación de mercado por empresa y precios mensuales de diésel y nafta (Petropar vs. mercado, Gs/L) con Brent (USD/bbl).",
    inputSchema: z.object({}),
    run: () => ({
      resultado: {
        participacion: participacionMercado,
        precios: seriePrecios.map(({ periodo: _p, ...s }) => s),
      },
    }),
  }),
  definir({
    name: "proyectar_demanda",
    etiqueta: "Proyectando demanda",
    description:
      "Proyección Oct–Dic 2026: tendencia lineal desestacionalizada con estacionalidad de 2025, intervalo de predicción del 80%, backtest Jul–Sep 2026 (MAPE) y escenario opcional (ajuste %).",
    inputSchema: z.object({
      producto: z
        .enum(["total", "diesel", "naftas", "etanol", "glp"])
        .describe("total = combustibles líquidos."),
      ajuste_pct: z
        .number()
        .min(-50)
        .max(50)
        .optional()
        .describe("Escenario: variación % sobre la base."),
    }),
    run: (i) => ({ resultado: proyectar(i.producto, i.ajuste_pct ?? 0) }),
  }),
  definir({
    name: "detectar_alertas",
    etiqueta: "Buscando alertas",
    description:
      "Alertas priorizadas (metas, presupuesto, stock, río, precios, red) y meses atípicos por departamento según z-score de la variación interanual.",
    inputSchema: z.object({}),
    run: () => ({
      resultado: {
        alertas: detectarAlertas().map(({ enlace: _e, ...a }) => a),
        mesesAtipicos: mesesAtipicos().slice(0, 8),
      },
    }),
  }),
  definir({
    name: "analizar_competencia",
    etiqueta: "Analizando competencia",
    description:
      "Estaciones de la competencia por emblema y departamento, y ciudades con competencia sin estación Petropar a menos de 10 km.",
    inputSchema: z.object({ depto: depto.optional() }),
    run: (i) => {
      const lista = competencia.filter((c) => !i.depto || c.depto === i.depto);
      const propias = estaciones.filter((e) => !i.depto || e.depto === i.depto).length;
      return {
        resultado: {
          competidores: lista.length,
          estacionesPetropar: propias,
          porEmblema: emblemas.map((e) => ({
            emblema: e,
            estaciones: lista.filter((c) => c.emblema === e).length,
          })),
          vaciosDeCobertura: vaciosDeCobertura()
            .filter((v) => !i.depto || v.depto === i.depto)
            .map(({ lat: _a, lng: _b, peso: _c, ...v }) => v),
        },
      };
    },
  }),
  definir({
    name: "buscar_prospectos_b2b",
    etiqueta: "Buscando prospectos B2B",
    description:
      "Prospectos B2B ficticios (flotas, agro, constructoras, cooperativas…) con consumo estimado, estación Petropar más cercana y prioridad 0–100.",
    inputSchema: z.object({
      sector: z.enum(sectores).optional(),
      depto: depto.optional(),
      estado: z.enum(["Prospecto", "En negociación", "Cliente actual"]).optional(),
      limite: z.number().int().min(1).max(25).optional(),
    }),
    run: (i) => {
      const lista = prospectos.filter(
        (p) =>
          (!i.sector || p.sector === i.sector) &&
          (!i.depto || p.depto === i.depto) &&
          (!i.estado || p.estado === i.estado),
      );
      return {
        resultado: {
          cantidad: lista.length,
          consumoTotalM3Mes: lista.reduce((s, p) => s + p.consumoM3Mes, 0),
          prospectos: lista.slice(0, i.limite ?? 10).map(({ lat: _a, lng: _b, ...p }) => p),
        },
      };
    },
  }),
  definir({
    name: "evaluar_sitio",
    etiqueta: "Evaluando sitio",
    description:
      "Puntaje 0–100 para una posible estación nueva: demanda del entorno, tráfico de ruta, competencia y canibalización a 5 km, con volumen anual estimado. Indicar una ciudad o coordenadas.",
    inputSchema: z.object({
      ciudad: z.string().optional().describe("Nombre de ciudad paraguaya."),
      lat: z.number().min(-28).max(-19).optional(),
      lng: z.number().min(-63).max(-54).optional(),
    }),
    run: (i) => {
      let punto =
        i.lat !== undefined && i.lng !== undefined ? { lat: i.lat, lng: i.lng } : undefined;
      if (!punto && i.ciudad) {
        const c = ciudades.find((x) => normalizar(x.nombre).includes(normalizar(i.ciudad ?? "")));
        if (c) punto = { lat: c.lat + 0.01, lng: c.lng + 0.01 };
      }
      if (!punto)
        return {
          resultado: {
            error:
              "Ciudad no encontrada. Ciudades disponibles: " +
              ciudades.map((c) => c.nombre).join(", "),
          },
        };
      return { resultado: evaluarSitio(punto) };
    },
  }),
  definir({
    name: "crear_grafico",
    etiqueta: "Preparando gráfico",
    description:
      "Muestra al usuario un gráfico del catálogo. Los valores los calcula el sistema desde los datos: tú solo eliges el gráfico y sus filtros. Úsalo cuando un gráfico ayude o el usuario lo pida (máximo 3 por respuesta).",
    inputSchema: z.object({
      grafico: z.enum(graficosDisponibles),
      producto: z.enum(["liquidos", "total", "diesel", "naftas", "etanol", "glp"]).optional(),
      depto: depto.optional(),
      desde: periodo.optional(),
      hasta: periodo.optional(),
      ajuste_pct: z.number().min(-50).max(50).optional(),
      limite: z.number().int().min(3).max(18).optional(),
      titulo: z.string().max(90).optional(),
    }),
    run: (i) => {
      const g = construirGrafico(i);
      return {
        resultado: { mostrado: true, titulo: g.titulo, unidad: g.unidad, puntos: g.datos.length },
        graficos: [g],
      };
    },
  }),
];

export type Herramienta = (typeof herramientas)[number];

export function buscarHerramienta(nombre: string) {
  return herramientas.find((h) => h.name === nombre);
}

/** Ejecuta una herramienta validando la entrada con su esquema. */
export function ejecutarHerramienta(nombre: string, input: unknown): ResultadoHerramienta {
  const h = buscarHerramienta(nombre);
  if (!h) throw new Error(`Herramienta desconocida: ${nombre}`);
  const parsed = h.inputSchema.parse(input) as never;
  return (h.run as (i: never) => ResultadoHerramienta)(parsed);
}
