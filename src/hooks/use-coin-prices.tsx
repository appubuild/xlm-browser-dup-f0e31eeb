import { useEffect, useState } from "react";

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_24h?: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

const COINS =
  "bitcoin,ethereum,ripple,tether,binancecoin,solana,usd-coin,cardano,dogecoin,tron,avalanche-2,chainlink,polkadot,stellar,litecoin";

let cache: { data: CoinMarket[]; ts: number } | null = null;

export function useCoinPrices(intervalMs = 60_000) {
  const [coins, setCoins] = useState<CoinMarket[]>(cache?.data ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (cache && Date.now() - cache.ts < 30_000) {
          setCoins(cache.data);
          setLoading(false);
          return;
        }
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS}&order=market_cap_desc&price_change_percentage=1h%2C24h%2C7d`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as CoinMarket[];
        cache = { data, ts: Date.now() };
        if (alive) {
          setCoins(data);
          setLoading(false);
        }
      } catch {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [intervalMs]);

  return { coins, loading };
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  image: { large: string };
  market_cap_rank: number;
  categories: string[];
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { github: string[] };
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_1h_in_currency: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    price_change_percentage_1y: number;
    ath: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_date: { usd: string };
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    fully_diluted_valuation: { usd: number } | null;
  };
  genesis_date: string | null;
  hashing_algorithm: string | null;
}

export async function fetchCoinDetails(id: string): Promise<CoinDetails | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
    );
    if (!res.ok) return null;
    return (await res.json()) as CoinDetails;
  } catch {
    return null;
  }
}
