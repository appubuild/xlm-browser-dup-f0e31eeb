import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/market-types";

export default function MarketChart({
  candles,
  type,
  decimals,
}: {
  candles: Candle[];
  type: "candles" | "line";
  decimals: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const typeRef = useRef(type);
  typeRef.current = type;
  const dataRef = useRef(candles);
  dataRef.current = candles;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const lc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;

      const chart = lc.createChart(containerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(148,163,184,0.12)" },
          horzLines: { color: "rgba(148,163,184,0.12)" },
        },
        localization: { locale: "en-US" },
        crosshair: { mode: lc.CrosshairMode.Normal },
        rightPriceScale: { borderColor: "rgba(148,163,184,0.2)" },
        timeScale: { borderColor: "rgba(148,163,184,0.2)", timeVisible: true, secondsVisible: false },
        autoSize: true,
      });

      const series =
        typeRef.current === "line"
          ? chart.addSeries(lc.LineSeries, { color: "#22c55e", lineWidth: 2 })
          : chart.addSeries(lc.CandlestickSeries, {
              upColor: "#22c55e",
              downColor: "#ef4444",
              borderUpColor: "#22c55e",
              borderDownColor: "#ef4444",
              wickUpColor: "#22c55e",
              wickDownColor: "#ef4444",
            });

      series.applyOptions({
        priceFormat: { type: "price", precision: decimals, minMove: 1 / 10 ** decimals },
      });

      chartRef.current = chart;
      seriesRef.current = series;
      setData(series, dataRef.current, typeRef.current);
      chart.timeScale().fitContent();

      cleanup = () => {
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // Rebuild the series when the chart type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, decimals]);

  useEffect(() => {
    if (seriesRef.current) setData(seriesRef.current, candles, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  return <div ref={containerRef} className="h-[420px] w-full md:h-[520px]" />;
}

function setData(series: any, candles: Candle[], type: "candles" | "line") {
  console.log("CHARTDBG setData", candles.length, type, candles[0]);
  if (!candles.length) return;
  if (type === "line") {
    series.setData(candles.map((c) => ({ time: c.time as any, value: c.close })));
  } else {
    series.setData(
      candles.map((c) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })),
    );
  }
}
