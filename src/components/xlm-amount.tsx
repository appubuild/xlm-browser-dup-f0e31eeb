import { useApp } from "@/lib/app-store";

/** Live XLM→USD rate (CoinGecko, refreshed every 60s in the app store). */
export function useXlmUsd() {
  const { xlmPrice } = useApp();
  const rate = xlmPrice.price;
  return {
    rate,
    change: xlmPrice.change,
    usd: (xlm: number) => (rate > 0 ? xlm * rate : null),
    format: (xlm: number) => formatUsd(rate > 0 ? xlm * rate : null),
  };
}

export function formatUsd(v: number | null) {
  if (v === null || Number.isNaN(v)) return null;
  if (v > 0 && v < 0.01) return "<$0.01";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Renders an XLM amount with its real-time USD value, e.g. `25 XLM ≈ $3.12`.
 * `size` controls the USD line style; `inline` keeps both on one line.
 */
export function XlmAmount({
  xlm,
  className = "",
  usdClassName = "",
  inline = false,
  showSymbol = true,
}: {
  xlm: number;
  className?: string;
  usdClassName?: string;
  inline?: boolean;
  showSymbol?: boolean;
}) {
  const { format } = useXlmUsd();
  const usd = format(xlm);
  const amount = (
    <span className={className}>
      {xlm}
      {showSymbol && <span className="ml-1 text-[0.75em] font-normal text-muted-foreground">XLM</span>}
    </span>
  );

  if (inline) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        {amount}
        {usd && <span className={`text-xs text-muted-foreground ${usdClassName}`}>≈ {usd}</span>}
      </span>
    );
  }

  return (
    <span className="inline-block">
      {amount}
      {usd && <span className={`block text-xs font-normal text-muted-foreground ${usdClassName}`}>≈ {usd} USD</span>}
    </span>
  );
}
