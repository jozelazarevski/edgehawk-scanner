import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  SEVERITY_COLOR,
  SIGNAL_COLOR,
  fmtClock,
  topScoreContributors,
  type ScanAlert,
} from "./derive";

export interface AlertConfig {
  notify: boolean;
  minScore: number;
}

interface Props {
  alerts: ScanAlert[];
  onSelect: (symbol: string) => void;
  config: AlertConfig;
  onConfig: (c: AlertConfig) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function AlertsRail({
  alerts,
  onSelect,
  config,
  onConfig,
  soundOn,
  onToggleSound,
}: Props) {
  const [cfgOpen, setCfgOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // re-render periodically so cards older than 60s dim
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const requestNotify = (on: boolean) => {
    if (on && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    onConfig({ ...config, notify: on });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grid px-4 py-3">
        <span className="label-eyebrow flex items-center gap-2 text-ink-primary">
          ALERTS <span className="live-dot" />
        </span>
        <span
          key={alerts.length}
          className="animate-tick-up rounded px-1.5 py-0.5 font-mono text-xs font-bold text-amber-watch tabular-nums"
        >
          {alerts.length}
        </span>
      </div>

      {/* Cards */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {alerts.map((a) => {
            const stale = now - a.ts > 60000;
            return (
              <motion.button
                key={a.id}
                layout="position"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                onClick={() => onSelect(a.symbol)}
                className={cn(
                  "block w-full rounded-lg bg-steel p-3 text-left transition-opacity duration-500",
                  stale && "opacity-60",
                )}
                style={{ borderLeft: `3px solid ${SEVERITY_COLOR[a.severity]}` }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-abyss px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink-primary">
                      {a.symbol}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-px font-mono text-[8px] font-bold tracking-wider"
                      style={{
                        color: SIGNAL_COLOR[a.signal],
                        backgroundColor: `${SIGNAL_COLOR[a.signal]}1f`,
                      }}
                    >
                      {a.signal}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-ink-muted tabular-nums">
                    {fmtClock(a.ts)}
                  </span>
                </div>
                <p className="mb-1.5 text-xs leading-snug text-ink-secondary">{a.text}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                    {a.kind === "enter"
                      ? "new match"
                      : a.kind === "score"
                        ? "score jump"
                        : a.kind === "rvol"
                          ? "rvol spike"
                          : "day high"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-quant font-mono text-[9px] font-bold text-quant tabular-nums">
                        {Math.round(a.score)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="border border-grid bg-carbon font-mono text-[10px] text-ink-secondary"
                    >
                      {topScoreContributors(a.scoreParts)}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {alerts.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <span className="live-dot" />
            <p className="font-mono text-[11px] text-ink-muted">
              MONITORING FEED — ALERTS WILL STREAM HERE
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-grid px-4 py-3">
        <button
          onClick={() => setCfgOpen(true)}
          className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:text-pulse"
        >
          <Settings2 className="h-3.5 w-3.5" /> Configure alerts →
        </button>
      </div>

      {/* Configure dialog */}
      <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
        <DialogContent className="border-grid bg-carbon sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-primary">Alert settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <label className="flex items-center justify-between text-sm text-ink-secondary">
              <span>
                Desktop notifications
                {"Notification" in window && Notification.permission === "denied" && (
                  <span className="block font-mono text-[10px] text-signal">
                    blocked by browser
                  </span>
                )}
              </span>
              <Switch checked={config.notify} onCheckedChange={requestNotify} />
            </label>
            <label className="flex items-center justify-between text-sm text-ink-secondary">
              Alert sounds
              <Switch checked={soundOn} onCheckedChange={onToggleSound} />
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-ink-secondary">
                Min quant score
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-quant font-mono text-[10px] font-bold text-quant tabular-nums">
                  {config.minScore}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[config.minScore]}
                onValueChange={([v]) => onConfig({ ...config, minScore: v ?? 0 })}
                className="[&_[data-slot=slider-range]]:bg-quant [&_[data-slot=slider-thumb]]:border-quant"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
