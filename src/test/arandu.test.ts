import { describe, expect, it } from "vitest";
import { construirGrafico, graficosDisponibles, graficoLegado } from "@/lib/charts";
import { separarSugerencias } from "@/components/arandu/AranduMessage";
import { responderEnDemo } from "@/lib/arandu/demo";
import { aMensajesAnthropic } from "@/lib/arandu/historial";
import { ejecutarHerramienta, herramientas } from "@/lib/arandu/tools";
import type { EscritorArandu } from "@/lib/arandu/writer";
import type { ChartSpec } from "@/lib/charts";

function escritorFalso() {
  const texto: string[] = [];
  const herramientasUsadas: string[] = [];
  const graficos: ChartSpec[] = [];
  const w = {
    textoInicio: () => "t",
    textoDelta: (_: string, d: string) => texto.push(d),
    textoFin: () => {},
    razonamientoInicio: () => "r",
    razonamientoDelta: () => {},
    razonamientoFin: () => {},
    herramientaInicio: () => {},
    herramienta: async (nombre: string, _input: unknown, ejecutar: () => unknown) => {
      herramientasUsadas.push(nombre);
      return ejecutar();
    },
    grafico: (g: ChartSpec) => graficos.push(g),
    error: () => {},
  } as unknown as EscritorArandu;
  return { w, texto: () => texto.join(""), herramientasUsadas, graficos };
}

describe("herramientas de Arandu", () => {
  it("cada herramienta corre con una entrada mínima válida", () => {
    const entradas: Record<string, unknown> = {
      consultar_ventas: { agrupar: "departamento" },
      consultar_estaciones: { orden: "menor_aprovechamiento" },
      proyectar_demanda: { producto: "diesel", ajuste_pct: 5 },
      evaluar_sitio: { ciudad: "Luque" },
      crear_grafico: { grafico: "forecast", producto: "total" },
    };
    for (const h of herramientas) {
      const r = ejecutarHerramienta(h.name, entradas[h.name] ?? {});
      expect(r.resultado, h.name).toBeTruthy();
    }
  });

  it("rechaza entradas inválidas", () => {
    expect(() => ejecutarHerramienta("consultar_ventas", { agrupar: "planeta" })).toThrow();
    expect(() => ejecutarHerramienta("no_existe", {})).toThrow();
  });

  it("todos los gráficos del catálogo se construyen con datos", () => {
    for (const g of graficosDisponibles) {
      const spec = construirGrafico({ grafico: g });
      expect(spec.datos.length, g).toBeGreaterThan(0);
      expect(spec.series.length, g).toBeGreaterThan(0);
    }
    expect(graficoLegado("metas")?.tipo).toBe("barras");
    expect(graficoLegado("desconocido")).toBeNull();
  });
});

describe("modo demo", () => {
  const casos: [string, string][] = [
    ["¿Qué operador está por debajo de su meta?", "consultar_operadores"],
    ["Proyecta el diésel con escenario +10%", "proyectar_demanda"],
    ["¿Qué departamento concentra más volumen?", "consultar_ventas"],
    ["¿Dónde hay vacíos de cobertura frente a la competencia?", "analizar_competencia"],
    ["Evalúa un sitio nuevo en Luque", "evaluar_sitio"],
    ["¿Qué prospectos B2B priorizarías?", "buscar_prospectos_b2b"],
    ["¿Qué riesgos plantea el nivel del río?", "consultar_logistica"],
    ["¿Qué alertas atenderías primero?", "detectar_alertas"],
  ];
  for (const [pregunta, herramienta] of casos)
    it(`responde: ${pregunta}`, async () => {
      const f = escritorFalso();
      await responderEnDemo(pregunta, f.w);
      expect(f.herramientasUsadas).toContain(herramienta);
      const { texto, sugerencias } = separarSugerencias(f.texto());
      expect(texto.length).toBeGreaterThan(60);
      expect(sugerencias).toHaveLength(3);
    });
});

describe("historial", () => {
  it("convierte a mensajes de la API empezando por el usuario y resume gráficos", () => {
    const msgs = aMensajesAnthropic([
      { id: "a", role: "assistant", parts: [{ type: "text", text: "hola" }] },
      { id: "b", role: "user", parts: [{ type: "text", text: "ventas?" }] },
      {
        id: "c",
        role: "assistant",
        parts: [
          { type: "data-chart", data: construirGrafico({ grafico: "operadores" }) },
          { type: "text", text: "Listo" },
        ],
      },
    ]);
    expect(msgs[0]?.role).toBe("user");
    expect(String(msgs[1]?.content)).toContain("[Gráfico mostrado:");
  });
});
