import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/ecosystem")({ component: Ecosystem });

function Ecosystem() {
  const { projects, categories } = useApp();
  const approved = projects.filter((p) => p.status === "approved");
  const stats = [
    { label: "Total Projects", value: approved.length },
    { label: "Categories", value: categories.length },
    { label: "Verified", value: approved.filter((p) => p.verified).length },
    { label: "New This Week", value: 3 },
  ];
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-bold">XRPL Ecosystem</h1>
        <p className="mt-1 text-muted-foreground">Explore projects across the XRP Ledger.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="soft-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 rounded-xl border bg-muted/40 p-4 text-sm">
          <div><span className="text-muted-foreground">XRPL TPS:</span> <b>1,500</b></div>
          <div><span className="text-muted-foreground">Avg Fee:</span> <b>$0.0002</b></div>
          <div><span className="text-muted-foreground">Ledger Close:</span> <b>3-5s</b></div>
        </div>

        <h2 className="mt-8 text-xl font-bold">Categories</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.filter((c) => c.visible).map((c) => {
            const count = approved.filter((p) => p.category === c.id).length;
            return (
              <Link key={c.id} to="/directory/$category" params={{ category: c.id }} className="soft-card group p-5 transition hover:border-primary">
                <div className="text-3xl">{c.icon}</div>
                <div className="mt-3 font-semibold">{c.name} <span className="text-muted-foreground">({count})</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
