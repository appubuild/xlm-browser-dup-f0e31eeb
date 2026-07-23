import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askProjectAi, generateProjectFaq } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Sparkles, Send } from "lucide-react";
import type { Project } from "@/lib/app-store";

interface Msg { role: "user" | "assistant"; content: string }

export function ProjectAiChat({ project }: { project: Project }) {
  const ask = useServerFn(askProjectAi);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const hasDoc = !!(project.aiDoc && project.aiDoc.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await ask({ data: {
        projectName: project.name,
        projectTagline: project.tagline,
        aiDoc: project.aiDoc ?? "",
        history: messages,
        question: q,
      } });
      setMessages([...next, { role: "assistant", content: res.reply || "(no reply)" }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soft-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Ask AI about {project.name}</h3>
      </div>
      {!hasDoc && (
        <div className="mb-3 rounded border border-dashed p-3 text-xs text-muted-foreground">
          The project owner hasn't added AI documentation yet. Answers may be limited.
        </div>
      )}
      <div className="max-h-72 space-y-2 overflow-y-auto rounded border bg-background p-3 text-sm">
        {messages.length === 0 && <div className="text-xs text-muted-foreground">Try: "What is {project.name}?" or "How do I get started?"</div>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block rounded-lg px-3 py-1.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">Thinking…</div>}
      </div>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" className="flex-1 rounded border bg-background px-3 py-2 text-sm" />
        <button disabled={loading || !input.trim()} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
          <Send className="h-3 w-3" /> Send
        </button>
      </form>
    </div>
  );
}

export function ProjectFaq({ project }: { project: Project }) {
  const gen = useServerFn(generateProjectFaq);
  const [faq, setFaq] = useState<{ q: string; a: string }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await gen({ data: { projectName: project.name, aiDoc: project.aiDoc ?? "" } });
      setFaq(res.faq);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate FAQ");
    } finally {
      setLoading(false);
    }
  };

  if (!project.aiDoc || !project.aiDoc.trim()) return null;
  return (
    <div className="soft-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">FAQ</h3>
        <button onClick={load} disabled={loading} className="rounded border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50">
          {loading ? "Generating…" : faq ? "Regenerate" : "Generate from docs"}
        </button>
      </div>
      {faq === null ? (
        <div className="text-xs text-muted-foreground">Click "Generate from docs" to build an AI-powered FAQ.</div>
      ) : faq.length === 0 ? (
        <div className="text-xs text-muted-foreground">No FAQ could be generated.</div>
      ) : (
        <div className="space-y-3">
          {faq.map((f, i) => (
            <div key={i}>
              <div className="text-sm font-medium">{f.q}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{f.a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
