import { createFileRoute } from "@tanstack/react-router";

// Temporal: Arandu se está migrando a Claude con herramientas.
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async () => new Response("Arandu se está actualizando.", { status: 503 }),
    },
  },
});
