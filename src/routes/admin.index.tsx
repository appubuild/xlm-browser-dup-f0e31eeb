import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { useAnalytics, buildRows, Sparkline, Bar, Kpi } from "@/components/analytics-view";

export const Route = createFileRoute("/admin/")({ component: AdminDash });

function AdminDash() {
  const { projects, users, news } = useApp();
  const { data, loading } = useAnalytics(30);
  const rows = buildRows(data, projects);
  const pending = projects.filter((p) => p.status === "pending").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = data?.daily.find((d) => d.date === today);

  const kpis = [
    { label: "Total Projects", value: projects.length },
    { label: "Pending Approvals", value: pending },
    { label: "Total Users", value: users.length },
    { label: "Searches Today", value: todayRow?.searches ?? 0 },
    { label: "Page Views (30d)", value: data?.totals.views ?? 0 },
    { label: "Site Visits (30d)", value: data?.totals.visits ?? 0 },
    { label: "Unique Visitors", value: data?.totals.uniqueVisitors ?? 0 },
    { label: "Bookmarks (30d)", value: data?.totals.bookmarks ?? 0 },
  ];
  const topVisited = rows.slice(0, 10);
  const maxV = Math.max(...topVisited.map((p) => p.views + p.visits), 1);

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link to="/admin/analytics" className="rounded border border-slate-700 px-3 py-1.5 text-sm">Full analytics →</Link>
      </div>
      {loading && <div className="mt-2 text-sm text-slate-400">Loading live data…</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <Kpi key={k.label} label={k.label} value={k.value} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Top 10 by engagement (30d)</div>
          <ul className="space-y-2">
            {topVisited.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 text-sm">
                <div className="w-32 truncate">{p.logo} {p.name}</div>
                <Bar value={p.views + p.visits} max={maxV} />
                <div className="w-28 text-right text-xs text-slate-400">{p.views} views · {p.visits} visits</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-medium">Top keywords</div>
          <ul className="space-y-1 text-sm">
            {(data?.topKeywords ?? []).slice(0, 10).map((k) => (
              <li key={k.query} className="flex justify-between border-b border-slate-800/60 py-1"><span>{k.query}</span><span className="text-slate-400">{k.searches}</span></li>
            ))}
            {(data?.topKeywords.length ?? 0) === 0 && <li className="text-xs text-slate-400">No searches recorded yet.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Traffic (last 30 days)</div>
          <Sparkline points={(data?.daily ?? []).map((d) => d.views)} />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-medium">Recent Activity</div>
          <ul className="space-y-3 text-sm">
            {[...projects].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 4).map((p) => (
              <li key={p.id}><div>Project submitted: {p.name}</div><div className="text-xs text-slate-400">{p.dateAdded} · {p.status}</div></li>
            ))}
            {news[0] && <li><div>Latest post: {news[0].title}</div><div className="text-xs text-slate-400">{news[0].publishDate}</div></li>}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
