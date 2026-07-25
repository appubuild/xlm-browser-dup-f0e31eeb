import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { useAnalytics, buildRows, PerformanceTable, RangePicker, Kpi, Sparkline, Bar, exportCsv } from "@/components/analytics-view";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/analytics")({ component: PanelAnalytics });

function PanelAnalytics() {
  const { user, projects } = useApp();
  const [days, setDays] = useState(30);
  const mine = projects.filter((p) => p.submitterId === user?.id || p.submitterEmail === user?.email);
  const slugs = mine.map((p) => p.slug);
  const { data, loading } = useAnalytics(days, slugs);
  const rows = buildRows(data, mine);
  const maxEng = Math.max(...rows.map((r) => r.views + r.visits), 1);

  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Performance of the projects you submitted.</p>
          </div>
          <div className="flex items-center gap-2">
            <RangePicker days={days} setDays={setDays} />
            <button onClick={() => { exportCsv(rows, `my-projects-${days}d.csv`); toast.success("CSV exported"); }} className="rounded-md border px-3 py-1.5 text-sm">Export CSV</button>
          </div>
        </div>

        {mine.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">
            You haven't submitted any projects yet. <Link to="/panel/submit" className="text-primary hover:underline">Submit one →</Link>
          </div>
        ) : (
          <>
            {loading && <div className="mt-4 text-sm text-muted-foreground">Loading analytics…</div>}
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Page views" value={data?.totals.views ?? 0} hint={`last ${days} days`} />
              <Kpi label="Site visits" value={data?.totals.visits ?? 0} />
              <Kpi label="Unique visitors" value={data?.totals.uniqueVisitors ?? 0} />
              <Kpi label="Bookmarks" value={data?.totals.bookmarks ?? 0} />
              <Kpi label="Search impressions" value={rows.reduce((a, r) => a + r.impressions, 0)} />
              <Kpi label="Search clicks" value={rows.reduce((a, r) => a + r.searchClicks, 0)} />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="soft-card p-4 lg:col-span-2">
                <div className="mb-2 text-sm font-medium">Views trend</div>
                <Sparkline points={(data?.daily ?? []).map((d) => d.views)} />
                <div className="mt-2 text-sm font-medium">Visits trend</div>
                <Sparkline points={(data?.daily ?? []).map((d) => d.visits)} color="#10b981" />
              </div>
              <div className="soft-card p-4">
                <div className="mb-2 text-sm font-medium">Engagement by project</div>
                <ul className="space-y-2 text-sm">
                  {rows.map((r) => (
                    <li key={r.slug} className="flex items-center gap-2">
                      <span className="w-24 truncate">{r.logo} {r.name}</span>
                      <Bar value={r.views + r.visits} max={maxEng} color="bg-primary" />
                      <span className="w-10 text-right text-xs text-muted-foreground">{r.views + r.visits}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="soft-card mt-6 p-4">
              <div className="mb-3 text-sm font-medium">Per-project performance & keyword rankings</div>
              <PerformanceTable rows={rows} />
            </div>
          </>
        )}
      </div>
    </PanelShell>
  );
}
