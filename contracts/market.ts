/**
 * Shared market-data contracts (frontend ↔ backend).
 * Every payload carries `source` so the UI can badge LIVE vs DEMO honestly.
 */

export type DataSource = "live" | "simulated";

export interface Quote {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  /** % change vs previous close */
  changePct: number;
  /** % gap: today's open vs previous close */
  gapPct: number;
  /** relative volume: volume / expected-volume-by-now */
  rvol: number;
  /** 0..1 — where price sits inside today's range */
  rangePosition: number;
  /** price * volume */
  dollarVolume: number;
  /** 0..100 composite edge score */
  score: number;
  /** contribution of each factor to the score (sums to score) */
  scoreParts: ScoreParts;
  // ── Technical indicators (from the internal bar model) ──
  /** RSI(14), 0..100 */
  rsi: number;
  /** MACD(12,26,9) histogram, as % of price */
  macdHist: number;
  sma20: number;
  sma50: number;
  /** Bollinger %B (20,2): 0 = lower band, 1 = upper band */
  bollingerB: number;
  /** ATR(14) as % of price — daily volatility */
  atrPct: number;
  /** pattern/signal flags, ids from PATTERN_SIGNALS */
  signals: string[];
  // ── Event & options factors ──
  /** options volume vs average (1 = normal, >2 = unusual) */
  optionsRatio: number;
  /** days until next earnings (-1 = not scheduled within window) */
  daysToEarnings: number;
  /** days until next FOMC decision */
  daysToFed: number;
  ts: number;
}

export interface ScoreParts {
  momentum: number;
  volume: number;
  technical: number;
  pattern: number;
  options: number;
  events: number;
  gap: number;
}

export interface PatternSignal {
  id: string;
  label: string;
  hint: string;
}

export const PATTERN_SIGNALS: PatternSignal[] = [
  { id: "breakout", label: "Breakout", hint: "Price clearing the 20-bar high on elevated volume" },
  { id: "near-bottom", label: "Near Bottom", hint: "Trading in the lowest 15% of its 60-bar range" },
  { id: "channel-up", label: "Channel Up", hint: "Tight rising regression channel (R² > 0.7)" },
  { id: "channel-down", label: "Channel Down", hint: "Tight falling regression channel (R² > 0.7)" },
  { id: "overbought", label: "Overbought", hint: "RSI above 75 — extended" },
  { id: "oversold", label: "Oversold", hint: "RSI below 25 — washed out" },
  { id: "unusual-options", label: "Unusual Options", hint: "Options volume running >2.5x average" },
  { id: "earnings-soon", label: "Earnings ≤5d", hint: "Reports within 5 days — expect volatility" },
];

export type ScanDirection = "up" | "down" | "both";

export interface ScanFilters {
  presetId?: string;
  direction: ScanDirection;
  minPrice: number;
  maxPrice: number;
  minChangePct: number; // signed vs direction
  minGapPct: number; // absolute
  minRvol: number;
  minVolume: number; // shares
  minScore: number;
  sectors: string[]; // empty = all
  search: string;
  /** pattern signals to require (ANY match); empty = no pattern filter */
  patterns: string[];
  /** minimum options-volume ratio (0 = off) */
  minOptionsRatio: number;
  /** only names reporting within N days (0 = off) */
  earningsWithinDays: number;
}

export type ScanSortKey =
  | "score"
  | "changePct"
  | "gapPct"
  | "rvol"
  | "volume"
  | "dollarVolume";

export interface ScanResult {
  rows: Quote[];
  total: number; // universe size scanned
  matched: number; // rows before limit
  source: DataSource;
  ts: number;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleResult {
  symbol: string;
  range: string;
  candles: Candle[];
  source: DataSource;
}

export interface MarketStatus {
  open: boolean;
  session: "pre" | "regular" | "post" | "closed";
  serverTime: number;
  source: DataSource;
}

export interface ScanPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  winRate: number;
  avgMove: number;
  filters: ScanFilters;
  sort: ScanSortKey;
}

export const DEFAULT_FILTERS: ScanFilters = {
  direction: "both",
  minPrice: 2,
  maxPrice: 1000,
  minChangePct: 0,
  minGapPct: 0,
  minRvol: 0,
  minVolume: 0,
  minScore: 0,
  sectors: [],
  search: "",
  patterns: [],
  minOptionsRatio: 0,
  earningsWithinDays: 0,
};

export const SECTORS = [
  "Technology",
  "Semiconductors",
  "Healthcare",
  "Financials",
  "Energy",
  "Consumer",
  "Industrials",
  "Communication",
  "EV & Clean Energy",
  "Biotech",
] as const;

