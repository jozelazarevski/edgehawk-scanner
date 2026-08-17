import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@contracts/market";

interface Props {
  candles: Candle[];
  height?: number;
}

/**
 * Live 1-min candlestick chart (lightweight-charts): green/red candles,
 * volume histogram below, VWAP overlay in ice-cyan. Data re-streams while open.
 */
export default function CandleChart({ candles, height = 260 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Create chart once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8A94A6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(22,31,44,0.6)" },
        horzLines: { color: "rgba(22,31,44,0.6)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#4A5568", labelBackgroundColor: "#111823" },
        horzLine: { color: "#4A5568", labelBackgroundColor: "#111823" },
      },
      rightPriceScale: { borderColor: "#161F2C" },
      timeScale: { borderColor: "#161F2C", timeVisible: true, secondsVisible: false },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00E68C",
      downColor: "#FF4D5E",
      wickUpColor: "#00E68C",
      wickDownColor: "#FF4D5E",
      borderVisible: false,
    });
    const volSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const vwapSeries = chart.addSeries(LineSeries, {
      color: "#4DD8FF",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    chartRef.current = chart;
    candleRef.current = candleSeries;
    volRef.current = volSeries;
    vwapRef.current = vwapSeries;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      vwapRef.current = null;
    };
  }, [height]);

  // Stream data in
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !vwapRef.current || candles.length === 0) return;
    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(0,230,140,0.35)" : "rgba(255,77,94,0.35)",
      })),
    );
    // VWAP: cumulative typical-price * volume / cumulative volume
    let cumPV = 0;
    let cumV = 0;
    vwapRef.current.setData(
      candles.map((c) => {
        const tp = (c.high + c.low + c.close) / 3;
        cumPV += tp * c.volume;
        cumV += c.volume;
        return { time: c.time as UTCTimestamp, value: cumV > 0 ? cumPV / cumV : tp };
      }),
    );
    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height }}
      className="cursor-crosshair overflow-hidden rounded-lg border border-grid bg-abyss"
    />
  );
}
