import { supabase } from "@/integrations/supabase/client";

export type ProjectEventType = "view" | "visit" | "bookmark" | "unbookmark" | "share" | "search_click";

const SESSION_KEY = "xrpb-session-id";

export function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let v = localStorage.getItem(SESSION_KEY);
  if (!v) {
    v = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, v);
  }
  return v;
}

export async function trackProjectEvent(slug: string, type: ProjectEventType, userId?: string | null) {
  if (typeof window === "undefined" || !slug) return;
  try {
    await supabase.from("project_events" as never).insert({
      project_slug: slug,
      event_type: type,
      user_id: userId ?? null,
      session_id: sessionId(),
      referrer: document.referrer || null,
    } as never);
  } catch {
    /* analytics must never break the UI */
  }
}

/** Log which projects were shown for a keyword, and at what rank. */
export async function trackSearchImpressions(query: string, slugs: string[], userId?: string | null) {
  const q = query.trim();
  if (typeof window === "undefined" || q.length < 2 || slugs.length === 0) return;
  const rows = slugs.slice(0, 20).map((slug, i) => ({
    query: q,
    project_slug: slug,
    position: i + 1,
    clicked: false,
    user_id: userId ?? null,
    session_id: sessionId(),
  }));
  try {
    await supabase.from("search_events" as never).insert(rows as never);
  } catch {
    /* ignore */
  }
}

export async function trackSearchClick(query: string, slug: string, position: number, userId?: string | null) {
  const q = query.trim();
  if (typeof window === "undefined" || !q) return;
  try {
    await supabase.from("search_events" as never).insert({
      query: q, project_slug: slug, position, clicked: true, user_id: userId ?? null, session_id: sessionId(),
    } as never);
  } catch {
    /* ignore */
  }
}

// ---------------- Reading / aggregation ----------------

export interface RawProjectEvent { project_slug: string; event_type: string; user_id: string | null; session_id: string | null; created_at: string }
export interface RawSearchEvent { query: string; project_slug: string | null; position: number | null; clicked: boolean; created_at: string }

export interface ProjectStats {
  slug: string;
  views: number;
  visits: number;
  bookmarks: number;
  uniqueVisitors: number;
  impressions: number;
  searchClicks: number;
  avgPosition: number | null;
  ctr: number;
  keywords: { query: string; impressions: number; clicks: number; avgPosition: number }[];
}

export interface AnalyticsBundle {
  events: RawProjectEvent[];
  searches: RawSearchEvent[];
  byProject: Record<string, ProjectStats>;
  totals: { views: number; visits: number; bookmarks: number; uniqueVisitors: number; searches: number; clicks: number };
  daily: { date: string; views: number; visits: number; searches: number }[];
  topKeywords: { query: string; searches: number; clicks: number; avgPosition: number }[];
}

