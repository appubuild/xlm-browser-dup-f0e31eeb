import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/news/")({ component: NewsPage });

function NewsPage() {
  const { news, blogCategories } = useApp();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const cats = useMemo(() => ["All", ...blogCategories.filter((c) => c.visible).map((c) => c.name)], [blogCategories]);
  const items = news.filter((n) =>
    n.status === "published" &&
    (cat === "All" || n.category === cat) &&
    (!q || `${n.title} ${n.excerpt} ${(n.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold">Stellar News</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1.5 text-sm ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{c}</button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="ml-auto rounded-full border px-3 py-1.5 text-sm" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="soft-card block overflow-hidden">
              <div className="h-40 w-full overflow-hidden bg-muted">
                {n.coverImageUrl
                  ? <img src={n.coverImageUrl} alt={n.title} className="h-full w-full object-cover" loading="lazy" />
                  : <div className="grid h-full place-items-center text-5xl">{n.coverImage}</div>}
              </div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground">{n.category} · {n.publishDate}</div>
                <div className="mt-1 font-semibold">{n.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>
                {n.tags && n.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {items.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No posts yet.</div>}
        </div>
      </div>
    </PublicShell>
  );
}
