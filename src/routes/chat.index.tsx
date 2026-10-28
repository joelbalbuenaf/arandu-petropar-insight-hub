import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createThread, loadThreads } from "@/lib/threads";

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
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = loadThreads()[0] ?? createThread();
    navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
  }, [navigate]);
  return null;
}
