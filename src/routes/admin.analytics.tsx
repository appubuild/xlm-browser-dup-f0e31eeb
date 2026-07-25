import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { useAnalytics, buildRows, PerformanceTable, RangePicker, Kpi, Sparkline, Bar, exportCsv } from "@/components/analytics-view";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics });

function AdminAnalytics() {
  const { projects } = useApp();
  const [days, setDays] = useState(30);
  const { data, loading } = useAnalytics(days);
  const rows = buildRows(data, projects);

  const catCount: Record<string, number> = {};
  projects.forEach((p) => { catCount[p.category] = (catCount[p.category] ?? 0) + 1; });
  const totalCat = Object.values(catCount).reduce((a, b) => a + b, 0) || 1;
  const topKw = data?.topKeywords ?? [];
  const maxView = Math.max(...rows.map((r) => r.views + r.visits), 1);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-2">
          <RangePicker days={days} setDays={setDays} />
          <button onClick={() => { exportCsv(rows, `xrpbrowser-analytics-${days}d.csv`); toast.success("CSV exported"); }} className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">Export CSV</button>
        </div>
      </div>

      {loading && <div className="mt-4 text-sm text-slate-400">Loading real analytics…</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi label="Page views" value={data?.totals.views ?? 0} hint={`last ${days} days`} />
        <Kpi label="Site visits" value={data?.totals.visits ?? 0} hint="browser opens" />
        <Kpi label="Unique visitors" value={data?.totals.uniqueVisitors ?? 0} />
        <Kpi label="Bookmarks" value={data?.totals.bookmarks ?? 0} />
        <Kpi label="Searches" value={data?.totals.searches ?? 0} />
        <Kpi label="Search clicks" value={data?.totals.clicks ?? 0} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Traffic trend (views)</div>
          <Sparkline points={(data?.daily ?? []).map((d) => d.views)} />
          <div className="mt-2 text-sm font-medium">Visits</div>
          <Sparkline points={(data?.daily ?? []).map((d) => d.visits)} color="#10b981" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Top search keywords</div>
          {topKw.length === 0 ? <div className="text-xs text-slate-400">No searches recorded yet.</div> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">Keyword</th><th className="py-1 text-right">Searches</th><th className="py-1 text-right">Clicks</th></tr></thead>
              <tbody>
                {topKw.slice(0, 12).map((k) => (
                  <tr key={k.query} className="border-b border-slate-800/60"><td className="py-1">{k.query}</td><td className="py-1 text-right text-slate-400">{k.searches}</td><td className="py-1 text-right text-slate-400">{k.clicks}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Category distribution</div>
          <ul className="space-y-2 text-sm">
            {Object.entries(catCount).map(([k, v]) => (
              <li key={k}>
                <div className="flex justify-between"><span className="capitalize">{k}</span><span className="text-slate-400">{Math.round((v / totalCat) * 100)}%</span></div>
                <div className="mt-1 flex"><Bar value={v} max={totalCat} color="bg-indigo-500" /></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Most engaged projects</div>
          <ul className="space-y-2">
            {rows.slice(0, 8).map((r) => (
              <li key={r.slug} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{r.logo} {r.name}</span>
                <Bar value={r.views + r.visits} max={maxView} color="bg-emerald-500" />
                <span className="w-24 text-right text-xs text-slate-400">{r.views} v / {r.visits} vis</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 text-sm font-medium">Individual project performance</div>
        <PerformanceTable rows={rows} />
      </div>
    </AdminShell>
  );
}
