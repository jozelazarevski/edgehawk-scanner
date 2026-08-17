import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Sparkline from "./Sparkline";
import { fmtPct, fmtPrice, type RowExt } from "./derive";

interface Props {
  rows: RowExt[];
  histories: Map<string, number[]>;
  onSelect: (symbol: string) => void;
}

function tileColor(changePct: number): string {
  const a = Math.min(0.1 + Math.abs(changePct) / 22, 0.6);
  return changePct >= 0 ? `rgba(0,230,140,${a})` : `rgba(255,77,94,${a})`;
}

/** Grid of tiles sized by dollar volume, colored by % change. */
export default function Heatmap({ rows, histories, onSelect }: Props) {
  const tiles = useMemo(() => {
    const top = [...rows].sort((a, b) => b.dollarVolume - a.dollarVolume).slice(0, 120);
    if (top.length === 0) return [];
    const sorted = top.map((r) => r.dollarVolume).sort((a, b) => a - b);
    const q60 = sorted[Math.floor(sorted.length * 0.6)] ?? 0;
    const q88 = sorted[Math.floor(sorted.length * 0.88)] ?? 0;
    return top.map((r) => ({
      row: r,
      span:
        r.dollarVolume >= q88
          ? "col-span-2 row-span-2"
          : r.dollarVolume >= q60
            ? "col-span-2 row-span-1"
            : "col-span-1 row-span-1",
    }));
  }, [rows]);

  if (tiles.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center font-mono text-xs text-ink-muted">
        NO SYMBOLS MATCH — LOOSEN THE FILTERS
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 cursor-crosshair overflow-y-auto p-2">
      <div className="grid auto-rows-[52px] grid-flow-dense grid-cols-4 gap-1 sm:grid-cols-6 xl:grid-cols-8">
        {tiles.map(({ row: r, span }) => {
          const big = span.includes("row-span-2");
          return (
            <button
              key={r.symbol}
              onClick={() => onSelect(r.symbol)}
              style={{ backgroundColor: tileColor(r.changePct), transition: "background-color 300ms" }}
              className={cn(
                "group relative flex flex-col items-start justify-between overflow-hidden rounded-md border border-grid/60 p-1.5 text-left hover:z-20 hover:border-ink-primary/40",
                span,
              )}
            >
              <span className="font-mono text-[11px] font-bold text-ink-primary">{r.symbol}</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  big ? "text-xs" : "text-[10px]",
                  r.changePct >= 0 ? "text-pulse" : "text-signal",
                )}
              >
                {fmtPct(r.changePct)}
              </span>

              {/* hover tooltip card */}
              <span className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-44 -translate-x-1/2 translate-y-1 rounded-lg border border-grid bg-carbon p-3 shadow-xl group-hover:block">
                <span className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-ink-primary">{r.symbol}</span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      r.changePct >= 0 ? "text-pulse" : "text-signal",
                    )}
                  >
                    {fmtPct(r.changePct)}
                  </span>
                </span>
                <span className="mb-2 block font-mono text-sm text-ink-primary tabular-nums">
                  ${fmtPrice(r.price)}
                </span>
                <Sparkline points={histories.get(r.symbol) ?? []} up={r.changePct >= 0} width={150} height={28} />
                <span className="mt-1 block font-mono text-[9px] text-ink-muted">
                  {r.name} · RVOL {r.rvol.toFixed(1)}× · Q {Math.round(r.score)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
