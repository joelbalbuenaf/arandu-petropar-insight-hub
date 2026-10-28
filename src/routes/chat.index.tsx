import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { createThread, guardarPreguntaPendiente, loadThreads } from "@/lib/threads";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "Habla con tus datos · Arandu · Petropar" },
      {
        name: "description",
        content:
          "Conversa con Arandu, el agente de IA que responde preguntas analíticas de Petropar.",
      },
      { property: "og:title", content: "Habla con tus datos · Arandu" },
      { property: "og:description", content: "Agente de IA analítico de Petropar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"].slice(0, 500) } : {},
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  // El ref evita crear dos conversaciones cuando React ejecuta el efecto dos veces (StrictMode).
  const destino = useRef<string | null>(null);
  useEffect(() => {
    // Con una pregunta (desde un gráfico o alerta) se abre una conversación nueva que la envía.
    if (!destino.current) {
      const t = q ? createThread() : (loadThreads()[0] ?? createThread());
      if (q) guardarPreguntaPendiente(t.id, q);
      destino.current = t.id;
    }
    void navigate({ to: "/chat/$threadId", params: { threadId: destino.current }, replace: true });
  }, [navigate, q]);
  return null;
}
