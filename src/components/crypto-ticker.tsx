import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCoinPrices, fetchCoinDetails, type CoinMarket, type CoinDetails } from "@/hooks/use-coin-prices";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

function fmt(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(digits)}`;
}

function price(n: number) {
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

function ChangePill({ v }: { v: number | null | undefined }) {
  if (v === null || v === undefined || Number.isNaN(v)) return <span className="text-muted-foreground">—</span>;
  const up = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono ${up ? "text-success" : "text-destructive"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {v.toFixed(2)}%
    </span>
  );
}

export function CryptoTicker() {
  const { coins, loading } = useCoinPrices();
  const [selected, setSelected] = useState<CoinMarket | null>(null);

  if (loading && coins.length === 0) {
    return (
      <div className="flex-1 overflow-hidden rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        Loading live prices…
      </div>
    );
  }

  const items = [...coins, ...coins]; // duplicate for seamless marquee

  return (
    <>
      <div className="w-full overflow-hidden border-b bg-muted/50">
        <div className="ticker-marquee py-1.5 text-xs">
          {items.map((c, i) => {
            const change = c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h;
            const up = (change ?? 0) >= 0;
            return (
              <button
                key={`${c.id}-${i}`}
                onClick={() => setSelected(c)}
                className="mx-4 inline-flex items-center gap-1.5 hover:underline"
              >
                <img src={c.image} alt={c.symbol} className="h-4 w-4 rounded-full" />
                <span className="font-semibold uppercase">{c.symbol}</span>
                <span className="font-mono">{price(c.current_price)}</span>
                <span className={`font-mono ${up ? "text-success" : "text-destructive"}`}>
                  {up ? "▲" : "▼"} {(change ?? 0).toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <CoinDetailsDialog coin={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function CoinDetailsDialog({ coin, onClose }: { coin: CoinMarket | null; onClose: () => void }) {
  const [details, setDetails] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coin) { setDetails(null); return; }
    setLoading(true);
    fetchCoinDetails(coin.id).then((d) => { setDetails(d); setLoading(false); });
  }, [coin]);

  const md = details?.market_data;
  const change24 = coin?.price_change_percentage_24h_in_currency ?? coin?.price_change_percentage_24h;

  return (
    <Dialog open={!!coin} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {coin && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <img src={coin.image} alt={coin.symbol} className="h-8 w-8 rounded-full" />
                <div>
                  <div>{coin.name} <span className="text-sm font-normal uppercase text-muted-foreground">{coin.symbol}</span></div>
                  <div className="text-xs font-normal text-muted-foreground">Rank #{coin.market_cap_rank}</div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-bold font-mono">{price(coin.current_price)}</div>
              <ChangePill v={change24} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="1h" value={<ChangePill v={coin.price_change_percentage_1h_in_currency} />} />
              <Stat label="24h" value={<ChangePill v={change24} />} />
              <Stat label="7d" value={<ChangePill v={coin.price_change_percentage_7d_in_currency ?? md?.price_change_percentage_7d} />} />
              <Stat label="30d" value={<ChangePill v={md?.price_change_percentage_30d} />} />
              <Stat label="Market Cap" value={fmt(coin.market_cap)} />
              <Stat label="24h Volume" value={fmt(coin.total_volume)} />
              <Stat label="24h High" value={md ? price(md.high_24h.usd) : "—"} />
              <Stat label="24h Low" value={md ? price(md.low_24h.usd) : "—"} />
              <Stat label="Circulating" value={coin.circulating_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"} />
              <Stat label="Total Supply" value={coin.total_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"} />
              <Stat label="Max Supply" value={coin.max_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "∞"} />
              <Stat label="FDV" value={md?.fully_diluted_valuation ? fmt(md.fully_diluted_valuation.usd) : "—"} />
              <Stat label="ATH" value={`${price(coin.ath)} (${coin.ath_change_percentage.toFixed(1)}%)`} />
              <Stat label="ATH Date" value={new Date(coin.ath_date).toLocaleDateString()} />
              <Stat label="ATL" value={`${price(coin.atl)} (${coin.atl_change_percentage.toFixed(1)}%)`} />
              <Stat label="ATL Date" value={new Date(coin.atl_date).toLocaleDateString()} />
            </div>

            {loading && <div className="text-center text-sm text-muted-foreground">Loading details…</div>}

            {details && (
              <>
                {details.description?.en && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed max-h-40 overflow-y-auto"
                       dangerouslySetInnerHTML={{ __html: details.description.en.split(". ").slice(0, 4).join(". ") + "." }} />
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {details.links.homepage?.[0] && <LinkChip href={details.links.homepage[0]} label="Website" />}
                  {details.links.twitter_screen_name && <LinkChip href={`https://twitter.com/${details.links.twitter_screen_name}`} label="Twitter" />}
                  {details.links.subreddit_url && <LinkChip href={details.links.subreddit_url} label="Reddit" />}
                  {details.links.telegram_channel_identifier && <LinkChip href={`https://t.me/${details.links.telegram_channel_identifier}`} label="Telegram" />}
                  {details.links.repos_url?.github?.[0] && <LinkChip href={details.links.repos_url.github[0]} label="GitHub" />}
                  {details.links.blockchain_site?.filter(Boolean).slice(0, 2).map((u) => <LinkChip key={u} href={u} label="Explorer" />)}
                </div>
                {details.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {details.categories.slice(0, 8).map((c) => <span key={c} className="rounded-full bg-secondary px-2 py-0.5">{c}</span>)}
                  </div>
                )}
              </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Data via CoinGecko · Last updated {new Date(coin.last_updated).toLocaleTimeString()}</div>
              <Link
                to="/markets/$coinId"
                params={{ coinId: coin.id }}
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Open full market <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 hover:bg-muted">
      <ExternalLink className="h-3 w-3" /> {label}
    </a>
  );
}

/** Project ticker (below hero). Uses admin-managed tickers from app store. */
export function ProjectTicker({ tickers }: { tickers: { id: string; label: string; linkedProjectSlug?: string | null; visible: boolean; sortOrder: number }[] }) {
  const items = tickers.filter((t) => t.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="w-full overflow-hidden border-y bg-muted/30">
      <div className="ticker-marquee py-2 text-xs">
        {doubled.map((t, i) => (
          <span key={`${t.id}-${i}`} className="mx-6 inline-flex items-center gap-1.5">
            <span className="text-primary">◆</span>
            {t.linkedProjectSlug ? (
              <a href={`/project/${t.linkedProjectSlug}`} className="font-semibold hover:underline">{t.label}</a>
            ) : (
              <span className="font-semibold">{t.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Live crypto prices grid (CoinGecko). */
export function LivePricesGrid() {
  const { coins, loading } = useCoinPrices();
  const [selected, setSelected] = useState<CoinMarket | null>(null);
  if (loading && coins.length === 0) return <div className="text-sm text-muted-foreground">Loading live prices…</div>;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {coins.slice(0, 6).map((c) => {
          const change = c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0;
          const up = change >= 0;
          return (
            <button key={c.id} onClick={() => setSelected(c)} className="soft-card p-3 text-left transition hover:shadow-md">
              <div className="flex items-center gap-2">
                <img src={c.image} alt={c.symbol} className="h-6 w-6 rounded-full" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{c.symbol}</div>
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="font-mono text-base font-bold">{price(c.current_price)}</span>
                <span className={`font-mono text-xs ${up ? "text-success" : "text-destructive"}`}>
                  {up ? "▲" : "▼"} {change.toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <CoinDetailsDialog coin={selected} onClose={() => setSelected(null)} />
    </>
  );
}
