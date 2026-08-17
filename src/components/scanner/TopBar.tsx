import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { MarketStatus } from "@contracts/market";
import { cn } from "@/lib/utils";

export type SessionTab = "pre" | "regular" | "post";

const TABS: { id: SessionTab; label: string }[] = [
  { id: "pre", label: "PRE-MARKET" },
  { id: "regular", label: "RTH" },
  { id: "post", label: "AFTER-HOURS" },
];

interface Props {
  session: SessionTab;
  onSession: (s: SessionTab) => void;
  status: MarketStatus | undefined;
  total: number;
  source: "live" | "simulated" | undefined;
  paused: boolean;
  onTogglePause: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

/** Ticks a pseudo latency value in the 8–24ms band. */
function useLatency(paused: boolean) {
  const [ms, setMs] = useState(14);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setMs(8 + Math.round(Math.random() * 16)), 2000);
    return () => clearInterval(id);
  }, [paused]);
  return ms;
}

function useTicksPerSec(paused: boolean) {
  const [ticks, setTicks] = useState(3.2);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTicks(2.4 + Math.random() * 1.6), 1500);
    return () => clearInterval(id);
  }, [paused]);
  return ticks;
}

export default function TopBar({
  session,
  onSession,
  status,
  total,
  source,
  paused,
  onTogglePause,
  soundOn,
  onToggleSound,
}: Props) {
  const latency = useLatency(paused);
  const ticks = useTicksPerSec(paused);
  const barRef = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);

  const liveSession = status?.session;
  const toggleFullscreen = () => {
    const root = barRef.current?.closest("[data-workspace]") ?? document.documentElement;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFs(false);
    } else {
      void (root as HTMLElement).requestFullscreen?.().catch(() => {});
      setFs(true);
    }
  };

  return (
    <motion.div
      ref={barRef}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 flex h-12 shrink-0 cursor-crosshair items-center justify-between gap-3 border-b border-grid bg-carbon px-3 lg:px-4"
    >
      {/* Session tabs */}
      <div className="flex items-center gap-1">
        {TABS.map((t) => {
          const active = session === t.id;
          const isLive = liveSession === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSession(t.id)}
              className={cn(
                "relative rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors duration-200",
                active ? "text-ink-primary" : "text-ink-muted hover:text-ink-secondary",
              )}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {t.label}
                {isLive && (
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      paused ? "bg-amber-watch" : "bg-pulse",
                    )}
                  />
                )}
              </span>
              {active && (
                <motion.span
                  layoutId="session-underline"
                  className="absolute inset-x-1 bottom-0 h-[2px] bg-pulse"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Universe readout */}
      <div className="hidden items-center gap-2 font-mono text-xs text-ink-secondary md:flex">
        <span className="text-ink-muted">SCANNING</span>
        <span key={total} className="animate-tick-up rounded px-1 text-ink-primary">
          {total.toLocaleString()}
        </span>
        <span className="text-ink-muted">SYMBOLS ·</span>
        <span key={ticks.toFixed(1)} className="text-ice">
          {paused ? "0.0" : ticks.toFixed(1)}M
        </span>
        <span className="text-ink-muted">ticks/s</span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Source badge */}
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tracking-wider sm:flex",
            source === "live"
              ? "border-pulse/40 bg-pulse/10 text-pulse"
              : "border-amber-watch/40 bg-amber-watch/10 text-amber-watch",
          )}
        >
          {source === "live" ? (
            <span className="live-dot" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-watch" />
          )}
          {source === "live" ? "LIVE DATA" : "DEMO FEED"}
        </span>

        {/* Latency */}
        <span className="hidden rounded-full border border-grid bg-steel px-2.5 py-1 font-mono text-[11px] text-pulse tabular-nums sm:block">
          {paused ? "--" : latency}ms
        </span>

        {/* Sound */}
        <button
          onClick={onToggleSound}
          aria-label="Toggle sound"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-grid text-ink-secondary transition-colors hover:border-pulse/50 hover:text-ink-primary"
        >
          {soundOn ? <Volume2 className="h-4 w-4 text-pulse" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="hidden h-8 w-8 items-center justify-center rounded-lg border border-grid text-ink-secondary transition-colors hover:border-pulse/50 hover:text-ink-primary sm:flex"
        >
          {fs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>

        {/* Pause feed */}
        <button
          onClick={onTogglePause}
          className={cn(
            "btn-shine flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
            paused
              ? "border-amber-watch/60 bg-amber-watch/10 text-amber-watch"
              : "border-grid bg-steel text-ink-primary hover:border-pulse/50",
          )}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? "RESUME" : "PAUSE FEED"}
        </button>
      </div>
    </motion.div>
  );
}
