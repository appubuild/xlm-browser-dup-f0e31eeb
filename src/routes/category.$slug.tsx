import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { useViewport } from "@/components/browser-viewport";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  head: ({ params }) => {
    const pretty = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${pretty} projects on the Stellar Network — XLM Browser`;
    const description = `Browse verified and community-submitted ${pretty} projects across the Stellar Network ecosystem.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { projects, categories, theme } = useApp();
  const viewport = useViewport();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"az" | "newest" | "trending">("trending");

  const key = slug.toLowerCase();
  // Match on slug first, then id, so old links keep working.
  const cat = categories.find((c) => c.slug.toLowerCase() === key) ?? categories.find((c) => c.id === slug);
  const matchKeys = new Set([key, cat?.slug.toLowerCase(), cat?.id].filter(Boolean) as string[]);

  let items = projects.filter(
    (p) => p.status === "approved" && p.isPublic && matchKeys.has((p.category ?? "").toLowerCase()),
  );
  const total = items.length;
  if (verifiedOnly) items = items.filter((p) => p.verified);
  if (sort === "az") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "newest") items = [...items].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  if (sort === "trending") items = [...items].sort((a, b) => b.visits - a.visits);

  const isRetro = theme === "retro";
  const title = cat?.name ?? slug.replace(/-/g, " ");

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/ecosystem" className="hover:underline">Ecosystem</Link> / <span className="capitalize">{title}</span>
        </nav>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold capitalize">{cat?.icon} {title}</h1>
            <p className="text-sm text-muted-foreground">
              {cat?.description || "Projects in this category."}
            </p>
            <p className="mt-1 text-sm">
              <b>{items.length}</b> {items.length === 1 ? "project" : "projects"}
              {verifiedOnly && total !== items.length && <span className="text-muted-foreground"> of {total}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="rounded border bg-background px-2 py-1.5">
              <option value="trending">Trending</option>
              <option value="az">A–Z</option>
              <option value="newest">Newest</option>
            </select>
            <button onClick={() => setView("grid")} className={`rounded border px-2 py-1 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}>Grid</button>
            <button onClick={() => setView("list")} className={`rounded border px-2 py-1 ${view === "list" ? "bg-primary text-primary-foreground" : ""}`}>List</button>
          </div>
        </div>

        {!cat && (
          <div className="mt-6 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            This category no longer exists. <Link to="/ecosystem" className="text-primary hover:underline">Browse all categories</Link>.
          </div>
        )}

        {isRetro || view === "list" ? (
          <table className="mt-6 w-full border border-primary text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="border border-primary p-2 text-left">Name</th>
                <th className="border border-primary p-2 text-left">Description</th>
                <th className="border border-primary p-2 text-left">Status</th>
                <th className="border border-primary p-2 text-left">Visits</th>
                <th className="border border-primary p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="border border-primary p-2">
                    <Link to="/project/$slug" params={{ slug: p.slug }}>{p.logo} {p.name} {p.verified && "✓"}</Link>
                  </td>
                  <td className="border border-primary p-2 text-muted-foreground">{p.tagline}</td>
                  <td className="border border-primary p-2">{p.liveStatus}</td>
                  <td className="border border-primary p-2">{p.visits.toLocaleString()}</td>
                  <td className="border border-primary p-2">
                    <button onClick={() => viewport.open(p)} className="text-primary underline">Visit</button>
                    {" · "}
                    <Link to="/project/$slug" params={{ slug: p.slug }} className="text-primary underline">Details</Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="border border-primary p-6 text-center text-muted-foreground">No projects yet</td></tr>}
            </tbody>
          </table>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="soft-card p-5">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{p.logo}</div>
                  {p.verified && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">✓ Verified</span>}
                </div>
                <div className="mt-3 font-semibold">{p.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => viewport.open(p)} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Visit</button>
                  <Link to="/project/$slug" params={{ slug: p.slug }} className="flex-1 rounded-md border px-3 py-2 text-center text-sm hover:bg-accent">Details</Link>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full rounded-md border p-10 text-center text-sm text-muted-foreground">
                No approved projects in this category yet.
              </div>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
