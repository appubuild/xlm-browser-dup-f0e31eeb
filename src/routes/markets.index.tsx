import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/public-shell";
import { getMarkets, getTrending } from "@/lib/market.functions";
import { fmtCompact, fmtPct, fmtPrice, openBinanceStream, type ConnStatus } from "@/lib/market-format";
import type { MarketCoin } from "@/lib/market-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Search, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/markets/")({
  head: () => ({
    meta: [
      { title: "Crypto Markets — Live Prices & Charts | XLM Browser" },
      { name: "description", content: "Live cryptocurrency prices, 24h change, volume and trending coins with real-time candlestick charts." },
      { property: "og:title", content: "Crypto Markets — Live Prices & Charts" },
      { property: "og:description", content: "Real-time crypto market data, trending coins and TradingView-style charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketsPage,
});

type SortKey = "market_cap" | "current_price" | "price_change_percentage_24h" | "total_volume";

function MarketsPage() {
  const fetchMarkets = useServerFn(getMarkets);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("market_cap");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [live, setLive] = useState<Record<string, number>>({});
  const pending = useRef<Record<string, number>>({});

  const marketsQuery = useQuery({
    queryKey: ["markets", page],
    queryFn: () => fetchMarkets({ data: { page, perPage: 50 } }),
    refetchInterval: 45_000,
    placeholderData: (prev) => prev,
  });

  const coins = marketsQuery.data?.coins ?? [];

  // Live prices for all Binance USDT pairs, throttled to one state update/sec.
  useEffect(() => {
    const dispose = openBinanceStream(
      ["!miniTicker@arr"],
      (payload) => {
        if (!Array.isArray(payload)) return;
        for (const t of payload) {
          if (typeof t.s === "string" && t.s.endsWith("USDT")) {
            pending.current[t.s.slice(0, -4)] = Number(t.c);
          }
        }
      },
      setStatus,
    );
    const flush = setInterval(() => {
      if (Object.keys(pending.current).length) {
        setLive((prev) => ({ ...prev, ...pending.current }));
        pending.current = {};
      }
    }, 1000);
    return () => {
      dispose();
      clearInterval(flush);
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? coins.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
      : coins;
    const sorted = [...filtered].sort((a, b) => {
      const av = (a[sort] ?? 0) as number;
      const bv = (b[sort] ?? 0) as number;
      return dir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [coins, query, sort, dir]);

  const toggleSort = (key: SortKey) => {
    if (key === sort) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir("desc");
    }
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Crypto Markets</h1>
            <p className="mt-1 text-muted-foreground">Live prices from CoinGecko, real-time ticks from Binance.</p>
          </div>
          <LiveBadge status={status} />
        </div>

        <TrendingRow />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or symbol…"
              className="pl-9"
            />
          </div>
          {marketsQuery.data?.error && (
            <span className="text-sm text-destructive">{marketsQuery.data.error} — retrying…</span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Coin</th>
                <SortHeader label="Price" k="current_price" sort={sort} dir={dir} onClick={toggleSort} />
                <SortHeader label="24h %" k="price_change_percentage_24h" sort={sort} dir={dir} onClick={toggleSort} />
                <th className="px-3 py-3 text-right">24h High</th>
                <th className="px-3 py-3 text-right">24h Low</th>
                <SortHeader label="Volume" k="total_volume" sort={sort} dir={dir} onClick={toggleSort} />
                <SortHeader label="Market Cap" k="market_cap" sort={sort} dir={dir} onClick={toggleSort} />
                <th className="px-3 py-3 text-right">7d</th>
              </tr>
            </thead>
            <tbody>
              {marketsQuery.isLoading &&
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td colSpan={9} className="px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {!marketsQuery.isLoading && rows.length === 0 && (
                <tr className="border-t">
                  <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                    {marketsQuery.data?.error ? "Data unavailable right now." : "No coins match your search."}
                  </td>
                </tr>
              )}
              {rows.map((c) => (
                <CoinRow key={c.id} coin={c} livePrice={live[c.symbol.toUpperCase()]} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" disabled={coins.length < 50} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

function SortHeader({
  label,
  k,
  sort,
  dir,
  onClick,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  dir: "asc" | "desc";
  onClick: (k: SortKey) => void;
}) {
  const active = sort === k;
  return (
    <th className="px-3 py-3 text-right">
      <button onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

function CoinRow({ coin, livePrice }: { coin: MarketCoin; livePrice?: number }) {
  const price = livePrice ?? coin.current_price;
  const change = coin.price_change_percentage_24h;
  const up = (change ?? 0) >= 0;
  const unavailable = price === null || price === undefined;

  return (
    <tr className={`border-t transition hover:bg-muted/40 ${unavailable ? "opacity-50" : ""}`}>
      <td className="px-3 py-3 text-muted-foreground">{coin.market_cap_rank ?? "—"}</td>
      <td className="px-3 py-3">
        <Link to="/markets/$coinId" params={{ coinId: coin.id }} className="flex items-center gap-2 font-medium hover:underline">
          <img
            src={coin.image}
            alt={coin.name}
            className="h-6 w-6 rounded-full bg-muted"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />

          <span>{coin.name}</span>
          <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
        </Link>
      </td>
      <td className="px-3 py-3 text-right font-mono">{unavailable ? "Data unavailable" : fmtPrice(price)}</td>
      <td className={`px-3 py-3 text-right font-mono ${up ? "text-success" : "text-destructive"}`}>{fmtPct(change)}</td>
      <td className="px-3 py-3 text-right font-mono text-muted-foreground">{fmtPrice(coin.high_24h)}</td>
      <td className="px-3 py-3 text-right font-mono text-muted-foreground">{fmtPrice(coin.low_24h)}</td>
      <td className="px-3 py-3 text-right font-mono">{fmtCompact(coin.total_volume)}</td>
      <td className="px-3 py-3 text-right font-mono">{fmtCompact(coin.market_cap)}</td>
      <td className="px-3 py-3 text-right">
        <Sparkline points={coin.sparkline} up={up} />
      </td>
    </tr>
  );
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (!points || points.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / span) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" className="ml-auto h-8 w-24" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={up ? "#22c55e" : "#ef4444"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function TrendingRow() {
  const fetchTrending = useServerFn(getTrending);
  const q = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending(),
    refetchInterval: 300_000,
  });

  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <TrendingUp className="h-4 w-4 text-primary" /> Trending
      </h2>
      {q.data?.error && <p className="mt-2 text-sm text-muted-foreground">{q.data.error}</p>}
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {q.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-44 shrink-0 rounded-xl" />)}
        {(q.data?.coins ?? []).map((c) => (
          <Link
            key={c.id}
            to="/markets/$coinId"
            params={{ coinId: c.id }}
            className="soft-card w-44 shrink-0 p-3 transition hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <img src={c.thumb} alt={c.name} className="h-6 w-6 rounded-full" loading="lazy" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{c.name}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{c.symbol}</div>
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm">{fmtPrice(c.price)}</span>
              <span className={`font-mono text-xs ${(c.change24h ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                {fmtPct(c.change24h)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function LiveBadge({ status }: { status: ConnStatus }) {
  const label = status === "live" ? "Live" : status === "connecting" ? "Connecting…" : "Reconnecting…";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
      {label}
    </span>
  );
}
