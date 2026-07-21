import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useApp } from "@/lib/app-store";
import { Bell, LogOut } from "lucide-react";
import { toast } from "sonner";

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/projects", label: "Projects", icon: "📦" },
  { to: "/admin/projects/pending", label: "Moderation Queue", icon: "🛡️" },
  { to: "/admin/categories", label: "Categories", icon: "🏷️" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/blog", label: "News / Blog", icon: "📰" },
  { to: "/admin/tickers", label: "Tickers", icon: "📡" },
  { to: "/admin/site-settings", label: "Site Settings", icon: "⚙️" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { to: "/admin/wallet-connect-config", label: "Wallet Config", icon: "👛" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { isAdmin, adminLogout, notifications, projects } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const pending = projects.filter((p) => p.status === "pending").length;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-lg font-semibold">Admin sign-in required</h1>
          <p className="mt-2 text-sm text-slate-400">Please sign in to access the admin panel.</p>
          <button onClick={() => nav({ to: "/admin/login" })} className="mt-4 w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400">Go to admin login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 p-3">
        <Link to="/admin" className="mb-4 flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 font-bold text-white">X</div>
          <div>
            <div className="text-sm font-semibold">XRPBrowser</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Admin</div>
          </div>
        </Link>
        <nav className="space-y-0.5">
          {ADMIN_NAV.map((n) => {
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center justify-between rounded-md px-2.5 py-2 text-sm ${active ? "bg-sky-500/20 text-sky-300" : "text-slate-300 hover:bg-slate-800"}`}>
                <span className="flex items-center gap-2"><span>{n.icon}</span> {n.label}</span>
                {n.to === "/admin/projects/pending" && pending > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">{pending}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
          <div className="text-sm font-medium text-slate-300">Admin</div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-md p-2 text-slate-300 hover:bg-slate-800">
              <Bell className="h-4 w-4" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
            </button>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800">🧑‍💻</div>
            <button onClick={() => { adminLogout(); toast("Signed out"); nav({ to: "/" }); }} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-xs hover:bg-slate-800">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
