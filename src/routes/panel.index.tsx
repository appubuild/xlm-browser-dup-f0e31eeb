import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { useAnalytics, buildRows, Kpi, Sparkline, Bar } from "@/components/analytics-view";

export const Route = createFileRoute("/panel/")({ component: PanelHome });

function PanelHome() {
  const { user, bookmarks, history, projects } = useApp();
  const mine = projects.filter((p) => p.submitterId === user?.id || p.submitterEmail === user?.email);
  const { data, loading } = useAnalytics(30, mine.map((p) => p.slug));
  const rows = buildRows(data, mine);
  const maxEng = Math.max(...rows.map((r) => r.views + r.visits), 1);

  return (
    <PanelShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">Here's your XRPBrowser activity.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Bookmarks", value: bookmarks.length, to: "/panel/bookmarks" as const },
            { label: "Submitted Projects", value: mine.length, to: "/panel/submissions" as const },
            { label: "Recently Visited", value: history.length, to: "/panel/history" as const },
          ].map((s) => (
            <Link key={s.label} to={s.to} className="soft-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </Link>
          ))}
        </div>

        {mine.length > 0 && (
          <>
            <div className="mt-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your project performance (30d)</h2>
              <Link to="/panel/analytics" className="text-sm text-primary hover:underline">Full analytics →</Link>
            </div>
            {loading && <div className="mt-2 text-sm text-muted-foreground">Loading…</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Kpi label="Views" value={data?.totals.views ?? 0} />
              <Kpi label="Visits" value={data?.totals.visits ?? 0} />
              <Kpi label="Unique visitors" value={data?.totals.uniqueVisitors ?? 0} />
              <Kpi label="Bookmarks" value={data?.totals.bookmarks ?? 0} />
              <Kpi label="Search clicks" value={rows.reduce((a, r) => a + r.searchClicks, 0)} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="soft-card p-4 lg:col-span-2">
                <div className="mb-2 text-sm font-medium">Views trend</div>
                <Sparkline points={(data?.daily ?? []).map((d) => d.views)} />
              </div>
              <div className="soft-card p-4">
                <div className="mb-2 text-sm font-medium">By project</div>
                <ul className="space-y-2 text-sm">
                  {rows.map((r) => (
                    <li key={r.slug} className="flex items-center gap-2">
                      <span className="w-24 truncate">{r.logo} {r.name}</span>
                      <Bar value={r.views + r.visits} max={maxEng} color="bg-primary" />
                      <span className="w-8 text-right text-xs text-muted-foreground">{r.views + r.visits}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </PanelShell>
  );
}
