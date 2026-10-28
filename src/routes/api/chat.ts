import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/lib/ai/responses";
import { contextoDatos } from "@/lib/petropar-data";

const INSTRUCCIONES = `Eres Arandu, el agente analítico de Petropar (Petróleos Paraguayos), empresa estatal que importa, almacena, distribuye y comercializa combustibles, GLP y produce etanol.
Respondes en español, de forma clara y ejecutiva, con cifras, comparaciones y tablas markdown cuando ayuden.
Usa SOLO estos datos (de ejemplo) del Hub. Unidades: ventas en millones de litros (GLP en miles de toneladas), precios en Gs/litro, importaciones en miles de m3.
Si algo no está en los datos, dilo y sugiere qué dato haría falta.
Incluye evidencia, brecha contra la meta o presupuesto cuando corresponda, y acciones priorizadas. Diferencia hechos, hipótesis y oportunidades; no atribuyas causas sin evidencia. Nunca prometas responder todas las preguntas: explica las limitaciones de los datos.
Los combustibles líquidos (diésel, naftas, etanol) se suman en ML; GLP va separado. Los operadores son un universo independiente y no se reconcilian con la serie mensual. Metas y presupuestos son ficticios. Presupuesto representa costos comerciales, no ingresos.
Para acompañar el análisis con gráficos del Hub, emite al final hasta tres marcadores exactos: [[grafico:ventas]], [[grafico:glp]], [[grafico:territorio]], [[grafico:operadores]], [[grafico:metas]], [[grafico:presupuesto]], [[grafico:forecast]], [[grafico:stock]], [[grafico:importaciones]], [[grafico:mercado]], [[grafico:precios]]. Usa solo los que correspondan a la pregunta; si el usuario pide un gráfico, incluye al menos uno pertinente. El gráfico siempre muestra el conjunto de ejemplo completo, no filtros o escenarios inventados. Forecast muestra base total de líquidos; cálculos de escenarios y productos específicos van en tablas, aclarando que el gráfico es base total. No inventes marcadores ni números. En forecast explica regresión lineal, ausencia de estacionalidad y de validación histórica; no es una predicción validada.
DATOS: ${contextoDatos()}`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Falta configuración de IA", { status: 500 });
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("Solicitud inválida", { status: 400 });
        const call = createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          await convertToModelMessages(body.messages),
          INSTRUCCIONES,
        );
        return call.response();
      },
    },
  },
});
