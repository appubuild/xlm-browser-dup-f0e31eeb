import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { useViewport } from "@/components/browser-viewport";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/bookmarks")({ component: Bookmarks });

function Bookmarks() {
  const { bookmarks, projects, toggleBookmark } = useApp();
  const viewport = useViewport();
  const items = projects.filter((p) => bookmarks.includes(p.slug));
  return (
    <PanelShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        {items.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">
            No bookmarks yet. <Link to="/ecosystem" className="text-primary hover:underline">Explore projects →</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="soft-card p-5">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{p.logo}</div>
                  <button onClick={() => { toggleBookmark(p.slug); toast("Removed"); }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
                <div className="mt-3 font-semibold">{p.name}</div>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => viewport.open(p)} className="flex-1 rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Open</button>
                  <Link to="/project/$slug" params={{ slug: p.slug }} className="flex-1 rounded border px-3 py-2 text-center text-sm">Profile</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
