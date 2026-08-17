import type { Quote, ScoreParts } from "@contracts/market";

/** Direction of a data tick, used for the 300ms cell flash. */
export type TickDir = "up" | "down";

export interface CellFlash {
  dir: TickDir;
  key: number;
}

export type FlashMap = Record<string, { price?: CellFlash; score?: CellFlash }>;

/** Trade signal derived deterministically from live quote state. */
export type Signal = "BREAKOUT" | "WATCH" | "FADE" | "HALT";

export const SIGNALS: Signal[] = ["BREAKOUT", "WATCH", "FADE", "HALT"];

export const SIGNAL_COLOR: Record<Signal, string> = {
  BREAKOUT: "#00E68C",
  WATCH: "#FFB224",
  FADE: "#FF4D5E",
  HALT: "#8A94A6",
};

export function signalFor(q: Quote): Signal {
  const abs = Math.abs(q.changePct);
  if (q.rvol >= 8 && abs >= 10) return "HALT";
  if (q.changePct <= -2.5) return "FADE";
  if (q.rvol >= 2 && q.changePct >= 1.5 && q.rangePosition >= 0.6) return "BREAKOUT";
  return "WATCH";
}

/* ---------- pattern signal chips (backend PATTERN_SIGNALS ids) ---------- */

export interface PatternChipStyle {
  /** abbreviated mono label, <= 8 chars */
  abbr: string;
  color: string;
  /** filled chip (solid bg, dark text) instead of outline */
  filled?: boolean;
}

export const PATTERN_CHIP: Record<string, PatternChipStyle> = {
  breakout: { abbr: "BREAKOUT", color: "#00E68C", filled: true },
  "near-bottom": { abbr: "NEAR-BOT", color: "#4DD8FF" },
  "channel-up": { abbr: "CH-UP", color: "#00E68C" },
  "channel-down": { abbr: "CH-DN", color: "#FF4D5E" },
  overbought: { abbr: "OB", color: "#FF4D5E" },
  oversold: { abbr: "OS", color: "#00E68C" },
  "unusual-options": { abbr: "OPTS", color: "#FFB224" },
  "earnings-soon": { abbr: "EARN", color: "#8B7CFF" },
};

/* ---------- score breakdown ---------- */

export const SCORE_PART_COLOR: Record<keyof ScoreParts, string> = {
  momentum: "#00E68C",
  volume: "#4DD8FF",
  technical: "#8B7CFF",
  pattern: "#FFB224",
  options: "#D97B4A",
  events: "#FF4D5E",
  gap: "#8A94A6",
};

/** e.g. "momentum +25 · volume +20" — top contributors to the composite score. */
export function topScoreContributors(parts: ScoreParts, n = 2): string {
  const entries = (Object.entries(parts) as [keyof ScoreParts, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
  if (entries.length === 0) return "no dominant factors";
  return entries.map(([k, v]) => `${k} +${Math.round(v)}`).join(" · ");
}

/** FNV-1a hash so per-symbol pseudo fundamentals stay stable across polls. */
export function hashSymbol(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export interface SymbolStatics {
  /** float in millions of shares */
  floatM: number;
  shortPct: number;
  hasNews: boolean;
  hasEarnings: boolean;
}

export function staticsFor(symbol: string): SymbolStatics {
  const h = hashSymbol(symbol);
  const floatM = 4 + (h % 880);
  const shortPct = Math.round((((h >> 3) % 340) / 10 + ((h >> 7) % 10) / 10) * 10) / 10;
  return {
    floatM,
    shortPct,
    hasNews: (h & 0x20) !== 0,
    hasEarnings: (h & 0x80) !== 0,
  };
}

/** Float bucket: 0 = <10M, 1 = 10–50M, 2 = 50–200M, 3 = Any */
export const FLOAT_BUCKETS = ["<10M", "10–50M", "50–200M", "Any"] as const;

export function floatBucketOf(floatM: number): number {
  if (floatM < 10) return 0;
  if (floatM < 50) return 1;
  if (floatM < 200) return 2;
  return 3;
}

/** Client-side filter state that the backend contract does not model. */
export interface ClientFilters {
  floatBucket: number; // 3 = any
  signals: Signal[];
  needNews: boolean;
  needEarnings: boolean;
  needHighShort: boolean;
}

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  floatBucket: 3,
  signals: [...SIGNALS],
  needNews: false,
  needEarnings: false,
  needHighShort: false,
};

/** A scan row enriched with derived display data. */
export interface RowExt extends Quote, SymbolStatics {
  signal: Signal;
}

export function enrich(q: Quote): RowExt {
  return { ...q, ...staticsFor(q.symbol), signal: signalFor(q) };
}

export function applyClientFilters(rows: RowExt[], cf: ClientFilters): RowExt[] {
  return rows.filter((r) => {
    if (cf.floatBucket !== 3 && floatBucketOf(r.floatM) !== cf.floatBucket) return false;
    if (!cf.signals.includes(r.signal)) return false;
    if (cf.needNews && !r.hasNews) return false;
    if (cf.needEarnings && !r.hasEarnings) return false;
    if (cf.needHighShort && r.shortPct < 20) return false;
    return true;
  });
}

export const SORT_LABEL: Record<string, string> = {
  symbol: "Symbol",
  price: "Price",
  changePct: "Chg%",
  rvol: "RelVol",
  rsi: "RSI",
  float: "Float",
  signal: "Signal",
  score: "Quant Score",
};

/* ---------- alerts ---------- */

export type AlertSeverity = "opportunity" | "watch" | "risk";

export interface ScanAlert {
  id: number;
  symbol: string;
  kind: "enter" | "score" | "rvol" | "high";
  severity: AlertSeverity;
  text: string;
  score: number;
  scoreParts: ScoreParts;
  signal: Signal;
  ts: number;
}

export const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  opportunity: "#00E68C",
  watch: "#FFB224",
  risk: "#FF4D5E",
};

/* ---------- formatting (all mono, tabular) ---------- */

export function fmtPrice(n: number): string {
  return n >= 1 ? n.toFixed(2) : n.toFixed(4);
}

export function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function fmtCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export function fmtFloat(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)}B` : `${Math.round(m)}M`;
}

export function fmtClock(ts: number): string {
  const d = new Date(ts);
  const p = (v: number) => String(v).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ---------- alert tick sound ---------- */

let audioCtx: AudioContext | null = null;

export function tickSound(enabled: boolean): void {
  if (!enabled) return;
  try {
    audioCtx ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 1320;
    gain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    /* audio unavailable */
  }
}