export async function fetchAnalytics(days = 30, slugs?: string[]): Promise<AnalyticsBundle> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let evQ = supabase.from("project_events" as never).select("project_slug,event_type,user_id,session_id,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000);
  let seQ = supabase.from("search_events" as never).select("query,project_slug,position,clicked,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000);
  if (slugs && slugs.length) {
    evQ = evQ.in("project_slug", slugs as never);
    seQ = seQ.in("project_slug", slugs as never);
  }
  const [ev, se] = await Promise.all([evQ, seQ]);
  const events = ((ev.data ?? []) as unknown as RawProjectEvent[]);
  const searches = ((se.data ?? []) as unknown as RawSearchEvent[]);
  return aggregate(events, searches, days);
}

export function aggregate(events: RawProjectEvent[], searches: RawSearchEvent[], days = 30): AnalyticsBundle {
  const byProject: Record<string, ProjectStats> = {};
  const ensure = (slug: string): ProjectStats => (byProject[slug] ??= {
    slug, views: 0, visits: 0, bookmarks: 0, uniqueVisitors: 0, impressions: 0, searchClicks: 0, avgPosition: null, ctr: 0, keywords: [],
  });

  const visitorSets: Record<string, Set<string>> = {};
  const allVisitors = new Set<string>();
  for (const e of events) {
    const s = ensure(e.project_slug);
    if (e.event_type === "view") s.views++;
    else if (e.event_type === "visit") s.visits++;
    else if (e.event_type === "bookmark") s.bookmarks++;
    else if (e.event_type === "unbookmark") s.bookmarks = Math.max(0, s.bookmarks - 1);
    const key = e.user_id ?? e.session_id ?? "anon";
    (visitorSets[e.project_slug] ??= new Set()).add(key);
    allVisitors.add(key);
  }
  for (const [slug, set] of Object.entries(visitorSets)) ensure(slug).uniqueVisitors = set.size;

  // keyword aggregation
  const kw: Record<string, Record<string, { impressions: number; clicks: number; posSum: number; posCount: number }>> = {};
  const globalKw: Record<string, { searches: number; clicks: number; posSum: number; posCount: number }> = {};
  for (const s of searches) {
    const q = s.query.trim().toLowerCase();
    const g = (globalKw[q] ??= { searches: 0, clicks: 0, posSum: 0, posCount: 0 });
    if (s.clicked) g.clicks++; else g.searches++;
    if (s.position) { g.posSum += s.position; g.posCount++; }
    if (!s.project_slug) continue;
    const p = ensure(s.project_slug);
    const bucket = ((kw[s.project_slug] ??= {})[q] ??= { impressions: 0, clicks: 0, posSum: 0, posCount: 0 });
    if (s.clicked) { p.searchClicks++; bucket.clicks++; }
    else { p.impressions++; bucket.impressions++; }
    if (s.position) { bucket.posSum += s.position; bucket.posCount++; }
  }
  for (const [slug, map] of Object.entries(kw)) {
    const p = ensure(slug);
    p.keywords = Object.entries(map)
      .map(([query, v]) => ({ query, impressions: v.impressions, clicks: v.clicks, avgPosition: v.posCount ? +(v.posSum / v.posCount).toFixed(1) : 0 }))
      .sort((a, b) => b.impressions + b.clicks - (a.impressions + a.clicks));
    const posC = p.keywords.filter((k) => k.avgPosition > 0);
    p.avgPosition = posC.length ? +(posC.reduce((a, k) => a + k.avgPosition, 0) / posC.length).toFixed(1) : null;
    p.ctr = p.impressions ? +((p.searchClicks / p.impressions) * 100).toFixed(1) : 0;
  }

  const daily: { date: string; views: number; visits: number; searches: number }[] = [];
  const span = Math.min(days, 30);
  const dayMap: Record<string, { views: number; visits: number; searches: number }> = {};
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    dayMap[d] = { views: 0, visits: 0, searches: 0 };
  }
  for (const e of events) {
    const d = e.created_at.slice(0, 10);
    if (!dayMap[d]) continue;
    if (e.event_type === "view") dayMap[d].views++;
    if (e.event_type === "visit") dayMap[d].visits++;
  }
  const seenSearch = new Set<string>();
  for (const s of searches) {
    if (s.clicked) continue;
    const key = `${s.query.trim().toLowerCase()}|${s.created_at}`;
    if (seenSearch.has(key)) continue;
    seenSearch.add(key);
    const d = s.created_at.slice(0, 10);
    if (dayMap[d]) dayMap[d].searches++;
  }
  for (const [date, v] of Object.entries(dayMap)) daily.push({ date, ...v });

  const topKeywords = Object.entries(globalKw)
    .map(([query, v]) => ({ query, searches: v.searches, clicks: v.clicks, avgPosition: v.posCount ? +(v.posSum / v.posCount).toFixed(1) : 0 }))
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 20);

  const totals = {
    views: events.filter((e) => e.event_type === "view").length,
    visits: events.filter((e) => e.event_type === "visit").length,
    bookmarks: events.filter((e) => e.event_type === "bookmark").length,
    uniqueVisitors: allVisitors.size,
    searches: seenSearch.size,
    clicks: searches.filter((s) => s.clicked).length,
  };

  return { events, searches, byProject, totals, daily, topKeywords };
}
