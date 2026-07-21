import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/panel/")({ component: PanelHome });

function PanelHome() {
  const { user, bookmarks, history, projects } = useApp();
  const mine = projects.filter((p) => p.submitterEmail === user?.email);
  return (
    <PanelShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">Here's your XRPBrowser activity.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Bookmarks", value: bookmarks.length, to: "/panel/bookmarks" },
            { label: "Submitted Projects", value: mine.length, to: "/panel/submissions" },
            { label: "Recently Visited", value: history.length, to: "/panel/history" },
          ].map((s) => (
            <Link key={s.label} to={s.to} className="soft-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </Link>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}
