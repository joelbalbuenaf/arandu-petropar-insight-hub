import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisExplorer } from "@/components/AnalysisExplorer";
import { AnalyticalChart } from "@/components/AnalyticalChart";
import { parseAnalyticalResponse } from "@/lib/analytical-questions";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { createThread, deleteThread, ensureThread, loadThreads, updateThread, type Thread } from "@/lib/threads";
import logo from "@/assets/arandu.png";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Arandu · Habla con tus datos · Petropar" },
      { name: "description", content: "Conversación con Arandu, el agente analítico de Petropar." },
      { property: "og:title", content: "Arandu · Habla con tus datos" },
      { property: "og:description", content: "Pregunta sobre ventas, logística, mercado y operadores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);

  useEffect(() => {
    setThread(ensureThread(threadId));
    setThreads(loadThreads());
    const h = () => setThreads(loadThreads());
    window.addEventListener("threads-changed", h);
    return () => window.removeEventListener("threads-changed", h);
  }, [threadId]);

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="p-3">
          <Button
            onClick={() => { const t = createThread(); navigate({ to: "/chat/$threadId", params: { threadId: t.id } }); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Nueva conversación
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {threads.map((t) => (
            <div key={t.id} className={`group flex items-center rounded-lg ${t.id === threadId ? "bg-secondary" : "hover:bg-muted"}`}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex-1 truncate px-3 py-2 text-sm">{t.title}</Link>
              <Button variant="ghost" size="icon" title="Eliminar conversación"
                aria-label="Eliminar"
                onClick={() => {
                  deleteThread(t.id);
                  if (t.id === threadId) {
                    const next = loadThreads()[0] ?? createThread();
                    navigate({ to: "/chat/$threadId", params: { threadId: next.id } });
                  }
                }}
                className="px-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </aside>
      {thread && thread.id === threadId && <ChatWindow key={threadId} thread={thread} />}
    </div>
  );
}

function ChatWindow({ thread }: { thread: Thread }) {
  const [input, setInput] = useState("");
  const [explore, setExplore] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { conversationId: thread.id } }),
    onError: (e) => {
      const m = e.message || "";
      if (m.includes("429")) toast.error("Demasiadas consultas, espera un momento.");
      else if (m.includes("402")) toast.error("Créditos de IA agotados. Recarga en Configuración → Planes y créditos.");
      else toast.error(m || "No se pudo obtener respuesta de Arandu.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") {
      if (messages.length) updateThread(thread.id, messages);
      ref.current?.focus();
    }
  }, [status, messages, thread.id]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <img src={logo} alt="Arandu" width={36} height={36} className="size-9 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">Arandu</p>
          <p className="text-xs text-muted-foreground">Agente analítico de Petropar · Habla con tus datos</p>
        </div>
        <Button variant="outline" size="icon" title="Explorar preguntas y oportunidades" aria-label="Explorar preguntas y oportunidades" onClick={() => setExplore(v => !v)}><ChartNoAxesCombined /></Button>
        <Button variant="outline" size="icon" title="Nueva conversación" aria-label="Nueva conversación" onClick={() => { const t = createThread(); window.location.assign(`/chat/${t.id}`); }}><Plus /></Button>
      </header>
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={logo} alt="Arandu" width={80} height={80} className="mx-auto size-20 object-contain" />
              <h2 className="mt-2 text-2xl font-bold">Hola, soy Arandu</h2>
              <p className="text-muted-foreground">Ventas · metas · presupuesto · forecast · oportunidades</p>
              <p className="mb-6 mt-2 text-xs text-muted-foreground">Datos ficticios · Ene–Sep 2026</p>
              <AnalysisExplorer onAsk={send} disabled={busy} />
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  {m.parts.map((p, i) => {
                    if (p.type !== "text") return null;
                    const parsed = m.role === "assistant" ? parseAnalyticalResponse(p.text) : { text: p.text, charts: [] };
                    return <div key={i} className="min-w-0 space-y-5"><MessageResponse>{parsed.text}</MessageResponse>{parsed.charts.map(id => <div key={id} className="border-t pt-5"><AnalyticalChart id={id} /></div>)}</div>;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Arandu está analizando los datos…</Shimmer>}
          {explore && messages.length > 0 && <div className="mt-6 border-t pt-6"><AnalysisExplorer onAsk={text => { send(text); setExplore(false); }} disabled={busy} /></div>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-4">
        <PromptInput onSubmit={(msg) => send(msg.text)}>
          <PromptInputTextarea ref={ref} autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pregúntale a Arandu sobre tus datos…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
