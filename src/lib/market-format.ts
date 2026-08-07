export function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : abs >= 0.0001 ? 6 : 8;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fmtCompact(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function priceDecimals(v: number | null | undefined): number {
  const abs = Math.abs(v ?? 1);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs >= 0.0001) return 6;
  return 8;
}

export type ConnStatus = "connecting" | "live" | "reconnecting";

/**
 * Resilient Binance public WebSocket with auto-reconnect + backoff.
 * Returns a disposer.
 */
export function openBinanceStream(
  streams: string[],
  onMessage: (payload: any) => void,
  onStatus?: (s: ConnStatus) => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (closed) return;
    onStatus?.(attempt === 0 ? "connecting" : "reconnecting");
    const url = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;
    try {
      ws = new WebSocket(url);
    } catch {
      schedule();
      return;
    }
    ws.onopen = () => {
      attempt = 0;
      onStatus?.("live");
    };
    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data as string);
        onMessage(parsed.data ?? parsed);
      } catch {
        /* ignore malformed frame */
      }
    };
    ws.onerror = () => ws?.close();
    ws.onclose = () => {
      if (closed) return;
      onStatus?.("reconnecting");
      schedule();
    };
  };

  const schedule = () => {
    attempt += 1;
    const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 30_000);
    timer = setTimeout(connect, delay);
  };

  connect();

  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    try {
      ws?.close();
    } catch {
      /* noop */
    }
  };
}
