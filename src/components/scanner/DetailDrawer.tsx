import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BellPlus, Link2, Star } from "lucide-react";
import { toast } from "sonner";
import type { Quote } from "@contracts/market";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import CandleChart from "./CandleChart";
import {
  SCORE_PART_COLOR,
  fmtPct,
  fmtPrice,
  signalFor,
  staticsFor,
} from "./derive";
import type { ScoreParts } from "@contracts/market";

interface Props {
  symbol: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  watched: boolean;
  onToggleWatch: (symbol: string) => void;
}

interface FlagReason {
  color: string;
  text: string;
}

function flagReasons(q: Quote): FlagReason[] {
  const reasons: FlagReason[] = [];
  if (q.rvol >= 1.5)
    reasons.push({ color: "#00E68C", text: `RelVol ${q.rvol.toFixed(1)}× vs 20-day avg` });
  if (q.price >= q.dayHigh * 0.998 && q.rangePosition > 0.8)
    reasons.push({
      color: "#00E68C",
      text: `Pressing day high $${fmtPrice(q.dayHigh)} on expanding volume`,
    });
  else if (q.rangePosition >= 0.6)
    reasons.push({
      color: "#4DD8FF",
      text: `Trading in top ${Math.round(q.rangePosition * 100)}% of day range`,
    });
  if (Math.abs(q.gapPct) >= 2)
    reasons.push({
      color: "#FFB224",
      text: `Gapped ${q.gapPct >= 0 ? "+" : ""}${q.gapPct.toFixed(1)}% at the open`,
    });
  if (q.changePct <= -3)
    reasons.push({
      color: "#FF4D5E",
      text: `Down ${Math.abs(q.changePct).toFixed(1)}% — flush territory, watching for reclaim`,
    });
  if (reasons.length < 3)
    reasons.push({
      color: "#8B7CFF",
      text: `Composite edge score ${Math.round(q.score)} ranks near top of scan`,
    });
  return reasons.slice(0, 3);
}

function bandState(b: number): string {
  if (b > 1) return "Above upper band — extended";
  if (b >= 0.8) return "Near upper band";
  if (b > 0.2) return "Mid-band";
  if (b >= 0) return "Near lower band";
  return "Below lower band — washed out";
}

function TechRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between font-mono text-[11px]">
      <span className="text-ink-muted">{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

const SCORE_PART_ORDER: (keyof ScoreParts)[] = [
  "momentum",
  "volume",
  "technical",
  "pattern",
  "options",
  "events",
  "gap",
];

function usePrevPriceFlash(price: number | undefined) {
  const [flash, setFlash] = useState<{ dir: "up" | "down"; key: number } | null>(null);
  const prevRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const prev = prevRef.current;
    if (price !== undefined && prev !== undefined && price !== prev) {
      setFlash((f) => ({ dir: price > prev ? "up" : "down", key: (f?.key ?? 0) + 1 }));
      const id = setTimeout(() => setFlash(null), 320);
      prevRef.current = price;
      return () => clearTimeout(id);
    }
    prevRef.current = price;
  }, [price]);
  return flash;
}

