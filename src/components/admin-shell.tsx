import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { useApp } from "@/lib/app-store";
import { Bell, LogOut, ExternalLink, Sun, Moon } from "lucide-react";
import { toast } from "sonner";


const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/projects", label: "Projects", icon: "📦" },
  { to: "/admin/projects/pending", label: "Moderation Queue", icon: "🛡️" },
  { to: "/admin/categories", label: "Categories", icon: "🏷️" },
  { to: "/admin/landing", label: "Landing Page", icon: "🎨" },
  { to: "/admin/sidebar", label: "Sidebar Menu", icon: "🧭" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/blog", label: "News / Blog", icon: "📰" },
  { to: "/admin/pages", label: "Pages", icon: "📄" },
  { to: "/admin/contact", label: "Contact & Support", icon: "💬" },
  { to: "/admin/tickers", label: "Tickers", icon: "📡" },
  { to: "/admin/site-settings", label: "Site Settings", icon: "⚙️" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { to: "/admin/wallet-connect-config", label: "Wallet Config", icon: "👛" },
  { to: "/admin/footer", label: "Footer", icon: "🔗" },
] as const;

type AdminTheme = "light" | "dark";

function useAdminTheme(): [AdminTheme, (t: AdminTheme) => void] {
  const [theme, setTheme] = useState<AdminTheme>("dark");
  useEffect(() => {
    const v = (typeof window !== "undefined" && localStorage.getItem("admin-theme")) as AdminTheme | null;
    if (v === "light" || v === "dark") setTheme(v);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("admin-light", theme === "light");
    document.documentElement.classList.toggle("admin-dark", theme === "dark");
    return () => {
      document.documentElement.classList.remove("admin-light", "admin-dark");
    };
  }, [theme]);
  const update = (t: AdminTheme) => {
    setTheme(t);
    if (typeof window !== "undefined") localStorage.setItem("admin-theme", t);
  };
  return [theme, update];
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { isAdmin, adminLogout, notifications, projects } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  const pending = projects.filter((p) => p.status === "pending").length;
  const [adminTheme, setAdminTheme] = useAdminTheme();
  const dark = adminTheme === "dark";

  const c = {
    root: dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
    aside: dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white",
    subtle: dark ? "text-slate-400" : "text-slate-500",
    navHover: dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100",
    navActive: dark ? "bg-sky-500/20 text-sky-300" : "bg-sky-100 text-sky-700",
    header: dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white",
    btn: dark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-300 hover:bg-slate-100 text-slate-700",
    avatar: dark ? "bg-slate-800" : "bg-slate-200",
    iconBtn: dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100",
  };

  if (!isAdmin) {
    return (
      <div className={`grid min-h-screen place-items-center p-6 ${c.root}`}>
        <div className={`w-full max-w-sm rounded-xl border p-6 text-center ${c.aside}`}>
          <h1 className="text-lg font-semibold">Admin sign-in required</h1>
          <p className={`mt-2 text-sm ${c.subtle}`}>Please sign in to access the admin panel.</p>
          <button onClick={() => nav({ to: "/admin/login" })} className="mt-4 w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-400">Go to admin login</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${c.root}`}>
      <aside className={`flex h-full w-60 shrink-0 flex-col overflow-y-auto border-r p-3 ${c.aside}`}>
        <Link to="/admin" className="mb-4 flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 font-bold text-white">X</div>
          <div>
            <div className="text-sm font-semibold">XRPBrowser</div>
            <div className={`text-[10px] uppercase tracking-wider ${c.subtle}`}>Admin</div>
          </div>
        </Link>
        <nav className="space-y-0.5">
          {ADMIN_NAV.map((n) => {
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center justify-between rounded-md px-2.5 py-2 text-sm ${active ? c.navActive : c.navHover}`}>
                <span className="flex items-center gap-2"><span>{n.icon}</span> {n.label}</span>
                {n.to === "/admin/projects/pending" && pending > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">{pending}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className={`flex shrink-0 items-center gap-3 border-b px-4 py-2.5 ${c.header}`}>
          <div className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>Admin</div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setAdminTheme(dark ? "light" : "dark")}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${c.btn}`}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? "Light" : "Dark"}
            </button>
            <Link to="/" className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${c.btn}`}>
              <ExternalLink className="h-3.5 w-3.5" /> Back to site
            </Link>
            <button className={`relative rounded-md p-2 ${c.iconBtn}`}>
              <Bell className="h-4 w-4" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
            </button>
            <div className={`grid h-8 w-8 place-items-center rounded-full ${c.avatar}`}>🧑‍💻</div>
            <button onClick={() => { adminLogout(); toast("Signed out"); nav({ to: "/" }); }} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${c.btn}`}>
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
