import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/history")({ component: History });

function History() {
  const { history, projects, clearHistory } = useApp();
  const groups: Record<string, typeof history> = {};
  history.forEach((h) => {
    const d = new Date(h.ts).toDateString();
    (groups[d] ||= []).push(h);
  });
  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">History</h1>
          <button onClick={() => { clearHistory(); toast("History cleared"); }} className="rounded border px-3 py-1.5 text-sm hover:bg-accent">Clear history</button>
        </div>
        {history.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">No history yet.</div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.entries(groups).map(([day, items]) => (
              <div key={day}>
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{day}</div>
                <ul className="soft-card divide-y">
                  {items.map((it) => {
                    const p = projects.find((x) => x.slug === it.slug);
                    if (!p) return null;
                    return (
                      <li key={it.ts} className="flex items-center gap-3 p-3">
                        <div className="text-xl">{p.logo}</div>
                        <div className="min-w-0 flex-1">
                          <Link to="/project/$slug" params={{ slug: p.slug }} className="font-medium hover:underline">{p.name}</Link>
                          <div className="text-xs text-muted-foreground">{new Date(it.ts).toLocaleTimeString()} · {p.url}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
