import { Fragment, useEffect, useMemo, useState } from "react";
import { fetchAnalytics, type AnalyticsBundle, type ProjectStats } from "@/lib/analytics";
import type { Project } from "@/lib/app-store";

export function useAnalytics(days: number, slugs?: string[]) {
  const [data, setData] = useState<AnalyticsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const key = slugs ? slugs.slice().sort().join(",") : "*";
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchAnalytics(days, slugs)
      .then((d) => { if (alive) setData(d); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, key]);
  return { data, loading };
}

export function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--xrpb-analytics-border, currentColor)" }}>
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="mt-1 text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {hint && <div className="mt-0.5 text-[11px] opacity-50">{hint}</div>}
    </div>
  );
}

export function Sparkline({ points, color = "#0ea5e9" }: { points: number[]; color?: string }) {
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? 400 / (points.length - 1) : 400;
  const d = points.map((v, i) => `${i * step},${100 - (v / max) * 90}`).join(" ");
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="h-28 w-full">
      <polyline fill="none" stroke={color} strokeWidth="2" points={d} />
    </svg>
  );
}

export function Bar({ value, max, color = "bg-sky-500" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded bg-current/10">
      <div className={`h-full rounded ${color}`} style={{ width: `${(value / (max || 1)) * 100}%` }} />
    </div>
  );
}

export interface Row extends ProjectStats { name: string; logo: string; category: string; totalVisits: number }

export function buildRows(data: AnalyticsBundle | null, projects: Project[]): Row[] {
  if (!data) return [];
  return projects.map((p) => {
    const s = data.byProject[p.slug];
    return {
      slug: p.slug,
      name: p.name,
      logo: p.logo,
      category: p.category,
      totalVisits: p.visits,
      views: s?.views ?? 0,
      visits: s?.visits ?? 0,
      bookmarks: s?.bookmarks ?? 0,
      uniqueVisitors: s?.uniqueVisitors ?? 0,
      impressions: s?.impressions ?? 0,
      searchClicks: s?.searchClicks ?? 0,
      avgPosition: s?.avgPosition ?? null,
      ctr: s?.ctr ?? 0,
      keywords: s?.keywords ?? [],
    };
  }).sort((a, b) => b.views + b.visits - (a.views + a.visits));
}

export function PerformanceTable({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const items = useMemo(() => rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter projects..." className="mb-3 w-full max-w-xs rounded border bg-transparent px-3 py-1.5 text-sm" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b text-left opacity-60">
            <tr>
              <th className="p-2">Project</th>
              <th className="p-2 text-right">Views</th>
              <th className="p-2 text-right">Visits</th>
              <th className="p-2 text-right">Uniques</th>
              <th className="p-2 text-right">Bookmarks</th>
              <th className="p-2 text-right">Impressions</th>
              <th className="p-2 text-right">Clicks</th>
              <th className="p-2 text-right">CTR</th>
              <th className="p-2 text-right">Avg. pos.</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <Fragment key={r.slug}>
                <tr className="border-b border-current/10">
                  <td className="p-2 font-medium">{r.logo} {r.name}</td>
                  <td className="p-2 text-right">{r.views}</td>
                  <td className="p-2 text-right">{r.visits}</td>
                  <td className="p-2 text-right">{r.uniqueVisitors}</td>
                  <td className="p-2 text-right">{r.bookmarks}</td>
                  <td className="p-2 text-right">{r.impressions}</td>
                  <td className="p-2 text-right">{r.searchClicks}</td>
                  <td className="p-2 text-right">{r.ctr}%</td>
                  <td className="p-2 text-right">{r.avgPosition ?? "—"}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => setOpen(open === r.slug ? null : r.slug)} className="text-xs text-sky-500 hover:underline">
                      {open === r.slug ? "Hide" : "Keywords"}
                    </button>
                  </td>
                </tr>
                {open === r.slug && (
                  <tr className="border-b border-current/10">
                    <td colSpan={10} className="p-3">
                      {r.keywords.length === 0 ? (
                        <div className="text-xs opacity-60">No search data yet for this project.</div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="text-left opacity-60"><tr><th className="py-1">Keyword</th><th className="py-1 text-right">Impressions</th><th className="py-1 text-right">Clicks</th><th className="py-1 text-right">Avg. position</th></tr></thead>
                          <tbody>
                            {r.keywords.slice(0, 15).map((k) => (
                              <tr key={k.query}><td className="py-1">{k.query}</td><td className="py-1 text-right">{k.impressions}</td><td className="py-1 text-right">{k.clicks}</td><td className="py-1 text-right">#{k.avgPosition}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <div className="p-6 text-center text-sm opacity-60">No projects.</div>}
    </div>
  );
}

export function RangePicker({ days, setDays }: { days: number; setDays: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[7, 30, 90].map((d) => (
        <button key={d} onClick={() => setDays(d)} className={`rounded border px-2.5 py-1 text-xs ${days === d ? "bg-sky-500 text-white" : "opacity-70"}`}>{d}d</button>
      ))}
    </div>
  );
}

export function exportCsv(rows: Row[], filename: string) {
  const head = ["slug", "name", "views", "visits", "unique_visitors", "bookmarks", "impressions", "search_clicks", "ctr", "avg_position", "top_keyword"];
  const body = rows.map((r) => [r.slug, r.name, r.views, r.visits, r.uniqueVisitors, r.bookmarks, r.impressions, r.searchClicks, r.ctr, r.avgPosition ?? "", r.keywords[0]?.query ?? ""].join(","));
  const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
