import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Sparkline from "./Sparkline";
import {
  PATTERN_CHIP,
  SIGNAL_COLOR,
  fmtFloat,
  fmtPct,
  fmtPrice,
  topScoreContributors,
  type FlashMap,
  type RowExt,
} from "./derive";

export type TableSortKey =
  | "symbol"
  | "price"
  | "changePct"
  | "rvol"
  | "rsi"
  | "float"
  | "signal"
  | "score";

interface Props {
  rows: RowExt[];
  flashes: FlashMap;
  histories: Map<string, number[]>;
  sortKey: TableSortKey;
  sortDir: 1 | -1;
  onSort: (k: TableSortKey) => void;
  onSelect: (symbol: string) => void;
  highlight: { symbol: string; key: number } | null;
  alerted: Set<string>;
  paused: boolean;
  loading: boolean;
}

const HEADERS: { key: TableSortKey | null; label: string; align?: "right" | "center" }[] = [
  { key: null, label: "" },
  { key: "symbol", label: "SYMBOL" },
  { key: "price", label: "PRICE", align: "right" },
  { key: "changePct", label: "CHG%", align: "right" },
  { key: "rvol", label: "RELVOL", align: "right" },
  { key: "rsi", label: "RSI", align: "right" },
  { key: "float", label: "FLOAT", align: "right" },
  { key: "signal", label: "SIGNAL", align: "center" },
  { key: null, label: "SIGNS", align: "center" },
  { key: "score", label: "Q-SCORE", align: "center" },
  { key: null, label: "SPARK", align: "right" },
];

