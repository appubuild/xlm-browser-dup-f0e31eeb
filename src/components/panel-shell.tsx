import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useApp } from "@/lib/app-store";
import { PublicShell } from "./public-shell";

const PANEL_NAV = [
  { to: "/panel", label: "Dashboard", icon: "📊" },
  { to: "/panel/bookmarks", label: "Bookmarks", icon: "🔖" },
  { to: "/panel/history", label: "History", icon: "🕐" },
  { to: "/panel/submissions", label: "Submissions", icon: "📤" },
  { to: "/panel/notifications", label: "Notifications", icon: "🔔" },
  { to: "/panel/settings", label: "Settings", icon: "⚙️" },
] as const;

export function PanelShell({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();

  if (!user) {
    // Soft gate: show login prompt
    return (
      <PublicShell>
        <div className="mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold">Please sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">You need an account to access the panel.</p>
          <button onClick={() => nav({ to: "/login" })} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Go to sign in</button>
        </div>
      </PublicShell>
    );
  }
  return (
    <PublicShell>
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r bg-muted/30 p-3 md:block">
          <div className="mb-4 rounded-md border bg-card p-3">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="mt-0.5 font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <nav className="space-y-0.5">
            {PANEL_NAV.map((n) => {
              const active = path === n.to;
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                  <span>{n.icon}</span> {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </PublicShell>
  );
}

