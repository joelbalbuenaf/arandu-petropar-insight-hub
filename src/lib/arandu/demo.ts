/* eslint-disable @typescript-eslint/no-explicit-any -- las plantillas leen resultados JSON de
   herramientas heterogéneas; tiparlos uno a uno no aporta en un modo demo. */
// Modo demo de Arandu (sin API key): interpreta la pregunta con reglas simples y responde con
// las mismas herramientas que usa el agente con Claude. No es IA: está pensado para mostrar el
// Hub sin costo ni conexión, y lo dice explícitamente.
import {
  ciudades,
  etiquetaRango,
  FILTROS_POR_DEFECTO,
  nombreFiltroProducto,
  nombresDepartamentos,
  normalizar,
  operadoresDetalle,
  presetsPeriodo,
  redondear,
  type FiltroProducto,
  type FiltrosVentas,
} from "@/lib/data";
import type { ParametrosGrafico } from "@/lib/charts";
import { ejecutarHerramienta } from "./tools";
import type { EscritorArandu } from "./writer";

const fmt = (n: number | null | undefined, d = 1) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PY", { maximumFractionDigits: d });
const signo = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${n > 0 ? "+" : ""}${fmt(n)}%`;

type Contexto = {
  texto: string;
  filtros: FiltrosVentas;
  ajuste: number | null;
  ciudad: string | null;
};

function leerContexto(pregunta: string): Contexto {
  const texto = normalizar(pregunta);
  const depto = nombresDepartamentos.find((d) => texto.includes(normalizar(d)));
  const producto: FiltroProducto = /\bglp\b|gas licuado/.test(texto)
    ? "glp"
    : /diesel|gasoil/.test(texto)
      ? "diesel"
      : /nafta/.test(texto)
        ? "naftas"
        : /etanol|alcohol/.test(texto)
          ? "etanol"
          : "liquidos";
  const preset = /2025|ano pasado/.test(texto)
    ? presetsPeriodo.find((p) => p.id === "a2025")
    : /trimestre/.test(texto)
      ? presetsPeriodo.find((p) => p.id === "t3")
      : /12 meses|ultimo ano/.test(texto)
        ? presetsPeriodo.find((p) => p.id === "u12")
        : undefined;
  const ajuste = texto.match(/([+-]?\d{1,2})\s*%/);
  const ciudad = ciudades.find((c) => texto.includes(normalizar(c.nombre)))?.nombre ?? null;
  return {
    texto,
    filtros: {
      ...FILTROS_POR_DEFECTO,
      ...(preset ? { desde: preset.desde, hasta: preset.hasta } : {}),
      producto,
      depto,
    },
    ajuste: ajuste
      ? Number(ajuste[1]) *
        (/menor|caida|baja|-\s*\d/.test(texto) && !ajuste[1]?.startsWith("-") ? -1 : 1)
      : null,
    ciudad,
  };
}

type Paso = { herramienta: string; input: Record<string, unknown> };
type Plan = { pasos: Paso[]; componer: (r: Record<string, any>) => string; sugerencias: string[] };

const grafico = (p: ParametrosGrafico): Paso => ({
  herramienta: "crear_grafico",
  input: p as Record<string, unknown>,
});
const ventas = (f: FiltrosVentas, agrupar: string): Paso => ({
  herramienta: "consultar_ventas",
  input: { ...f, agrupar },
});

function tabla(columnas: string[], filas: (string | number)[][]) {
  return [
    `| ${columnas.join(" | ")} |`,
    `| ${columnas.map(() => "---").join(" | ")} |`,
    ...filas.map((f) => `| ${f.join(" | ")} |`),
  ].join("\n");
}

const intenciones: { patron: RegExp; plan: (c: Contexto) => Plan }[] = [
  {
    patron:
      /proyec|forecast|pronost|escenario|cierre del ano|simula|octubre a diciembre|cuarto trimestre/,
    plan: (c) => {
      const prod = c.filtros.producto === "liquidos" ? "total" : c.filtros.producto;
      const comparar = /compar|-10%.*\+10%|escenarios de/.test(c.texto);
      const pasos: Paso[] = comparar
        ? [-10, 0, 10].map((a) => ({
            herramienta: "proyectar_demanda",
            input: { producto: prod, ajuste_pct: a },
          }))
        : [
            {
              herramienta: "proyectar_demanda",
              input: { producto: prod, ajuste_pct: c.ajuste ?? 0 },
            },
          ];
      pasos.push(
        grafico({
          grafico: "forecast",
          producto: prod,
          ajuste_pct: comparar ? 0 : (c.ajuste ?? 0),
        }),
      );
      return {
        pasos,
        sugerencias: [
          "¿Qué datos necesitamos para validar el forecast?",
          "Compara escenarios de demanda de -10%, base y +10%.",
          "¿Cuántos días de stock tenemos y qué riesgo hay?",
        ],
        componer: (r) => {
          const p = r["proyectar_demanda"] as any;
          const lista = (r["proyectar_demanda#all"] as any[]) ?? [p];
          const nombre =
            p.producto === "total"
              ? "combustibles líquidos"
              : nombreFiltroProducto[p.producto as FiltroProducto].toLowerCase();
          const filas = p.meses.map((m: any) => [
            m.etiqueta,
            `${fmt(m.base)} ${p.unidad}`,
            `${fmt(m.minimo)} – ${fmt(m.maximo)}`,
          ]);
          let out = `La proyección de **${nombre}** para octubre–diciembre 2026 suma **${fmt(p.totalBase)} ${p.unidad}** en el escenario base.\n\n${tabla(["Mes", "Base", "Rango probable (80%)"], filas)}\n\n`;
          if (comparar)
            out += `**Escenarios del trimestre:**\n\n${tabla(
              ["Escenario", "Total Oct–Dic"],
              lista.map((x: any) => [
                x.ajustePct ? `${x.ajustePct > 0 ? "+" : ""}${x.ajustePct}%` : "Base",
                `${fmt(x.totalEscenario)} ${p.unidad}`,
              ]),
            )}\n\n`;
          else if (p.ajustePct)
            out += `Con un escenario de **${signo(p.ajustePct)}**, el trimestre llegaría a **${fmt(p.totalEscenario)} ${p.unidad}**.\n\n`;
          out += `**Qué tan confiable es:** en el backtest (entrenando hasta junio y pronosticando julio–septiembre) el error medio fue de **${fmt(p.mapePct)}%** (MAPE). La tendencia subyacente es de ${signo(redondear((p.pendientePorMes / (p.totalBase / 3)) * 100, 1)).replace("%", "% mensual")}.\n\n**Limitaciones:** ${p.metodo} Para validarla harían falta más años de historia, contratos confirmados, la zafra y precios.`;
          return out;
        },
      };
    },
  },
  {
    patron: /presupuesto|gasto|gastan|ejecucion|desvio/,
    plan: () => ({
      pasos: [
        { herramienta: "consultar_operadores", input: {} },
        grafico({ grafico: "presupuesto" }),
      ],
      sugerencias: [
        "Relaciona cumplimiento, margen y ejecución presupuestaria.",
        "¿Qué operador está por debajo de su meta?",
        "¿Qué alertas comerciales atenderías primero?",
      ],
      componer: (r) => {
        const ops = (r["consultar_operadores"].operadores as typeof operadoresDetalle).map((o) => ({
          ...o,
          desvio: o.ejecutadoMUSD - o.presupuestoMUSD,
        }));
        const sobre = ops.filter((o) => o.desvio > 0).sort((a, b) => b.desvio - a.desvio);
        const total = ops.reduce((s, o) => s + o.desvio, 0);
        return `**${sobre.length} de ${ops.length} operadores gastan por encima de su presupuesto**; el desvío neto es de **USD ${fmt(total)} M**. El mayor es **${sobre[0]?.operador}** (USD ${fmt(sobre[0]?.desvio)} M, ${signo(redondear(((sobre[0]?.desvio ?? 0) / (sobre[0]?.presupuestoMUSD ?? 1)) * 100, 1))}).\n\n${tabla(
          ["Operador", "Presupuesto", "Ejecutado", "Desvío", "Cumplimiento meta"],
          ops.map((o) => [
            o.operador,
            `USD ${o.presupuestoMUSD} M`,
            `USD ${o.ejecutadoMUSD} M`,
            `${o.desvio > 0 ? "+" : ""}${o.desvio}`,
            `${fmt(o.cumplimientoPct)}%`,
          ]),
        )}\n\n**Lectura:** Distribuidores Mayoristas combina sobre-ejecución con cumplimiento de 91%: es el desvío a revisar primero. Sector Público y Clientes Industriales gastan por debajo de lo previsto.\n\n*El presupuesto es de costos comerciales, no de ingresos.*`;
      },
    }),
  },
  {
    patron: /operador|mayorista|industrial|margen|productividad|sector publico|franquicia/,
    plan: (c) => {
      const hipotesis = /hipotesis|por que|explica/.test(c.texto) && /mayorista/.test(c.texto);
      return {
        pasos: [
          { herramienta: "consultar_operadores", input: {} },
          grafico({ grafico: "operadores" }),
        ],
        sugerencias: [
          "Compara presupuesto y ejecución por operador y prioriza los desvíos.",
          "¿Qué estaciones están más lejos de su potencial y por qué?",
          "¿Qué prospectos B2B priorizarías y por qué?",
        ],
        componer: (r) => {
          const ops = r["consultar_operadores"].operadores as typeof operadoresDetalle;
          const orden = /margen/.test(c.texto)
            ? [...ops].sort((a, b) => b.margenPct - a.margenPct)
            : /crecimiento|ordena/.test(c.texto)
              ? [...ops].sort((a, b) => b.litrosMl - a.litrosMl)
              : [...ops].sort((a, b) => a.cumplimientoPct - b.cumplimientoPct);
          const bajo = ops.filter((o) => o.cumplimientoPct < 100);
          const may = ops.find((o) => o.operador === "Distribuidores Mayoristas");
          let out = `**${bajo.length} operadores están bajo su meta:** ${bajo.map((o) => `${o.operador} (${fmt(o.cumplimientoPct)}%)`).join(", ")}.\n\n${tabla(
            ["Operador", "Volumen", "Meta", "Brecha", "Crec.", "Margen", "ML/estación"],
            orden.map((o) => [
              o.operador,
              `${fmt(o.litrosMl)} ML`,
              `${fmt(o.metaMl)} ML`,
              fmt(o.brechaMl),
              signo(o.crecimientoPct),
              `${fmt(o.margenPct)}%`,
              o.estaciones ? fmt(o.litrosMl / o.estaciones, 2) : "—",
            ]),
          )}\n\n`;
          if (hipotesis && may)
            out += `**Hipótesis (no verificadas) para la caída del canal mayorista** (${signo(may.crecimientoPct)}, ${fmt(may.cumplimientoPct)}% de meta):\n- Pérdida de cuentas grandes frente a precios de la competencia.\n- Cambios en la frecuencia de compra por stock propio de los distribuidores.\n- Condiciones de crédito menos competitivas.\n\nPara confirmarlas harían falta ventas por cliente, precios pactados y condiciones de pago, que no están en los datos de la demo.`;
          else
            out += `**Acciones sugeridas:**\n1. Recuperar el canal mayorista: brecha de ${fmt(Math.abs(may?.brechaMl ?? 0))} ML y caída de ${signo(may?.crecimientoPct)}.\n2. Asegurar abastecimiento a Grandes Clientes Industriales (109% de meta, mejor margen: 10,3%).\n3. Revisar la Red Franquiciada Sur, al 95% de meta.`;
          return (
            out + "\n\n*Los operadores son un universo independiente de la serie por departamento.*"
          );
        },
      };
    },
  },
  {
    patron: /estacion|potencial|aprovechamiento|red propia/,
    plan: (c) => ({
      pasos: [
        {
          herramienta: "consultar_estaciones",
          input: { orden: "potencial_no_capturado", depto: c.filtros.depto, limite: 8 },
        },
        grafico({ grafico: "estaciones_competencia" }),
      ],
      sugerencias: [
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "Evalúa un sitio nuevo en Luque.",
        "¿Qué operador está por debajo de su meta?",
      ],
      componer: (r) => {
        const e = r["consultar_estaciones"];
        return `La red${c.filtros.depto ? ` en ${c.filtros.depto}` : ""} tiene **${e.cantidad} estaciones** que venden **${fmt(e.ventasMl)} ML** frente a un potencial estimado de **${fmt(e.potencialMl)} ML**: aprovechamiento de **${fmt(e.aprovechamientoPct)}%**.\n\n**Estaciones con más potencial sin capturar:**\n\n${tabla(
          ["Estación", "Operador", "Ventas", "Potencial", "Aprov.", "Competidores 3 km"],
          e.estaciones.map((x: any) => [
            x.nombre,
            x.operador.replace("Emblemas Petropar ", ""),
            `${fmt(x.ventasMl, 2)} ML`,
            `${fmt(x.potencialMl, 2)} ML`,
            `${fmt(x.aprovechamientoPct)}%`,
            x.competidores3km,
          ]),
        )}\n\n**Análisis estadístico:** ${e.correlacionCompetencia.lectura} (r = ${e.correlacionCompetencia.r}, R² = ${e.correlacionCompetencia.r2}).\n\n*Potencial y ubicaciones son ilustrativos (datos ficticios).*`;
      },
    }),
  },
  {
    patron: /competencia|competidor|cobertura|vacio|emblema|copetrol|puma|shell|petrobras/,
    plan: (c) => ({
      pasos: [
        { herramienta: "analizar_competencia", input: { depto: c.filtros.depto } },
        grafico({ grafico: "competencia_emblemas", depto: c.filtros.depto }),
      ],
      sugerencias: [
        "Evalúa un sitio nuevo en Itauguá.",
        "¿Qué estaciones están más lejos de su potencial y por qué?",
        "Grafica la participación de mercado.",
      ],
      componer: (r) => {
        const a = r["analizar_competencia"];
        return `${c.filtros.depto ? `En **${c.filtros.depto}** hay` : "Hay"} **${a.competidores} estaciones de la competencia** frente a **${a.estacionesPetropar} de Petropar**.\n\n${tabla(
          ["Emblema", "Estaciones"],
          a.porEmblema.map((x: any) => [x.emblema, x.estaciones]),
        )}\n\n**Vacíos de cobertura** (competencia presente y Petropar a más de 10 km):\n\n${
          a.vaciosDeCobertura.length
            ? tabla(
                ["Ciudad", "Departamento", "Competidores (6 km)", "Petropar más cercana"],
                a.vaciosDeCobertura.map((v: any) => [
                  v.nombre,
                  v.depto,
                  v.competidores,
                  `${fmt(v.estacionPropiaKm)} km`,
                ]),
              )
            : "No se detectan vacíos con este criterio."
        }\n\nEstas ciudades son candidatas para el **evaluador de sitios**.`;
      },
    }),
  },
  {
    patron:
      /b2b|prospecto|flota|convenio|cliente.*potencial|cooperativa|constructora|transportista|agro/,
    plan: (c) => ({
      pasos: [
        {
          herramienta: "buscar_prospectos_b2b",
          input: { estado: "Prospecto", depto: c.filtros.depto, limite: 8 },
        },
        grafico({ grafico: "prospectos_sector" }),
      ],
      sugerencias: [
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "¿Qué oportunidades muestran los clientes industriales? Contrasta crecimiento, margen y meta.",
        "Prepara un resumen ejecutivo con tres oportunidades, evidencia y próximos pasos.",
      ],
      componer: (r) => {
        const b = r["buscar_prospectos_b2b"];
        return `Hay **${b.cantidad} prospectos B2B**${c.filtros.depto ? ` en ${c.filtros.depto}` : ""} con un consumo estimado de **${fmt(b.consumoTotalM3Mes, 0)} m³/mes**. Los de mayor prioridad (consumo + cercanía a la red + sector):\n\n${tabla(
          ["Empresa", "Sector", "Ciudad", "Consumo", "Petropar más cercana", "Prioridad"],
          b.prospectos.map((p: any) => [
            p.nombre,
            p.sector,
            p.ciudad,
            `${fmt(p.consumoM3Mes, 0)} m³/mes`,
            `${p.estacionCercana} (${fmt(p.estacionCercanaKm)} km)`,
            p.prioridad,
          ]),
        )}\n\n**Próximo paso:** armar una propuesta de convenio de flota para los 3 primeros, anclada en su estación más cercana.\n\n*Empresas y consumos ficticios: no hay un directorio de empresas conectado.*`;
      },
    }),
  },
  {
    patron: /sitio|ubicacion|nueva estacion|abrir una|donde abrir|evalua/,
    plan: (c) => ({
      pasos: [{ herramienta: "evaluar_sitio", input: { ciudad: c.ciudad ?? "Itauguá" } }],
      sugerencias: [
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "Evalúa un sitio nuevo en Santa Rita.",
        "¿Qué estaciones están más lejos de su potencial y por qué?",
      ],
      componer: (r) => {
        const s = r["evaluar_sitio"];
        if (s.error) return s.error;
        return `**${s.recomendacion}**: un sitio cerca de **${s.ciudadCercana}** (${s.depto}) obtiene **${s.puntaje}/100**, con un volumen estimado de **${fmt(s.volumenAnualMl)} ML/año** y una canibalización de ${fmt(s.canibalizacionMl)} ML/año sobre estaciones propias.\n\n${tabla(
          ["Factor", "Valor", "Aporte", "Detalle"],
          s.factores.map((f: any) => [
            f.nombre,
            f.valor,
            `${f.aporte > 0 ? "+" : ""}${f.aporte}`,
            f.explicacion,
          ]),
        )}\n\n*${s.nota}* Podés probar otros puntos en el mapa del **Evaluador de sitios**.`;
      },
    }),
  },
  {
    patron: /stock|planta|tanque|cobertura de|dias de/,
    plan: () => ({
      pasos: [
        { herramienta: "consultar_logistica", input: {} },
        grafico({ grafico: "stock_plantas" }),
      ],
      sugerencias: [
        "¿Qué riesgos plantea el nivel del río?",
        "Compara importaciones fluviales y terrestres.",
        "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
      ],
      componer: (r) => {
        const l = r["consultar_logistica"];
        return `Tenemos **${l.kpis.stockDiasDiesel} días de diésel** y **${l.kpis.stockDiasNaftas} días de naftas**; la ocupación de tanques es del ${fmt(l.kpis.ocupacionTanquesPct)}% y las entregas a tiempo, ${fmt(l.kpis.entregasATiempoPct)}%.\n\n${tabla(
          ["Planta", "Capacidad", "Stock", "Ocupación"],
          l.plantas.map((p: any) => [
            p.planta,
            `${fmt(p.capacidadM3, 0)} m³`,
            `${fmt(p.stockM3, 0)} m³`,
            `${fmt(p.ocupacionPct)}%`,
          ]),
        )}\n\n**Riesgo:** el diésel está bajo el umbral de 20 días y el río Paraguay está en ${l.nivelRioActualM} m, lo que encarece y demora las importaciones fluviales justo antes de la demanda de la siembra (octubre).`;
      },
    }),
  },
  {
    patron: /importaci|fluvial|terrestre|barcaza/,
    plan: () => ({
      pasos: [
        { herramienta: "consultar_logistica", input: {} },
        grafico({ grafico: "importaciones", desde: "2025-01", hasta: "2026-09" }),
      ],
      sugerencias: [
        "¿Qué riesgos plantea el nivel del río?",
        "¿Cuántos días de stock tenemos y qué riesgo hay?",
        "Grafica capacidad y stock por planta.",
      ],
      componer: (r) => {
        const m = r["consultar_logistica"].mensual.slice(-6);
        return `En los últimos meses el transporte **terrestre ganó peso** a medida que bajó el río:\n\n${tabla(
          ["Mes", "Fluvial (miles m³)", "Terrestre (miles m³)", "% terrestre", "Río (m)"],
          m.map((x: any) => [
            x.mes,
            x.fluvial,
            x.terrestre,
            `${fmt((x.terrestre / (x.fluvial + x.terrestre)) * 100)}%`,
            x.nivelRioM,
          ]),
        )}\n\nEl terrestre es más caro por m³; conviene adelantar compras mientras el calado lo permita.`;
      },
    }),
  },
  {
    patron: /rio|bajante|calado|nivel/,
    plan: () => ({
      pasos: [{ herramienta: "consultar_logistica", input: {} }, grafico({ grafico: "nivel_rio" })],
      sugerencias: [
        "Compara importaciones fluviales y terrestres.",
        "¿Cuántos días de stock tenemos y qué riesgo hay?",
        "¿Qué alertas comerciales atenderías primero?",
      ],
      componer: (r) => {
        const l = r["consultar_logistica"];
        const min = [...l.mensual].sort((a: any, b: any) => a.nivelRioM - b.nivelRioM)[0];
        return `El río Paraguay está en **${l.nivelRioActualM} m**, ${min.nivelRioM === l.nivelRioActualM ? "el nivel más bajo" : "cerca del mínimo"} de la serie.\n\n**Riesgos:**\n- **Abastecimiento:** menos calado = barcazas con menos carga y más viajes; las importaciones fluviales cayeron a ${l.mensual.at(-1).fluvial} mil m³.\n- **Costos:** el reemplazo por camión encarece el m³ importado.\n- **Stock:** el diésel está en ${l.kpis.stockDiasDiesel} días, bajo el umbral de 20.\n\n**Acciones:** adelantar compras, priorizar diésel para la siembra y coordinar cupos terrestres.`;
      },
    }),
  },
  {
    patron: /precio|brent|tarifa/,
    plan: () => ({
      pasos: [
        { herramienta: "consultar_mercado", input: {} },
        grafico({ grafico: "precios", desde: "2025-01" }),
      ],
      sugerencias: [
        "Grafica la participación de mercado.",
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
      ],
      componer: (r) => {
        const p = r["consultar_mercado"].precios;
        const u = p.at(-1);
        const ini = p.find((x: any) => x.mes === "Jul 26");
        return `En septiembre 2026 el diésel Petropar está en **Gs ${fmt(u.petroparDiesel, 0)}/L**, **${fmt(((u.mercadoDiesel - u.petroparDiesel) / u.mercadoDiesel) * 100)}% por debajo** del promedio de mercado (Gs ${fmt(u.mercadoDiesel, 0)}/L).\n\nEntre julio y septiembre el Brent subió de USD ${ini.brent} a **USD ${u.brent}/bbl** (${signo(redondear(((u.brent - ini.brent) / ini.brent) * 100, 1))}); Petropar ajustó Gs 100 y el mercado Gs ${fmt(u.mercadoDiesel - ini.mercadoDiesel, 0)}.\n\n**Lectura:** la brecha de precio sostiene la participación (31%), pero comprime el margen si el Brent sigue subiendo.`;
      },
    }),
  },
  {
    patron: /participacion|cuota|market share|mercado/,
    plan: () => ({
      pasos: [
        { herramienta: "consultar_mercado", input: {} },
        grafico({ grafico: "participacion" }),
      ],
      sugerencias: [
        "Compara nuestro precio de diésel con el mercado",
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "¿Qué departamento concentra más volumen?",
      ],
      componer: (r) => {
        const p = r["consultar_mercado"].participacion;
        return `Petropar lidera con **${p[0].pct}%** del mercado, ${p[0].pct - p[1].pct} puntos sobre ${p[1].empresa} (${p[1].pct}%).\n\n${tabla(
          ["Empresa", "Participación"],
          p.map((x: any) => [x.empresa, `${x.pct}%`]),
        )}`;
      },
    }),
  },
  {
    patron: /glp|gas/,
    plan: (c) => ({
      pasos: [
        ventas({ ...c.filtros, producto: "glp", desde: "2025-01" }, "mes"),
        grafico({ grafico: "glp_mensual", desde: "2025-01", depto: c.filtros.depto }),
      ],
      sugerencias: [
        "Analiza el mix de combustibles líquidos.",
        "¿Cuántos días de stock tenemos y qué riesgo hay?",
        "Grafica la evolución mensual de diésel, naftas y etanol.",
      ],
      componer: (r) => {
        const v = r["consultar_ventas"];
        const pico = [...v.desglose].sort((a: any, b: any) => b.valor - a.valor)[0];
        return `El GLP sumó **${fmt(v.actual)} kt** entre enero 2025 y septiembre 2026. Es claramente **estacional**: sube en invierno (pico en ${pico.mes}, ${fmt(pico.valor)} kt) por calefacción y cocina, y baja en verano.\n\n*El GLP se mide en miles de toneladas y no se suma con los combustibles líquidos.*`;
      },
    }),
  },
  {
    patron: /departamento|region|territorio|zona|geograf|concentra|priorizar.*crecer/,
    plan: (c) => ({
      pasos: [
        ventas({ ...c.filtros, depto: undefined }, "departamento"),
        grafico({
          grafico: "ventas_por_departamento",
          producto: c.filtros.producto,
          desde: c.filtros.desde,
          hasta: c.filtros.hasta,
          limite: 10,
        }),
      ],
      sugerencias: [
        "¿Qué estaciones están más lejos de su potencial y por qué?",
        "¿Dónde hay vacíos de cobertura frente a la competencia?",
        "¿Qué datos faltan para analizar ventas por estación?",
      ],
      componer: (r) => {
        const v = r["consultar_ventas"];
        const d = v.desglose as any[];
        const conMeta = d.filter((x) => x.cumplimientoPct !== null);
        const brechas = [...conMeta].sort((a, b) => a.brecha - b.brecha).slice(0, 3);
        return `**${d[0].depto}** concentra el **${fmt(d[0].participacionPct)}%** del volumen (${fmt(d[0].valor)} ${v.unidad}), seguido de ${d[1].depto} (${fmt(d[1].participacionPct)}%) y ${d[2].depto} (${fmt(d[2].participacionPct)}%).\n\n${tabla(
          ["Departamento", "Volumen", "Meta", "Cumplimiento", "Var. interanual"],
          d
            .slice(0, 10)
            .map((x) => [
              x.depto,
              `${fmt(x.valor)} ${v.unidad}`,
              x.meta === null ? "—" : fmt(x.meta),
              x.cumplimientoPct === null ? "—" : `${fmt(x.cumplimientoPct)}%`,
              signo(x.variacionInteranualPct),
            ]),
        )}\n\n${brechas.length ? `**Mayores brechas contra la meta:** ${brechas.map((b) => `${b.depto} (${fmt(b.brecha)} ML, ${fmt(b.cumplimientoPct)}%)`).join(", ")}. Son las primeras regiones a priorizar.` : ""}`;
      },
    }),
  },
  {
    patron: /meta|brecha|cumplimiento|falta para/,
    plan: (c) => ({
      pasos: [
        ventas({ ...c.filtros, producto: "liquidos", desde: "2026-01", hasta: "2026-09" }, "mes"),
        grafico({ grafico: "metas_vs_realizado", depto: c.filtros.depto }),
      ],
      sugerencias: [
        "¿Qué operador está por debajo de su meta?",
        "¿Dónde hay mayor brecha contra la meta?",
        "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
      ],
      componer: (r) => {
        const v = r["consultar_ventas"];
        const meses = v.desglose as any[];
        const debajo = meses.filter((m) => m.meta !== null && m.valor < m.meta);
        return `Ene–Sep 2026${c.filtros.depto ? ` en ${c.filtros.depto}` : ""}: **${fmt(v.actual)} ML** vs. meta de **${fmt(v.meta)} ML** → cumplimiento de **${fmt(v.cumplimientoPct)}%**, brecha acumulada de **${fmt((v.actual ?? 0) - (v.meta ?? 0))} ML**.\n\n${tabla(
          ["Mes", "Realizado", "Meta", "Brecha", "Cumplimiento"],
          meses.map((m) => [
            m.mes,
            fmt(m.valor),
            fmt(m.meta),
            fmt(m.valor - m.meta),
            `${fmt((m.valor / m.meta) * 100)}%`,
          ]),
        )}\n\n${debajo.length} de ${meses.length} meses quedaron bajo la meta. *Metas ficticias de la demo.*`;
      },
    }),
  },
  {
    patron: /alerta|atender|atencion|urgente|riesgo|resumen ejecutivo|oportunidad|prioriz|que hago/,
    plan: () => ({
      pasos: [{ herramienta: "detectar_alertas", input: {} }],
      sugerencias: [
        "Analiza la brecha de Distribuidores Mayoristas y propone acciones con su impacto en ML.",
        "¿Qué riesgos plantea el nivel del río?",
        "¿Qué estaciones están más lejos de su potencial y por qué?",
      ],
      componer: (r) => {
        const a = r["detectar_alertas"];
        const altas = a.alertas.filter((x: any) => x.severidad === "alta");
        return `Detecté **${a.alertas.length} alertas**, ${altas.length} de severidad alta. Lo que atendería primero:\n\n${a.alertas
          .slice(0, 6)
          .map(
            (x: any, i: number) =>
              `${i + 1}. **${x.titulo}** (${x.area}, ${x.severidad}). ${x.detalle}`,
          )
          .join("\n")}\n\n${
          a.mesesAtipicos.length
            ? `**Meses atípicos** (variación interanual fuera de lo habitual, z-score): ${a.mesesAtipicos
                .slice(0, 3)
                .map(
                  (m: any) => `${m.depto} en ${m.etiqueta} (${signo(m.variacionPct)}, z = ${m.z})`,
                )
                .join("; ")}.`
            : ""
        }`;
      },
    }),
  },
  {
    patron: /indicador|kpi|monitorear|tablero/,
    plan: () => ({
      pasos: [
        ventas(FILTROS_POR_DEFECTO, "total"),
        { herramienta: "consultar_logistica", input: {} },
      ],
      sugerencias: [
        "¿Qué alertas comerciales atenderías primero?",
        "¿Qué análisis no podemos realizar aún con estos datos?",
        "Compara presupuesto y ejecución por operador y prioriza los desvíos.",
      ],
      componer: (r) => {
        const v = r["consultar_ventas"];
        const l = r["consultar_logistica"];
        return `Indicadores propuestos para monitorear el plan comercial, con su valor actual:\n\n${tabla(
          ["Indicador", "Actual (Ene–Sep 2026)", "Frecuencia"],
          [
            ["Cumplimiento de meta de líquidos", `${fmt(v.cumplimientoPct)}%`, "Semanal"],
            ["Variación interanual de volumen", signo(v.variacionInteranualPct), "Mensual"],
            ["Días de stock de diésel", `${l.kpis.stockDiasDiesel} días`, "Diaria"],
            ["Entregas a tiempo", `${fmt(l.kpis.entregasATiempoPct)}%`, "Semanal"],
            ["Aprovechamiento del potencial por estación", "Ver red", "Mensual"],
            ["Desvío presupuestario por operador", "Ver presupuesto", "Mensual"],
          ],
        )}`;
      },
    }),
  },
  {
    patron: /no podemos|limitacion|faltan|que datos|validar/,
    plan: () => ({
      pasos: [],
      sugerencias: [
        "Prepara un resumen ejecutivo con tres oportunidades, evidencia y próximos pasos.",
        "¿Qué alertas comerciales atenderías primero?",
        "Evalúa un sitio nuevo en Luque.",
      ],
      componer: () =>
        `Con los datos de esta demo **no podemos** todavía:\n\n- Analizar **ventas reales por estación ni por cliente** (los datos de estaciones y prospectos son ilustrativos).\n- Medir **elasticidad precio-volumen**: falta historia de precios por zona y de la competencia.\n- Validar el **forecast**: hay un solo año de estacionalidad; faltan contratos, zafra y clima.\n- Explicar **causas** de caídas: faltan datos de clientes, crédito y condiciones comerciales.\n- Conectar **SAP / FUELFACS**: no hay integración; requiere acceso autorizado y definiciones de negocio.\n\nCon esas fuentes, las mismas herramientas de Arandu funcionarían sobre datos reales.`,
    }),
  },
  {
    patron: /mix|composicion|participacion de producto/,
    plan: (c) => ({
      pasos: [
        ventas({ ...c.filtros, producto: "liquidos" }, "producto"),
        grafico({
          grafico: "mix_productos",
          depto: c.filtros.depto,
          desde: c.filtros.desde,
          hasta: c.filtros.hasta,
        }),
      ],
      sugerencias: [
        "¿Qué producto creció más entre enero y septiembre?",
        "Grafica el GLP por separado y explica su evolución.",
        "¿Qué departamento concentra más volumen?",
      ],
      componer: (r) => {
        const m = r["consultar_ventas"].desglose.mixLiquidos as any[];
        return `Mix de combustibles líquidos${c.filtros.depto ? ` en ${c.filtros.depto}` : ""} (${etiquetaRango(c.filtros.desde, c.filtros.hasta)}):\n\n${tabla(
          ["Producto", "Volumen", "Participación"],
          m.map((x) => [
            nombreFiltroProducto[x.producto as FiltroProducto],
            `${fmt(x.valor)} ML`,
            `${fmt(x.participacionPct)}%`,
          ]),
        )}\n\nEl diésel domina por el peso del agro y el transporte de carga.`;
      },
    }),
  },
  {
    patron:
      /crecio|crecimiento|mayor venta|mejor mes|caida|cayo|baj|evolucion|mensual|grafica|ventas|vendimos|volumen/,
    plan: (c) => {
      const prods = ["diesel", "naftas", "etanol"] as const;
      return {
        pasos: [
          ventas(c.filtros, "mes"),
          ...prods.map((p) => ventas({ ...c.filtros, producto: p }, "total")),
          grafico(
            c.filtros.producto === "liquidos"
              ? {
                  grafico: "ventas_por_producto",
                  depto: c.filtros.depto,
                  desde: c.filtros.desde,
                  hasta: c.filtros.hasta,
                }
              : {
                  grafico: "ventas_mensuales",
                  producto: c.filtros.producto,
                  depto: c.filtros.depto,
                  desde: c.filtros.desde,
                  hasta: c.filtros.hasta,
                },
          ),
        ],
        sugerencias: [
          "Analiza el mix de combustibles líquidos.",
          "¿Cuál es la brecha acumulada contra la meta?",
          "¿Qué departamento concentra más volumen?",
        ],
        componer: (r) => {
          const todos = r["consultar_ventas#all"] as any[];
          const serie = todos[0];
          const porProd = todos.slice(1);
          const meses = serie.desglose as any[];
          const max = [...meses].sort((a, b) => b.valor - a.valor)[0];
          const caidas = meses.filter((m, i) => i > 0 && m.valor < (meses[i - 1]?.valor ?? 0));
          const crec = porProd
            .map((p, i) => ({ p: prods[i] as FiltroProducto, v: p.variacionInteranualPct }))
            .sort((a, b) => (b.v ?? -99) - (a.v ?? -99));
          return `**${nombreFiltroProducto[serie.filtros.producto as FiltroProducto]}**${serie.filtros.depto ? ` en ${serie.filtros.depto}` : ""}, ${etiquetaRango(serie.filtros.desde, serie.filtros.hasta)}: **${fmt(serie.actual)} ${serie.unidad}**, ${signo(serie.variacionInteranualPct)} interanual.\n\n- **Mejor mes:** ${max.mes} (${fmt(max.valor)} ${serie.unidad}).\n- **Meses con caída vs. el mes anterior:** ${caidas.length ? caidas.map((m) => m.mes).join(", ") : "ninguno"}.\n- **Crecimiento interanual por producto:** ${crec.map((x) => `${nombreFiltroProducto[x.p]} ${signo(x.v)}`).join(" · ")}. El que más creció fue **${nombreFiltroProducto[crec[0]?.p ?? "diesel"]}**.\n\nLas caídas de febrero y junio coinciden con menos días hábiles y el fin de la cosecha; es una hipótesis, no un hecho verificado.`;
        },
      };
    },
  },
];

const sugerenciasGenerales = [
  "¿Qué alertas comerciales atenderías primero?",
  "Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.",
  "¿Dónde hay vacíos de cobertura frente a la competencia?",
];

const pausa = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    setTimeout(resolve, ms);
  });

export async function responderEnDemo(pregunta: string, w: EscritorArandu, signal?: AbortSignal) {
  const c = leerContexto(pregunta);
  const intencion = intenciones.find((i) => i.patron.test(c.texto));
  const plan: Plan = intencion
    ? intencion.plan(c)
    : {
        pasos: [
          ventas(FILTROS_POR_DEFECTO, "total"),
          { herramienta: "detectar_alertas", input: {} },
        ],
        sugerencias: sugerenciasGenerales,
        componer: (r) => {
          const v = r["consultar_ventas"];
          const a = r["detectar_alertas"].alertas.slice(0, 3);
          return `En modo demo entiendo preguntas sobre ventas, metas, departamentos, operadores, presupuesto, forecast, logística, precios, competencia, estaciones, prospectos B2B y evaluación de sitios.\n\nMientras tanto, un panorama: Ene–Sep 2026 se vendieron **${fmt(v.actual)} ML** de líquidos (${signo(v.variacionInteranualPct)} interanual, ${fmt(v.cumplimientoPct)}% de la meta). Alertas principales:\n\n${a.map((x: any) => `- **${x.titulo}**: ${x.detalle}`).join("\n")}`;
        },
      };

  const resultados: Record<string, any> = {};
  for (const paso of plan.pasos) {
    if (signal?.aborted) return;
    const { resultado, graficos } = await w.herramienta(paso.herramienta, paso.input, async () => {
      await pausa(280, signal);
      return ejecutarHerramienta(paso.herramienta, paso.input);
    });
    const todos = (resultados[`${paso.herramienta}#all`] ??= []) as unknown[];
    todos.push(resultado);
    resultados[paso.herramienta] ??= resultado;
    for (const g of graficos ?? []) w.grafico(g);
  }

  const texto = `${plan.componer(resultados)}\n\nSiguientes preguntas:\n${plan.sugerencias.map((s) => `- ${s}`).join("\n")}`;
  const id = w.textoInicio();
  // Simula el ritmo de escritura para que la demo se sienta viva.
  const trozos = texto.match(/\S+\s*/g) ?? [texto];
  for (let i = 0; i < trozos.length; i += 4) {
    if (signal?.aborted) break;
    w.textoDelta(id, trozos.slice(i, i + 4).join(""));
    await pausa(14, signal);
  }
  w.textoFin(id);
}
