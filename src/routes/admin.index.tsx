import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/admin/")({ component: AdminDash });

function AdminDash() {
  const { projects, users, news } = useApp();
  const pending = projects.filter((p) => p.status === "pending").length;
  const kpis = [
    { label: "Total Projects", value: projects.length },
    { label: "Pending Approvals", value: pending },
    { label: "Total Users", value: users.length },
    { label: "Searches Today", value: 428 },
    { label: "Page Views", value: 12034 },
  ];
  const topVisited = [...projects].sort((a, b) => b.visits - a.visits).slice(0, 8);
  const maxV = Math.max(...topVisited.map((p) => p.visits), 1);
  const activity = [
    { t: "New project submitted: MoonBet XRPL", ts: "2h ago" },
    { t: "User Jamie Rivera registered", ts: "4h ago" },
    { t: "Project XRP Chess approved", ts: "1d ago" },
    { t: `News published: ${news[0]?.title}`, ts: "1d ago" },
  ];
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs uppercase text-slate-400">{k.label}</div>
            <div className="mt-1 text-2xl font-bold">{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Top 10 Most Visited</div>
          <ul className="space-y-2">
            {topVisited.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <div className="w-32 truncate">{p.logo} {p.name}</div>
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
                  <div className="h-full bg-sky-500" style={{ width: `${(p.visits / maxV) * 100}%` }} />
                </div>
                <div className="w-16 text-right text-xs text-slate-400">{p.visits.toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-medium">Recent Activity</div>
          <ul className="space-y-3 text-sm">
            {activity.map((a, i) => (<li key={i}><div>{a.t}</div><div className="text-xs text-slate-400">{a.ts}</div></li>))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
          <div className="mb-3 text-sm font-medium">Traffic (mock, last 7 days)</div>
          <svg viewBox="0 0 400 100" className="h-32 w-full">
            <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points="0,70 60,55 120,60 180,40 240,45 300,25 360,30 400,15" />
          </svg>
        </div>
      </div>
    </AdminShell>
  );
}
