import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/public-shell";
import { getCoinOverview, getKlines } from "@/lib/market.functions";
import { fmtCompact, fmtPct, fmtPrice, openBinanceStream, priceDecimals, type ConnStatus } from "@/lib/market-format";
import type { Candle } from "@/lib/market-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveBadge } from "./markets.index";
import { ArrowLeft } from "lucide-react";

const MarketChart = lazy(() => import("@/components/market-chart"));

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"] as const;
type Interval = (typeof INTERVALS)[number];

export const Route = createFileRoute("/markets/$coinId")({
  head: ({ params }) => {
    const name = params.coinId.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return {
      meta: [
        { title: `${name} Price Chart & Live Market Data | XLM Browser` },
        { name: "description", content: `Live ${name} price, 24h change, high/low, volume and real-time candlestick chart with multiple timeframes.` },
        { property: "og:title", content: `${name} Live Price Chart` },
        { property: "og:description", content: `Real-time ${name} candlestick chart powered by Binance market data.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CoinDetailPage,
});

function CoinDetailPage() {
  const { coinId } = Route.useParams();
  const fetchOverview = useServerFn(getCoinOverview);
  const fetchKlines = useServerFn(getKlines);

  const [interval, setIntervalValue] = useState<Interval>("1h");
  const [chartType, setChartType] = useState<"candles" | "line">("candles");
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [ticker, setTicker] = useState<{ price: number; change: number; high: number; low: number } | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const candlesRef = useRef<Candle[]>([]);

  const overview = useQuery({
    queryKey: ["coin", coinId],
    queryFn: () => fetchOverview({ data: { id: coinId } }),
    refetchInterval: 60_000,
  });

  const coin = overview.data?.coin ?? null;
  const symbol = overview.data?.binanceSymbol ?? null;

  const klines = useQuery({
    queryKey: ["klines", symbol, interval],
    queryFn: () => fetchKlines({ data: { symbol: symbol!, interval, limit: 500 } }),
    enabled: !!symbol,
  });

  useEffect(() => {
    const list = klines.data?.candles ?? [];
    candlesRef.current = list;
    setCandles(list);
  }, [klines.data]);

  // Live kline + ticker stream for this pair.
  useEffect(() => {
    if (!symbol) return;
    const lower = symbol.toLowerCase();
    const dispose = openBinanceStream(
      [`${lower}@kline_${interval}`, `${lower}@ticker`],
      (payload) => {
        if (payload.e === "kline") {
          const k = payload.k;
          const candle: Candle = {
            time: Math.floor(Number(k.t) / 1000),
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            volume: Number(k.v),
          };
          const list = candlesRef.current;
          const last = list[list.length - 1];
          const next = last && last.time === candle.time ? [...list.slice(0, -1), candle] : [...list, candle];
          candlesRef.current = next;
          setCandles(next);
        } else if (payload.e === "24hrTicker") {
          setTicker({
            price: Number(payload.c),
            change: Number(payload.P),
            high: Number(payload.h),
            low: Number(payload.l),
          });
        }
      },
      setStatus,
    );
    return dispose;
  }, [symbol, interval]);

  const price = ticker?.price ?? coin?.current_price ?? null;
  const change = ticker?.change ?? coin?.price_change_percentage_24h ?? null;
  const high = ticker?.high ?? coin?.high_24h ?? null;
  const low = ticker?.low ?? coin?.low_24h ?? null;
  const decimals = useMemo(() => priceDecimals(price), [price]);
  const up = (change ?? 0) >= 0;

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <Link to="/markets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All markets
        </Link>

        {overview.isLoading && <Skeleton className="mt-4 h-24 w-full rounded-xl" />}

        {overview.data?.error && !coin && (
          <div className="mt-4 rounded-xl border p-8 text-center text-muted-foreground">
            {overview.data.error}. Retrying automatically…
          </div>
        )}

        {coin && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {coin.name} <span className="text-base font-normal uppercase text-muted-foreground">{coin.symbol}</span>
                  </h1>
                  <div className="text-xs text-muted-foreground">Rank #{coin.market_cap_rank ?? "—"}</div>
                </div>
              </div>
              <LiveBadge status={symbol ? status : "connecting"} />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-6">
              <div>
                <div className="font-mono text-3xl font-bold">{fmtPrice(price)}</div>
                <div className={`font-mono text-sm ${up ? "text-success" : "text-destructive"}`}>{fmtPct(change)} (24h)</div>
              </div>
              <Stat label="24h High" value={fmtPrice(high)} />
              <Stat label="24h Low" value={fmtPrice(low)} />
              <Stat label="24h Volume" value={fmtCompact(coin.total_volume)} />
              <Stat label="Market Cap" value={fmtCompact(coin.market_cap)} />
            </div>

            <div className="mt-6 rounded-xl border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1">
                  {INTERVALS.map((iv) => (
                    <Button
                      key={iv}
                      size="sm"
                      variant={iv === interval ? "default" : "ghost"}
                      onClick={() => setIntervalValue(iv)}
                      className="h-7 px-2.5 text-xs uppercase"
                    >
                      {iv}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={chartType === "candles" ? "default" : "ghost"} onClick={() => setChartType("candles")} className="h-7 px-2.5 text-xs">
                    Candles
                  </Button>
                  <Button size="sm" variant={chartType === "line" ? "default" : "ghost"} onClick={() => setChartType("line")} className="h-7 px-2.5 text-xs">
                    Line
                  </Button>
                </div>
              </div>

              <div className="mt-3">
                {!symbol ? (
                  <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                    Live chart data unavailable for this coin (no Binance USDT pair).
                  </div>
                ) : klines.isLoading ? (
                  <Skeleton className="h-[420px] w-full md:h-[520px]" />
                ) : klines.data?.error && candles.length === 0 ? (
                  <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
                    {klines.data.error}. Retrying…
                  </div>
                ) : (
                  <ClientOnly fallback={<Skeleton className="h-[420px] w-full md:h-[520px]" />}>
                    <Suspense fallback={<Skeleton className="h-[420px] w-full md:h-[520px]" />}>
                      <MarketChart candles={candles} type={chartType} decimals={decimals} />
                    </Suspense>
                  </ClientOnly>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