export const SCAN_PRESETS: ScanPreset[] = [
  {
    id: "momentum-breakout",
    name: "Momentum Breakout",
    tagline: "Stocks ripping on abnormal volume",
    description:
      "Catches names trading in the top third of their daily range with relative volume above 2x — institutional footprints before the crowd notices.",
    winRate: 61,
    avgMove: 4.8,
    filters: { ...DEFAULT_FILTERS, direction: "up", minChangePct: 2, minRvol: 2, minVolume: 500000, minScore: 45 },
    sort: "score",
  },
  {
    id: "gap-hunter",
    name: "Gap Hunter",
    tagline: "Overnight gaps with follow-through",
    description:
      "Isolates stocks gapping 3%+ at the open that are holding the gap — continuation, not fade. The edge is in the first 90 minutes.",
    winRate: 57,
    avgMove: 5.6,
    filters: { ...DEFAULT_FILTERS, direction: "up", minGapPct: 3, minRvol: 1.5, minVolume: 250000 },
    sort: "gapPct",
  },
  {
    id: "capitulation-reversal",
    name: "Capitulation Reversal",
    tagline: "Flush-outs bouncing off lows",
    description:
      "Finds names down hard on heavy volume that have reclaimed 25%+ off their intraday low — seller exhaustion turning into squeeze fuel.",
    winRate: 55,
    avgMove: 6.2,
    filters: { ...DEFAULT_FILTERS, direction: "down", minChangePct: 3, minRvol: 1.8, minVolume: 500000 },
    sort: "rvol",
  },
  {
    id: "unusual-volume",
    name: "Unusual Volume",
    tagline: "Volume anomalies before the news",
    description:
      "Pure RVOL screen — 3x normal volume or better, any direction. Volume precedes price; this is where tomorrow's headlines hide.",
    winRate: 52,
    avgMove: 3.9,
    filters: { ...DEFAULT_FILTERS, minRvol: 3, minVolume: 1000000 },
    sort: "rvol",
  },
  {
    id: "high-tight-flag",
    name: "Range Compression",
    tagline: "Coiled springs near day highs",
    description:
      "Stocks pinned in the top 20% of their range on rising volume — compression near highs resolves violently. Trade the break.",
    winRate: 58,
    avgMove: 3.4,
    filters: { ...DEFAULT_FILTERS, direction: "up", minChangePct: 1, minRvol: 1.5, minScore: 55 },
    sort: "score",
  },
  {
    id: "flush-scalp",
    name: "Flush Scalp",
    tagline: "Panic dumps for quick fades",
    description:
      "Names down 4%+ intraday with RVOL above 2 — oversold flushes that mean-revert intraday. Tight stops, fast hands.",
    winRate: 54,
    avgMove: 2.7,
    filters: { ...DEFAULT_FILTERS, direction: "down", minChangePct: 4, minRvol: 2, minVolume: 750000 },
    sort: "changePct",
  },
  {
    id: "quiet-accumulation",
    name: "Quiet Accumulation",
    tagline: "Low-noise names building a base",
    description:
      "Modest gainers on steadily rising volume with high edge scores but no fireworks — the footprints of patient money.",
    winRate: 60,
    avgMove: 2.9,
    filters: { ...DEFAULT_FILTERS, direction: "up", minChangePct: 0.5, minRvol: 1.3, minScore: 40 },
    sort: "score",
  },
  {
    id: "gap-fade",
    name: "Gap Fade",
    tagline: "Failed gaps filling the void",
    description:
      "Stocks that gapped up 3%+ but are now red on the day — trapped longs fuel the fade back into the gap.",
    winRate: 53,
    avgMove: 3.1,
    filters: { ...DEFAULT_FILTERS, direction: "down", minGapPct: 0, minRvol: 1.5 },
    sort: "gapPct",
  },
  {
    id: "sector-surge",
    name: "Sector Surge",
    tagline: "Whole-sector momentum waves",
    description:
      "Filters for strong movers in Technology, Semiconductors and Clean Energy — when a sector moves, laggards follow leaders.",
    winRate: 56,
    avgMove: 4.1,
    filters: {
      ...DEFAULT_FILTERS,
      direction: "up",
      minChangePct: 1.5,
      minRvol: 1.5,
      sectors: ["Technology", "Semiconductors", "EV & Clean Energy"],
    },
    sort: "changePct",
  },
];

export interface WatchlistItem {
  id: number;
  symbol: string;
  createdAt: Date;
}
