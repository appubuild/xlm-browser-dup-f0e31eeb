import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { useAnalytics, buildRows, Kpi, Sparkline, Bar } from "@/components/analytics-view";
import { countCommentsForSlugs, recentCommentsForSlugs, upvotesForSlugs } from "@/lib/comments";

export const Route = createFileRoute("/panel/")({
  component: PanelHome,
  head: () => ({
    meta: [
      { title: "Your Dashboard — XRPBrowser" },
      { name: "description", content: "Traffic, engagement and project performance for everything you publish on XRPBrowser." },
      { property: "og:title", content: "Your Dashboard — XRPBrowser" },
      { property: "og:description", content: "Track views, visits, upvotes and comments on your XRPL projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

interface Engagement {
  comments: Record<string, number>;
  upvotes: number;
  recent: { id: string; projectSlug: string; body: string; createdAt: string; author: string }[];
}

function useEngagement(slugs: string[]) {
  const [data, setData] = useState<Engagement | null>(null);
  const key = slugs.slice().sort().join(",");
  useEffect(() => {
    let alive = true;
    const list = key ? key.split(",") : [];
    void Promise.all([
      countCommentsForSlugs(list),
      upvotesForSlugs(list),
      recentCommentsForSlugs(list, 6),
    ])
      .then(([comments, upvotes, recent]) => { if (alive) setData({ comments, upvotes, recent }); })
      .catch(() => { if (alive) setData({ comments: {}, upvotes: 0, recent: [] }); });
    return () => { alive = false; };
  }, [key]);
  return data;
}

/** Interactive daily views/visits chart. */
function TrafficChart({ daily }: { daily: { date: string; views: number; visits: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.views + d.visits));
  const active = hover !== null ? daily[hover] : null;
  return (
    <div>
      <div className="flex h-40 items-end gap-[2px]">
        {daily.map((d, i) => {
          const total = d.views + d.visits;
          const h = Math.max(2, (total / max) * 100);
          const vh = total ? (d.views / total) * h : 0;
          return (
            <div
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="flex-1 cursor-pointer rounded-t bg-muted/40"
              style={{ height: `${h}%` }}
              title={`${d.date}: ${d.views} views · ${d.visits} visits`}
            >
              <div className="w-full rounded-t bg-primary" style={{ height: `${(vh / h) * 100}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{daily[0]?.date ?? ""}</span>
        <span>
          {active
            ? `${active.date} — ${active.views} views · ${active.visits} visits`
            : "Hover a bar for daily detail"}
        </span>
        <span>{daily[daily.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

function PanelHome() {
  const { user, bookmarks, history, projects } = useApp();
  const mine = projects.filter((p) => p.submitterId === user?.id || p.submitterEmail === user?.email);
  const slugs = mine.map((p) => p.slug);
  const { data, loading } = useAnalytics(30, slugs);
  const engagement = useEngagement(slugs);
  const rows = buildRows(data, mine);
  const maxEng = Math.max(...rows.map((r) => r.views + r.visits), 1);

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = (data?.daily ?? []).find((d) => d.date === today);
  const totalComments = Object.values(engagement?.comments ?? {}).reduce((a, b) => a + b, 0);

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

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Kpi label="Views today" value={todayRow?.views ?? 0} hint="Impressions in the last 24h" />
              <Kpi label="Views" value={data?.totals.views ?? 0} />
              <Kpi label="Visits" value={data?.totals.visits ?? 0} />
              <Kpi label="Unique visitors" value={data?.totals.uniqueVisitors ?? 0} />
              <Kpi label="Upvotes" value={engagement?.upvotes ?? 0} hint="On comments in your projects" />
              <Kpi label="Comments" value={totalComments} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="soft-card p-4 lg:col-span-2">
                <div className="mb-3 text-sm font-medium">Daily views &amp; visits</div>
                <TrafficChart daily={data?.daily ?? []} />
                <div className="mt-4 border-t pt-3">
                  <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Views trend</div>
                  <Sparkline points={(data?.daily ?? []).map((d) => d.views)} />
                </div>
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

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="soft-card p-4">
                <div className="mb-3 text-sm font-medium">Project overview</div>
                <ul className="space-y-2">
                  {mine.map((p) => {
                    const stat = rows.find((r) => r.slug === p.slug);
                    return (
                      <li key={p.id} className="flex items-center gap-3 rounded-md border p-2.5 text-sm">
                        <span className="text-xl">{p.logo}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat?.views ?? 0} views · {stat?.visits ?? 0} visits · {engagement?.comments[p.slug] ?? 0} comments
                          </div>
                        </div>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] capitalize ${p.status === "approved" ? "bg-emerald-500/15 text-emerald-500" : p.status === "pending" ? "bg-amber-500/15 text-amber-500" : "bg-rose-500/15 text-rose-500"}`}>{p.status}</span>
                        <Link to="/project/$slug" params={{ slug: p.slug }} className="rounded border px-2 py-1 text-xs hover:bg-accent">View</Link>
                        <Link to="/panel/submissions" className="rounded border px-2 py-1 text-xs hover:bg-accent">Manage</Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="soft-card p-4">
                <div className="mb-3 text-sm font-medium">Recent comments on your projects</div>
                {(engagement?.recent.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {engagement!.recent.map((c) => (
                      <li key={c.id} className="rounded-md border p-2.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.author}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 line-clamp-2">{c.body}</p>
                        <Link to="/project/$slug" params={{ slug: c.projectSlug }} className="mt-1 inline-block text-xs text-primary hover:underline">
                          {c.projectSlug} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PanelShell>
  );
}
