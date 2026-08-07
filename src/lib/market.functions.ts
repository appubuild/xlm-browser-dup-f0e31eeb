import { createServerFn } from "@tanstack/react-start";
import {
  loadMarkets,
  loadTrending,
  loadCoin,
  loadKlines,
  resolveBinanceSymbol,
} from "./market.server";

export const getMarkets = createServerFn({ method: "GET" })
  .inputValidator((input: { page?: number; perPage?: number } | undefined) => ({
    page: Math.min(Math.max(Number(input?.page ?? 1), 1), 20),
    perPage: Math.min(Math.max(Number(input?.perPage ?? 50), 10), 250),
  }))
  .handler(async ({ data }) => {
    try {
      return { coins: await loadMarkets(data.page, data.perPage), error: null as string | null };
    } catch {
      return { coins: [], error: "Market data temporarily unavailable" };
    }
  });

export const getTrending = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { coins: await loadTrending(), error: null as string | null };
  } catch {
    return { coins: [], error: "Trending data temporarily unavailable" };
  }
});

export const getCoinOverview = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id).slice(0, 80) }))
  .handler(async ({ data }) => {
    try {
      const coin = await loadCoin(data.id);
      if (!coin) return { coin: null, binanceSymbol: null, error: "Coin not found" };
      const binanceSymbol = await resolveBinanceSymbol(coin.symbol);
      return { coin, binanceSymbol, error: null as string | null };
    } catch {
      return { coin: null, binanceSymbol: null, error: "Coin data temporarily unavailable" };
    }
  });

export const getKlines = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string; interval: string; limit?: number }) => ({
    symbol: String(input.symbol).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20),
    interval: String(input.interval).replace(/[^a-zA-Z0-9]/g, "").slice(0, 4),
    limit: Math.min(Math.max(Number(input.limit ?? 500), 50), 1000),
  }))
  .handler(async ({ data }) => {
    try {
      return { candles: await loadKlines(data.symbol, data.interval, data.limit), error: null as string | null };
    } catch {
      return { candles: [], error: "Chart data temporarily unavailable" };
    }
  });
