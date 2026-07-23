import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowRight, ShieldCheck, Globe, Lock, Rocket } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { useViewport } from "@/components/browser-viewport";
import { ProjectTicker } from "@/components/crypto-ticker";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { projects, theme, tickers } = useApp();
  const nav = useNavigate();
  const viewport = useViewport();
  const [q, setQ] = useState("");
  const isRetro = theme === "dark";
  const featured = projects.filter((p) => p.featured && p.status === "approved");
  const trending = projects.filter((p) => p.status === "approved").slice(0, 6);

  const go = (e: React.FormEvent) => { e.preventDefault(); nav({ to: "/search", search: { q } as never }); };

  return (
    <PublicShell>
      <section className="gradient-hero relative overflow-hidden px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className={isRetro ? "font-mono text-4xl md:text-5xl" : "text-4xl font-extrabold tracking-tight md:text-6xl"}>
            {isRetro ? ">> SEARCH THE " : "Search the "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">XRP Ledger</span>
            {isRetro ? " UNIVERSE <<" : " Universe"}
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            The search engine and browser for the fastest, greenest blockchain.
          </p>
          <form onSubmit={go} className={isRetro ? "mx-auto mt-8 flex max-w-2xl items-center gap-2 border-2 border-primary bg-background px-3 py-2 font-mono" : "mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg"}>
            <Search className="h-5 w-5 opacity-60" />
            {isRetro && <span className="font-mono text-sm">C:\&gt;</span>}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, wallets, tokens, NFTs..." className="flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
            {isRetro && <span className="blink">_</span>}
            <button className={isRetro ? "retro-btn" : "rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"}>Search</button>
          </form>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
            {[
              { l: "Explore dApps", to: "/directory/dapps" },
              { l: "Find Tokens", to: "/directory/tokens" },
              { l: "XRPL Network", to: "/ecosystem" },
              { l: "NFT Marketplace", to: "/directory/nfts" },
              { l: "XRP News", to: "/news" },
            ].map((p) => (
              <Link key={p.l} to={p.to} className={isRetro ? "retro-btn text-xs" : "rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"}>
                {p.l}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured Projects</h2>
          <Link to="/ecosystem" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <div key={p.id} className="soft-card p-5">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{p.logo}</div>
                {p.verified && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">✓ Verified</span>}
              </div>
              <div className="mt-3 font-semibold">{p.name}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => viewport.open(p)} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Visit</button>
                <Link to="/project/$slug" params={{ slug: p.slug }} className="flex-1 rounded-md border px-3 py-2 text-center text-sm hover:bg-accent">Profile</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending row */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Trending on XRPL</h2>
          <Link to="/ecosystem" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {trending.map((p) => (
            <Link key={p.id} to="/project/$slug" params={{ slug: p.slug }} className="soft-card w-64 shrink-0 snap-start p-4">
              <div className="flex items-center gap-2 text-2xl">{p.logo} {p.verified && <span className="text-xs text-primary">✓</span>}</div>
              <div className="mt-2 font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground uppercase">{p.category}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { Icon: Globe, t: "Borderless Search", d: "Discover XRPL apps everywhere." },
            { Icon: Rocket, t: "Built for XRPL", d: "Purpose-built for the ledger." },
            { Icon: Lock, t: "Private by Default", d: "No tracking. No profiles." },
            { Icon: ShieldCheck, t: "Open & Decentralized", d: "Community-driven directory." },
          ].map((f) => (
            <div key={f.t} className="soft-card p-5">
              <f.Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-semibold">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="soft-card flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-bold">Have a project on the XRP Ledger?</h3>
            <p className="text-sm text-muted-foreground">Submit it to XRPBrowser and get discovered.</p>
          </div>
          <Link to="/submit" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Submit a project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