export default function ResultsTable({
  rows,
  flashes,
  histories,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  highlight,
  alerted,
  paused,
  loading,
}: Props) {
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  return (
    <div className="relative min-h-0 flex-1 cursor-crosshair overflow-y-auto">
      {/* Paused overlay badge */}
      {paused && (
        <div className="pointer-events-none sticky top-3 z-30 flex justify-center">
          <span className="absolute rounded-full border border-amber-watch/60 bg-abyss/90 px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-amber-watch shadow-glow">
            FEED PAUSED
          </span>
        </div>
      )}

      <table className="w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 z-20">
          <tr className="bg-steel">
            {HEADERS.map((h, i) => (
              <th
                key={i}
                onClick={h.key ? () => onSort(h.key!) : undefined}
                className={cn(
                  "label-eyebrow h-9 whitespace-nowrap border-b border-grid px-3 font-sans text-[10px] text-ink-muted",
                  h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : "text-left",
                  h.key && "cursor-pointer select-none hover:text-ink-primary",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {h.label}
                  {h.key && sortKey === h.key && (
                    <ArrowUp
                      className={cn(
                        "h-3 w-3 text-pulse transition-transform duration-300",
                        sortDir === 1 ? "rotate-0" : "rotate-180",
                      )}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 14 }).map((_, i) => (
              <tr key={`sk-${i}`} className="h-10 border-b border-grid/60">
                <td colSpan={9} className="px-3">
                  <div
                    className="h-3 animate-pulse rounded bg-steel"
                    style={{ width: `${88 - (i % 5) * 9}%`, animationDelay: `${i * 60}ms` }}
                  />
                </td>
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={11} className="h-40 text-center font-mono text-xs text-ink-muted">
                NO SYMBOLS MATCH — LOOSEN THE FILTERS
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((r, i) => {
              const up = r.changePct >= 0;
              const flash = flashes[r.symbol];
              const isHighlighted = highlight?.symbol === r.symbol;
              return (
                <motion.tr
                  key={r.symbol}
                  ref={isHighlighted ? highlightRef : undefined}
                  layout="position"
                  initial={{ opacity: 0, backgroundColor: "rgba(255,178,36,0.14)" }}
                  animate={{ opacity: 1, backgroundColor: "rgba(255,178,36,0)" }}
                  transition={{
                    opacity: { duration: 0.35, delay: Math.min(i * 0.03, 0.6) },
                    backgroundColor: { duration: 2 },
                    layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  }}
                  onClick={() => onSelect(r.symbol)}
                  className={cn(
                    "h-10 cursor-crosshair border-b border-grid/60 transition-colors hover:bg-steel",
                    isHighlighted && "animate-ring-pulse",
                  )}
                >
                  {/* flag */}
                  <td className="w-8 pl-3">
                    <Flag
                      className={cn(
                        "h-3 w-3",
                        alerted.has(r.symbol) ? "fill-amber-watch/30 text-amber-watch" : "text-grid",
                      )}
                    />
                  </td>
                  {/* symbol */}
                  <td className="px-3">
                    <span
                      className="inline-block rounded-md bg-steel px-2 py-0.5 text-[11px] font-bold text-ink-primary"
                      style={{ borderLeft: `2px solid ${up ? "#00E68C" : "#FF4D5E"}` }}
                    >
                      {r.symbol}
                    </span>
                  </td>
                  {/* price */}
                  <td className="px-3 text-right tabular-nums">
                    <span
                      key={flash?.price?.key ?? 0}
                      className={cn(
                        "rounded px-1 py-0.5 text-ink-primary",
                        flash?.price?.dir === "up" && "animate-tick-up",
                        flash?.price?.dir === "down" && "animate-tick-down",
                      )}
                    >
                      {fmtPrice(r.price)}
                    </span>
                  </td>
                  {/* chg% (gap merged as muted subscript) */}
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 text-right tabular-nums",
                      up ? "text-pulse" : "text-signal",
                    )}
                  >
                    {up ? "▲" : "▼"} {fmtPct(r.changePct)}
                    {Math.abs(r.gapPct) >= 1 && (
                      <span className="ml-1 align-baseline text-[9px] text-ink-muted">
                        G{r.gapPct >= 0 ? "+" : ""}
                        {r.gapPct.toFixed(1)}
                      </span>
                    )}
                  </td>
                  {/* rvol */}
                  <td className="px-3 text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-grid md:inline-block">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-pulse/30 to-pulse transition-all duration-500"
                          style={{ width: `${Math.min((r.rvol / 10) * 100, 100)}%` }}
                        />
                      </span>
                      <span className="text-ink-secondary">{r.rvol.toFixed(1)}×</span>
                    </span>
                  </td>
                  {/* rsi */}
                  <td
                    className="px-3 text-right tabular-nums"
                    style={{
                      color:
                        r.rsi > 70 ? "#FF4D5E" : r.rsi < 30 ? "#00E68C" : "#8A94A6",
                    }}
                  >
                    {Math.round(r.rsi)}
                  </td>
                  {/* float */}
                  <td className="px-3 text-right text-ink-secondary tabular-nums">
                    {fmtFloat(r.floatM)}
                  </td>
                  {/* signal */}
                  <td className="px-3 text-center">
                    <span
                      className="inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider"
                      style={{
                        color: SIGNAL_COLOR[r.signal],
                        borderColor: `${SIGNAL_COLOR[r.signal]}66`,
                        backgroundColor: `${SIGNAL_COLOR[r.signal]}14`,
                      }}
                    >
                      {r.signal}
                    </span>
                  </td>
                  {/* signs — pattern chips, max 3 + overflow */}
                  <td className="px-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1">
                      {r.signals.slice(0, 3).map((sig) => {
                        const chip = PATTERN_CHIP[sig];
                        if (!chip) return null;
                        return (
                          <span
                            key={sig}
                            className="inline-block rounded border px-1 py-px text-[8px] font-bold tracking-wide"
                            style={
                              chip.filled
                                ? {
                                    color: "#05070B",
                                    backgroundColor: chip.color,
                                    borderColor: chip.color,
                                  }
                                : {
                                    color: chip.color,
                                    borderColor: `${chip.color}66`,
                                    backgroundColor: `${chip.color}14`,
                                  }
                            }
                          >
                            {chip.abbr}
                          </span>
                        );
                      })}
                      {r.signals.length > 3 && (
                        <span className="text-[8px] font-bold text-ink-muted">
                          +{r.signals.length - 3}
                        </span>
                      )}
                      {r.signals.length === 0 && (
                        <span className="text-[9px] text-ink-muted">—</span>
                      )}
                    </span>
                  </td>
                  {/* q-score */}
                  <td className="px-3 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          key={flash?.score?.key ?? 0}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-quant text-[10px] font-bold text-quant tabular-nums",
                            flash?.score?.dir === "up" && "animate-tick-up",
                            flash?.score?.dir === "down" && "animate-tick-down",
                          )}
                        >
                          {Math.round(r.score)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="border border-grid bg-carbon font-mono text-[10px] text-ink-secondary"
                      >
                        {topScoreContributors(r.scoreParts)}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* spark */}
                  <td className="px-3">
                    <div className="flex justify-end">
                      <Sparkline points={histories.get(r.symbol) ?? []} up={up} />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
