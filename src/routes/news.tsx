import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/news")({ component: NewsPage });

function NewsPage() {
  const { news } = useApp();
  const [cat, setCat] = useState("All");
  const cats = ["All", "Announcements", "Partnerships", "Updates", "Market"];
  const items = news.filter((n) => n.status === "published" && (cat === "All" || n.category === cat));
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold">XRPL News</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1.5 text-sm ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{c}</button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }} className="soft-card block overflow-hidden">
              <div className="grid h-40 place-items-center bg-muted text-5xl">{n.coverImage}</div>
              <div className="p-4">
                <div className="text-xs text-muted-foreground">{n.category} · {n.publishDate}</div>
                <div className="mt-1 font-semibold">{n.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