export default function DetailDrawer({ symbol, open, onOpenChange, watched, onToggleWatch }: Props) {
  const detailQ = trpc.market.detail.useQuery(
    { symbol: symbol ?? "" },
    { enabled: open && !!symbol, refetchInterval: 5000 },
  );
  const [alertForm, setAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");

  // Reset the mini-form when switching symbols (adjust-state-during-render pattern)
  const [prevSymbol, setPrevSymbol] = useState(symbol);
  if (symbol !== prevSymbol) {
    setPrevSymbol(symbol);
    setAlertForm(false);
    setAlertPrice("");
  }

  const quote = detailQ.data?.quote ?? null;
  const candles = detailQ.data?.candles ?? [];
  const flash = usePrevPriceFlash(quote?.price);

  const up = (quote?.changePct ?? 0) >= 0;
  const statics = symbol ? staticsFor(symbol) : null;
  const signal = quote ? signalFor(quote) : null;

  const share = () => {
    const url = `${window.location.origin}/scanner?symbol=${symbol}`;
    void navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.success(url));
  };

  const setAlert = () => {
    const p = Number(alertPrice);
    if (!p || !symbol) return;
    try {
      const raw = localStorage.getItem("edgehawk-price-alerts");
      const list = raw ? (JSON.parse(raw) as unknown[]) : [];
      list.push({ symbol, price: p, ts: Date.now() });
      localStorage.setItem("edgehawk-price-alerts", JSON.stringify(list));
    } catch {
      /* storage unavailable */
    }
    toast.success(`Alert set — ${symbol} @ $${p.toFixed(2)}`);
    setAlertForm(false);
    setAlertPrice("");
  };

  const stats = quote
    ? [
        { label: "OPEN", value: `$${fmtPrice(quote.open)}` },
        { label: "HIGH", value: `$${fmtPrice(quote.dayHigh)}`, color: "#00E68C" },
        { label: "LOW", value: `$${fmtPrice(quote.dayLow)}`, color: "#FF4D5E" },
        { label: "RELVOL", value: `${quote.rvol.toFixed(2)}×`, color: "#4DD8FF" },
        { label: "FLOAT", value: statics ? `${statics.floatM}M` : "—" },
        { label: "SHORT %", value: statics ? `${statics.shortPct.toFixed(1)}%` : "—" },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-grid bg-carbon p-0 sm:max-w-[480px]"
      >
        <SheetTitle className="sr-only">{symbol ?? "Symbol"} detail</SheetTitle>
        <SheetDescription className="sr-only">
          Live quote, candlestick chart and signal context
        </SheetDescription>

        <div className="flex h-full flex-col overflow-y-auto">
          {/* Header */}
          <div className="border-b border-grid px-5 pb-4 pt-5">
            <div className="flex items-baseline gap-3 pr-8">
              <span className="font-mono text-3xl font-bold tracking-tight text-ink-primary">
                {symbol ?? "—"}
              </span>
              {signal && (
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider"
                  style={{
                    color: signal === "FADE" ? "#FF4D5E" : signal === "WATCH" ? "#FFB224" : signal === "HALT" ? "#8A94A6" : "#00E68C",
                    borderColor: "currentColor",
                  }}
                >
                  {signal}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-secondary">{quote?.name ?? "Loading…"}</p>
            {quote && (
              <div className="mt-3 flex items-end gap-3">
                <span
                  key={flash?.key ?? 0}
                  className={cn(
                    "rounded px-1 font-mono text-3xl font-bold text-ink-primary tabular-nums",
                    flash?.dir === "up" && "animate-tick-up",
                    flash?.dir === "down" && "animate-tick-down",
                  )}
                >
                  ${fmtPrice(quote.price)}
                </span>
                <span
                  className={cn(
                    "mb-1 rounded-full px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
                    up ? "bg-pulse/10 text-pulse" : "bg-signal/10 text-signal",
                  )}
                >
                  {up ? "▲" : "▼"} {fmtPct(quote.changePct)}
                </span>
              </div>
            )}
            {/* Events row */}
            {quote && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider tabular-nums"
                  style={
                    quote.daysToEarnings >= 0 && quote.daysToEarnings <= 5
                      ? {
                          color: "#FFB224",
                          borderColor: "#FFB22466",
                          backgroundColor: "#FFB22414",
                        }
                      : { color: "#8A94A6", borderColor: "#161F2C" }
                  }
                >
                  {quote.daysToEarnings === -1
                    ? "EARNINGS —"
                    : `EARNINGS IN ${quote.daysToEarnings}d`}
                </span>
                <span
                  className="rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider tabular-nums"
                  style={
                    quote.daysToFed <= 3
                      ? {
                          color: "#8B7CFF",
                          borderColor: "#8B7CFF66",
                          backgroundColor: "#8B7CFF14",
                        }
                      : { color: "#8A94A6", borderColor: "#161F2C" }
                  }
                >
                  FOMC IN {quote.daysToFed}d
                </span>
                {quote.optionsRatio >= 2 && (
                  <span
                    className="rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider tabular-nums"
                    style={{
                      color: "#FFB224",
                      borderColor: "#FFB22466",
                      backgroundColor: "#FFB22414",
                    }}
                  >
                    OPTS {quote.optionsRatio.toFixed(1)}× AVG
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="px-5 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-eyebrow text-ink-muted">1-MIN · LIVE</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-ice">
                <span className="inline-block h-px w-4 bg-ice" /> VWAP
              </span>
            </div>
            {candles.length > 0 ? (
              <CandleChart candles={candles} height={260} />
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-lg border border-grid bg-abyss font-mono text-xs text-ink-muted">
                STREAMING CANDLES…
              </div>
            )}
          </div>

          {/* Stat grid */}
          {quote && (
            <div className="grid grid-cols-3 gap-2 px-5 pt-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-lg border border-grid bg-steel p-2.5"
                >
                  <div className="font-mono text-[9px] tracking-wider text-ink-muted">{s.label}</div>
                  <div
                    className="mt-0.5 font-mono text-sm font-bold tabular-nums"
                    style={{ color: s.color ?? "#E8EDF4" }}
                  >
                    {s.value}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Technicals */}
          {quote && (
            <div className="px-5 pt-4">
              <div className="rounded-lg border border-grid bg-steel p-3.5">
                <div className="label-eyebrow mb-3 text-ink-secondary">TECHNICALS</div>

                {/* RSI gauge */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-ink-muted">RSI(14)</span>
                    <span
                      className="font-bold tabular-nums"
                      style={{
                        color:
                          quote.rsi > 70
                            ? "#FF4D5E"
                            : quote.rsi < 30
                              ? "#00E68C"
                              : "#E8EDF4",
                      }}
                    >
                      {quote.rsi.toFixed(0)}
                    </span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-grid">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(quote.rsi, 0), 100)}%`,
                        backgroundColor:
                          quote.rsi > 70
                            ? "#FF4D5E"
                            : quote.rsi < 30
                              ? "#00E68C"
                              : "#4DD8FF",
                      }}
                    />
                    <div
                      className="absolute -inset-y-0.5 w-px bg-ink-secondary/50"
                      style={{ left: "30%" }}
                    />
                    <div
                      className="absolute -inset-y-0.5 w-px bg-ink-secondary/50"
                      style={{ left: "70%" }}
                    />
                  </div>
                  <div className="relative mt-1 h-3 font-mono text-[8px] text-ink-muted">
                    <span
                      className="absolute -translate-x-1/2"
                      style={{ left: "30%" }}
                    >
                      30
                    </span>
                    <span
                      className="absolute -translate-x-1/2"
                      style={{ left: "70%" }}
                    >
                      70
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <TechRow label="MACD HIST">
                    <span
                      className="font-bold"
                      style={{ color: quote.macdHist >= 0 ? "#00E68C" : "#FF4D5E" }}
                    >
                      {quote.macdHist >= 0 ? "+" : ""}
                      {quote.macdHist.toFixed(3)}%
                    </span>
                  </TechRow>
                  {(
                    [
                      ["SMA20", quote.sma20],
                      ["SMA50", quote.sma50],
                    ] as const
                  ).map(([label, sma]) => {
                    const dist = ((quote.price - sma) / sma) * 100;
                    const above = dist >= 0;
                    return (
                      <TechRow key={label} label={`PRICE vs ${label}`}>
                        <span
                          className="font-bold"
                          style={{ color: above ? "#00E68C" : "#FF4D5E" }}
                        >
                          {above ? "▲ABOVE" : "▼BELOW"} {above ? "+" : ""}
                          {dist.toFixed(1)}%
                        </span>
                      </TechRow>
                    );
                  })}
                  <TechRow label="BOLLINGER %B">
                    <span className="font-bold text-ink-primary">
                      {quote.bollingerB.toFixed(2)}
                      <span className="ml-1.5 text-[9px] font-normal text-ink-muted">
                        {bandState(quote.bollingerB)}
                      </span>
                    </span>
                  </TechRow>
                  <TechRow label="ATR(14)">
                    <span className="font-bold text-ice">
                      {quote.atrPct.toFixed(2)}%
                    </span>
                  </TechRow>
                </div>
              </div>
            </div>
          )}

          {/* Edge score breakdown */}
          {quote && (
            <div className="px-5 pt-4">
              <div className="rounded-lg border border-grid bg-steel p-3.5">
                <div className="label-eyebrow mb-3 flex items-center justify-between text-ink-secondary">
                  <span>EDGE SCORE BREAKDOWN</span>
                  <span className="font-mono text-[10px] font-bold text-quant tabular-nums">
                    {Math.round(quote.score)}/100
                  </span>
                </div>
                {/* stacked bar */}
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-grid">
                  {SCORE_PART_ORDER.map((k) =>
                    quote.scoreParts[k] > 0 ? (
                      <div
                        key={k}
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(quote.scoreParts[k], 100)}%`,
                          backgroundColor: SCORE_PART_COLOR[k],
                        }}
                      />
                    ) : null,
                  )}
                </div>
                {/* legend */}
                <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
                  {SCORE_PART_ORDER.map((k) => (
                    <span
                      key={k}
                      className={cn(
                        "flex items-center gap-1.5 font-mono text-[10px] tabular-nums",
                        quote.scoreParts[k] > 0 ? "text-ink-secondary" : "text-ink-muted/50",
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: SCORE_PART_COLOR[k] }}
                      />
                      {k}
                      <span className="ml-auto font-bold">
                        +{Math.round(quote.scoreParts[k])}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Why it flagged */}
          {quote && (
            <div className="px-5 pt-4">
              <div className="rounded-lg border border-grid bg-steel p-3.5">
                <div className="label-eyebrow mb-2.5 text-ink-secondary">WHY IT FLAGGED</div>
                <ul className="space-y-2">
                  {flagReasons(quote).map((r) => (
                    <li key={r.text} className="flex items-start gap-2.5 text-xs text-ink-secondary">
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-mono leading-snug">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => symbol && onToggleWatch(symbol)}
                className={cn(
                  "btn-shine flex items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-xs transition-colors",
                  watched
                    ? "border-amber-watch/60 bg-amber-watch/10 text-amber-watch"
                    : "border-grid bg-steel text-ink-primary hover:border-amber-watch/50",
                )}
              >
                <Star className={cn("h-3.5 w-3.5", watched && "fill-amber-watch")} />
                {watched ? "WATCHING" : "ADD TO WATCHLIST"}
              </button>
              <button
                onClick={() => setAlertForm((v) => !v)}
                className="btn-shine flex items-center gap-1.5 rounded-lg border border-grid bg-steel px-3 py-2 font-mono text-xs text-ink-primary transition-colors hover:border-pulse/50"
              >
                <BellPlus className="h-3.5 w-3.5" /> SET PRICE ALERT
              </button>
              <button
                onClick={share}
                className="btn-shine flex items-center gap-1.5 rounded-lg border border-grid bg-steel px-3 py-2 font-mono text-xs text-ink-primary transition-colors hover:border-ice/50"
              >
                <Link2 className="h-3.5 w-3.5" /> SHARE
              </button>
            </div>
            {alertForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-grid bg-steel p-2">
                  <span className="pl-1 font-mono text-xs text-ink-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setAlert()}
                    placeholder={quote ? fmtPrice(quote.price) : "0.00"}
                    className="h-8 w-full rounded-md border border-grid bg-abyss px-2 font-mono text-xs text-ink-primary tabular-nums focus:border-pulse/50 focus:outline-none"
                  />
                  <button
                    onClick={setAlert}
                    disabled={!Number(alertPrice)}
                    className="shrink-0 rounded-md bg-pulse px-3 py-1.5 font-mono text-[11px] font-bold text-abyss transition-all hover:brightness-110 disabled:opacity-40"
                  >
                    NOTIFY ME
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
