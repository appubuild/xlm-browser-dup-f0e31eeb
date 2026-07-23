import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { useViewport } from "@/components/browser-viewport";
import { CATEGORIES } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (s) => searchSchema.parse(s),
});

function SearchPage() {
  const { q } = useSearch({ from: "/search" });
  const { projects } = useApp();
  const viewport = useViewport();
  const [query, setQuery] = useState(q);
  const [tab, setTab] = useState<"all" | string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"relevance" | "newest" | "visits">("relevance");
  const [cats, setCats] = useState<string[]>([]);

  const results = useMemo(() => {
    const term = query.toLowerCase().trim();
    let r = projects.filter((p) => p.status === "approved" && p.isPublic);
    if (term) r = r.filter((p) => (p.name + p.tagline + p.description + p.category).toLowerCase().includes(term));
    if (tab !== "all") r = r.filter((p) => p.category === tab);
    if (verifiedOnly) r = r.filter((p) => p.verified);
    if (cats.length) r = r.filter((p) => cats.includes(p.category));
    if (sort === "newest") r = [...r].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    if (sort === "visits") r = [...r].sort((a, b) => b.visits - a.visits);
    return r;
  }, [projects, query, tab, verifiedOnly, cats, sort]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2">
          <Search className="h-4 w-4 opacity-60" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search XRPL..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
        </form>

        <div className="mt-4 flex flex-wrap gap-1 border-b">
          {["all", "dapps", "tokens", "nfts", "wallets"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <Link to="/news" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">News</Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="soft-card space-y-4 p-4 text-sm">
            <div>
              <div className="mb-2 font-semibold">Categories</div>
              {CATEGORIES.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={cats.includes(c.id)} onChange={(e) => setCats((v) => e.target.checked ? [...v, c.id] : v.filter((x) => x !== c.id))} />
                  <span>{c.icon} {c.name}</span>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only</label>
            <div>
              <div className="mb-1 font-semibold">Sort by</div>
              <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="w-full rounded border bg-background px-2 py-1.5 text-sm">
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="visits">Most Visited</option>
              </select>
            </div>
          </aside>
          <div>
            <div className="mb-3 text-sm text-muted-foreground">{results.length} results{query && ` for "${query}"`}</div>
            {results.length === 0 ? (
              <div className="soft-card p-8 text-center">
                <div className="text-4xl">🔍</div>
                <div className="mt-3 font-semibold">No results found</div>
                <div className="text-sm text-muted-foreground">Try a different search term or clear filters.</div>
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((p) => (
                  <li key={p.id} className="soft-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{p.logo}</div>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => viewport.open(p)} className="text-left text-base font-semibold hover:underline">
                          {p.name} {p.verified && <span className="ml-1 text-xs text-primary">✓</span>}
                        </button>
                        <div className="text-xs text-muted-foreground">{p.url} · {p.category}</div>
                        <p className="mt-1 text-sm">{p.description}</p>
                        <Link to="/project/$slug" params={{ slug: p.slug }} className="text-xs text-primary hover:underline">View profile →</Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
