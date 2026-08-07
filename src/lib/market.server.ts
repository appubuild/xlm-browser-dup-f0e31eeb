// Server-only market data helpers with a short in-memory cache so that many
// simultaneous visitors share a single upstream API call.

type CacheEntry = { ts: number; value: unknown };
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return hit.value as T;
  try {
    const value = await loader();
    cache.set(key, { ts: Date.now(), value });
    return value;
  } catch (err) {
    // Serve stale data rather than breaking the page.
    if (hit) return hit.value as T;
    throw err;
  }
}

const CG = "https://api.coingecko.com/api/v3";

function cgHeaders(): Record<string, string> {
  const key = process.env["COINGECKO_API_KEY"];
  return key ? { "x-cg-demo-api-key": key } : {};
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json", ...headers } });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  sparkline: number[];
}

/** Binance 24h tickers for all USDT spot pairs, sorted by quote volume. */
async function binanceUsdtTickers(): Promise<any[]> {
  return cached("binance:ticker24h", 30_000, async () => {
    const raw = await getJson<any[]>("https://api.binance.com/api/v3/ticker/24hr");
    return raw
      .filter((t) => typeof t.symbol === "string" && t.symbol.endsWith("USDT") && !/(UP|DOWN|BULL|BEAR)USDT$/.test(t.symbol))
      .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));
  });
}

function iconFor(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

/** Fallback market list built purely from Binance when CoinGecko is unavailable. */
async function binanceMarkets(page: number, perPage: number): Promise<MarketCoin[]> {
  const tickers = await binanceUsdtTickers();
  const start = (page - 1) * perPage;
  return tickers.slice(start, start + perPage).map((t, i) => {
    const base = String(t.symbol).replace(/USDT$/, "");
    return {
      id: base.toLowerCase(),
      symbol: base.toLowerCase(),
      name: base,
      image: iconFor(base),
      current_price: Number(t.lastPrice) || null,
      market_cap: null,
      market_cap_rank: start + i + 1,
      total_volume: Number(t.quoteVolume) || null,
      high_24h: Number(t.highPrice) || null,
      low_24h: Number(t.lowPrice) || null,
      price_change_percentage_24h: Number(t.priceChangePercent) || null,
      sparkline: [],
    };
  });
}

export async function loadMarkets(page: number, perPage: number): Promise<MarketCoin[]> {
  return cached(`markets:${page}:${perPage}`, 30_000, async () => {
    const url = `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h`;
    let raw: any[];
    try {
      raw = await getJson<any[]>(url, cgHeaders());
      if (!Array.isArray(raw) || raw.length === 0) throw new Error("empty");
    } catch {
      return binanceMarkets(page, perPage);
    }
    return raw.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      current_price: c.current_price ?? null,
      market_cap: c.market_cap ?? null,
      market_cap_rank: c.market_cap_rank ?? null,
      total_volume: c.total_volume ?? null,
      high_24h: c.high_24h ?? null,
      low_24h: c.low_24h ?? null,
      price_change_percentage_24h: c.price_change_percentage_24h ?? null,
      sparkline: Array.isArray(c.sparkline_in_7d?.price) ? c.sparkline_in_7d.price.filter((_: number, i: number) => i % 4 === 0) : [],
    }));
  });
}


export interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
}

export async function loadTrending(): Promise<TrendingCoin[]> {
  return cached("trending", 180_000, async () => {
    try {
      const raw = await getJson<any>(`${CG}/search/trending`, cgHeaders());
      const list = (raw.coins ?? []).map((entry: any) => {
        const c = entry.item ?? {};
        return {
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          thumb: c.small ?? c.thumb,
          rank: c.market_cap_rank ?? null,
          price: typeof c.data?.price === "number" ? c.data.price : Number(c.data?.price) || null,
          change24h: typeof c.data?.price_change_percentage_24h?.usd === "number" ? c.data.price_change_percentage_24h.usd : null,
        };
      });
      if (list.length) return list;
      throw new Error("empty");
    } catch {
      // Fallback: top movers by volume from Binance.
      const tickers = await binanceUsdtTickers();
      return tickers
        .slice(0, 40)
        .sort((a, b) => Number(b.priceChangePercent) - Number(a.priceChangePercent))
        .slice(0, 8)
        .map((t) => {
          const base = String(t.symbol).replace(/USDT$/, "");
          return {
            id: base.toLowerCase(),
            symbol: base.toLowerCase(),
            name: base,
            thumb: iconFor(base),
            rank: null,
            price: Number(t.lastPrice) || null,
            change24h: Number(t.priceChangePercent) || null,
          };
        });
    }
  });
}

export async function loadCoin(id: string): Promise<MarketCoin | null> {
  return cached(`coin:${id}`, 30_000, async () => {
    const url = `${CG}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(id)}&sparkline=true&price_change_percentage=24h`;
    let c: any = null;
    try {
      const list = await getJson<any[]>(url, cgHeaders());
      c = list[0] ?? null;
    } catch {
      c = null;
    }
    if (!c) {
      // Fallback: build the coin from the Binance USDT pair.
      const tickers = await binanceUsdtTickers();
      const base = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const t = tickers.find((x) => x.symbol === `${base}USDT`);
      if (!t) return null;
      return {
        id: base.toLowerCase(),
        symbol: base.toLowerCase(),
        name: base,
        image: iconFor(base),
        current_price: Number(t.lastPrice) || null,
        market_cap: null,
        market_cap_rank: null,
        total_volume: Number(t.quoteVolume) || null,
        high_24h: Number(t.highPrice) || null,
        low_24h: Number(t.lowPrice) || null,
        price_change_percentage_24h: Number(t.priceChangePercent) || null,
        sparkline: [],
      };
    }
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      current_price: c.current_price ?? null,
      market_cap: c.market_cap ?? null,
      market_cap_rank: c.market_cap_rank ?? null,
      total_volume: c.total_volume ?? null,
      high_24h: c.high_24h ?? null,
      low_24h: c.low_24h ?? null,
      price_change_percentage_24h: c.price_change_percentage_24h ?? null,
      sparkline: [],
    };
  });
}


/** Binance symbols that exist as USDT pairs (cached 1h). */
async function binanceUsdtSymbols(): Promise<Set<string>> {
  return cached("binance:symbols", 3_600_000, async () => {
    const data = await getJson<any>("https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT");
    const set = new Set<string>();
    for (const s of data.symbols ?? []) {
      if (s.status === "TRADING" && s.quoteAsset === "USDT") set.add(s.symbol);
    }
    return set;
  });
}

export async function resolveBinanceSymbol(symbol: string): Promise<string | null> {
  const candidate = `${symbol.toUpperCase()}USDT`;
  try {
    const set = await binanceUsdtSymbols();
    return set.has(candidate) ? candidate : null;
  } catch {
    return candidate;
  }
}

export interface Candle {
  time: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function loadKlines(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  return cached(`kline:${symbol}:${interval}:${limit}`, 5_000, async () => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const raw = await getJson<any[][]>(url);
    return raw.map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
    }));
  });
}
