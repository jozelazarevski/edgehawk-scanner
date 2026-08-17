/**
 * Market engine — quote ingestion (Yahoo with simulated fallback),
 * technical indicators, pattern detection, and the scanner ("edge finder").
 *
 * The scanner logic is provider-agnostic: live quotes and simulated ticks
 * flow through the exact same scoring/filtering pipeline. The module is
 * browser-safe (no Node APIs) so the static build can import it directly.
 */
import type {
  Candle,
  DataSource,
  MarketStatus,
  Quote,
  ScanFilters,
  ScanSortKey,
} from "../../contracts/market";
import { UNIVERSE, UNIVERSE_MAP, type UniverseEntry } from "./universe";

// ── Market hours (US Eastern, NYSE regular session 09:30–16:00) ────────────

export function getMarketStatus(source: DataSource): MarketStatus {
  const now = new Date();
  // Compute ET wall-clock via Intl (no tz dependency).
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => et.find((p) => p.type === t)?.value ?? "";
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  const weekday = get("weekday");
  const mins = hour * 60 + minute;
  const isWeekday = !["Sat", "Sun"].includes(weekday);

  let session: MarketStatus["session"] = "closed";
  if (isWeekday) {
    if (mins >= 240 && mins < 570) session = "pre"; // 04:00–09:30
    else if (mins >= 570 && mins < 960) session = "regular"; // 09:30–16:00
    else if (mins >= 960 && mins < 1200) session = "post"; // 16:00–20:00
  }
  return { open: session === "regular", session, serverTime: now.getTime(), source };
}

/** 0..1 fraction of the regular session elapsed (1 outside session). */
function sessionProgress(): number {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => et.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  if (["Sat", "Sun"].includes(weekday)) return 1;
  const h = parseInt(get("hour"), 10) % 24;
  const m = parseInt(get("minute"), 10);
  const mins = h * 60 + m;
  if (mins < 570) return 0.05; // pre-market: session barely started
  if (mins >= 960) return 1;
  return Math.min(1, Math.max(0.02, (mins - 570) / 390));
}

// ── Seeded PRNG (deterministic per symbol — stable sim across restarts) ────

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Simulation state per symbol ─────────────────────────────────────────────

interface SimState {
  price: number;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  /** persistent intraday drift (per day) — creates winners/losers */
  drift: number;
  /** persistent volume anomaly multiplier — creates RVOL signals */
  volAnomaly: number;
  dayStamp: string;
  candlePath: Candle[]; // synthetic 5m candles for the day
  /** 60 daily closes (oldest → newest, last = prevClose) — indicator input */
  closes: number[];
  /** 60 daily highs/lows aligned with closes — ATR input */
  highs: number[];
  lows: number[];
  /** options volume vs average, seeded per day (1 = normal) */
  optionsRatio: number;
  /** days until next earnings report, seeded per month */
  daysToEarnings: number;
}

const simStates = new Map<string, SimState>();

function dayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 2026 FOMC decision dates (2nd day of each meeting). */
const FOMC_DATES = [
  "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17",
  "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
];

function daysToNextFed(): number {
  const today = dayStamp();
  for (const d of FOMC_DATES) {
    if (d >= today) {
      return Math.round((new Date(d + "T18:00:00Z").getTime() - Date.now()) / 86_400_000);
    }
  }
  return 45; // past last known date — treat as distant
}

/** Generate 60 days of seeded daily OHLC ending at prevClose. */
function generateHistory(u: UniverseEntry, rnd: () => number, prevClose: number) {
  const bars = 60;
  const dailyVol = u.vol / 100;
  const closes: number[] = new Array(bars);
  const highs: number[] = new Array(bars);
  const lows: number[] = new Array(bars);
  // Walk backwards from prevClose so history terminates exactly at prevClose
  let price = prevClose;
  const trend = (rnd() - 0.5) * dailyVol * 0.6; // persistent daily trend
  for (let i = bars - 1; i >= 0; i--) {
    closes[i] = price;
    const spread = price * dailyVol * (0.4 + rnd() * 0.8);
    highs[i] = price + spread / 2;
    lows[i] = price - spread / 2;
    // step backwards (reverse the random walk)
    price = price / (1 + trend + (rnd() - 0.5) * 2 * dailyVol);
  }
  return { closes, highs, lows };
}

function initSim(u: UniverseEntry): SimState {
  const rnd = mulberry32(hashSeed(u.symbol + dayStamp()));
  const gapPct = (rnd() - 0.45) * 6; // -2.7% .. +3.3% opening gap
  const prevClose = u.basePrice * (1 + (rnd() - 0.5) * 0.02);
  const open = prevClose * (1 + gapPct / 100);
  // A few names get big drifts/anomalies so the scanner always finds edges
  const anomalyRoll = rnd();
  const volAnomaly = anomalyRoll > 0.9 ? 2.5 + rnd() * 3 : anomalyRoll > 0.75 ? 1.5 + rnd() : 0.7 + rnd() * 0.6;
  const drift = (rnd() - 0.48) * u.vol * 2 * (anomalyRoll > 0.85 ? 2.2 : 1); // % over the day
  const { closes, highs, lows } = generateHistory(u, rnd, prevClose);
  // Options activity: mostly normal, sometimes 2.5–6x (unusual). Correlates
  // mildly with the volume anomaly so signals cluster realistically.
  const optionsRoll = rnd();
  const optionsRatio = round2(
    optionsRoll > 0.88 ? 2.5 + rnd() * 3.5 : 0.6 + rnd() * 0.8 + (volAnomaly - 1) * 0.3,
  );
  // Earnings: seeded per symbol+month; ~40% of names report within 30d
  const qRnd = mulberry32(hashSeed(u.symbol + dayStamp().slice(0, 7)));
  const earningsRoll = qRnd();
  const daysToEarnings = earningsRoll > 0.6 ? Math.floor(qRnd() * 30) : -1;
  const state: SimState = {
    price: open,
    open,
    prevClose,
    dayHigh: open,
    dayLow: open,
    volume: Math.floor(u.avgVolume * 0.02 * rnd()),
    drift,
    volAnomaly,
    dayStamp: dayStamp(),
    candlePath: [],
    closes,
    highs,
    lows,
    optionsRatio: Math.max(0.3, optionsRatio),
    daysToEarnings,
  };
  simStates.set(u.symbol, state);
  return state;
}

function getSim(u: UniverseEntry): SimState {
  const s = simStates.get(u.symbol);
  if (!s || s.dayStamp !== dayStamp()) return initSim(u);
  return s;
}

let warmedUp = false;

/**
 * Fast-forward the tape to "now" on first request. Without this, a freshly
 * started server would show a flat, signal-free tape until enough polls accrue.
 */
function warmUpSimulation(): void {
  if (warmedUp) return;
  warmedUp = true;
  const steps = Math.max(30, Math.floor(390 * sessionProgress()));
  for (let i = 0; i < steps; i++) tickSimulation();
}

/** Advance the simulated tape by one tick for every symbol. */
function tickSimulation(): void {
  const progress = sessionProgress();
  for (const u of UNIVERSE) {
    const s = getSim(u);
    const rnd = Math.random;
    // Random-walk step: per-tick vol scaled by symbol vol, plus drift pull
    const steps = 390; // 5m bars per day-ish granularity feel
    const shock = (rnd() + rnd() + rnd() - 1.5) * (u.vol / 100) * Math.sqrt(1 / steps) * 3.5;
    const driftPull = ((s.open * (1 + s.drift / 100)) - s.price) / s.price / (steps * (1.2 - Math.min(1, progress)));
    // Occasional momentum bursts (the "edges")
    const burst = rnd() > 0.985 ? (rnd() - 0.5) * 0.02 : 0;
    s.price = Math.max(0.5, s.price * (1 + shock + driftPull + burst));
    s.dayHigh = Math.max(s.dayHigh, s.price);
    s.dayLow = Math.min(s.dayLow, s.price);
    // Volume accumulates toward avgVolume * volAnomaly along a U-curve
    const target = u.avgVolume * s.volAnomaly;
    const uCurve = 1.6 - 2.4 * progress + 1.8 * progress * progress; // high at open/close
    const increment = (target / 390) * Math.max(0.15, uCurve) * (0.5 + rnd());
    s.volume += Math.floor(increment);
  }
}

// ── Technical indicators ────────────────────────────────────────────────────

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (const v of values) {
    prev = v * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function rsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function macdHist(closes: number[]): number {
  if (closes.length < 35) return 0;
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signal = emaSeries(macdLine.slice(-26), 9);
  return macdLine[macdLine.length - 1] - signal[signal.length - 1];
}

function bollingerPctB(closes: number[], period = 20): number {
  if (closes.length < period) return 0.5;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0.5;
  const last = closes[closes.length - 1];
  return (last - (mean - 2 * sd)) / (4 * sd);
}

function atr14Pct(highs: number[], lows: number[], closes: number[]): number {
  if (closes.length < 15) return 0;
  let sum = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    sum += tr;
  }
  const last = closes[closes.length - 1];
  return last > 0 ? (sum / 14 / last) * 100 : 0;
}

/** Least-squares regression over the last `n` closes: slope (%/bar) and R². */
function regression(closes: number[], n: number): { slopePct: number; r2: number } {
  if (closes.length < n) return { slopePct: 0, r2: 0 };
  const ys = closes.slice(-n);
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - xMean) * (ys[i] - yMean);
    sxx += (i - xMean) ** 2;
    sst += (ys[i] - yMean) ** 2;
  }
  const slope = sxx > 0 ? sxy / sxx : 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const fit = yMean + slope * (i - xMean);
    sse += (ys[i] - fit) ** 2;
  }
  const r2 = sst > 0 ? Math.max(0, 1 - sse / sst) : 0;
  const last = ys[ys.length - 1];
  return { slopePct: last > 0 ? (slope / last) * 100 : 0, r2 };
}

// ── Derived metrics + edge score ────────────────────────────────────────────

interface RawQuote {
  price: number;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function buildQuote(u: UniverseEntry, raw: RawQuote, sim: SimState): Quote {
  const changePct = ((raw.price - raw.prevClose) / raw.prevClose) * 100;
  const gapPct = ((raw.open - raw.prevClose) / raw.prevClose) * 100;
  const progress = sessionProgress();
  const expectedVolume = u.avgVolume * progress;
  const rvol = expectedVolume > 0 ? raw.volume / expectedVolume : 1;
  const range = raw.dayHigh - raw.dayLow;
  const rangePosition = range > 0 ? (raw.price - raw.dayLow) / range : 0.5;

  // ── Technical indicators from the bar model (today's price appended) ──
  const closes = [...sim.closes, raw.price];
  const highs = [...sim.highs, raw.dayHigh];
  const lows = [...sim.lows, raw.dayLow];
  const rsi = rsi14(closes);
  const hist = macdHist(closes);
  const macdHistPct = (hist / raw.price) * 100;
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const pctB = bollingerPctB(closes);
  const atrPct = atr14Pct(highs, lows, closes);
  const reg = regression(closes, 20);

  // ── Pattern / signal flags ──
  const signals: string[] = [];
  const low60 = Math.min(...lows);
  const high60 = Math.max(...highs);
  const posIn60 = high60 > low60 ? (raw.price - low60) / (high60 - low60) : 0.5;
  const prior20High = Math.max(...highs.slice(-21, -1));
  if (raw.price > prior20High && rvol > 1.5) signals.push("breakout");
  if (posIn60 < 0.15) signals.push("near-bottom");
  if (reg.r2 > 0.7 && reg.slopePct > 0.15) signals.push("channel-up");
  if (reg.r2 > 0.7 && reg.slopePct < -0.15) signals.push("channel-down");
  if (rsi > 75) signals.push("overbought");
  if (rsi < 25) signals.push("oversold");
  if (sim.optionsRatio > 2.5) signals.push("unusual-options");
  if (sim.daysToEarnings >= 0 && sim.daysToEarnings <= 5) signals.push("earnings-soon");

  // ── Edge score: momentum, volume, technicals, pattern, options, events ──
  const bullish = changePct >= 0;
  const pMomentum = clamp(Math.abs(changePct) / 6, 0, 1) * 25;
  const pVolume = clamp((rvol - 1) / 3, 0, 1) * 20;
  // Technical alignment: MACD agrees with direction, RSI in a tradeable zone
  // (bullish sweet spot 45–70, bearish mirror), price vs SMA20 confirmation.
  const macdAgree = bullish ? hist > 0 : hist < 0;
  const rsiZone = bullish
    ? rsi >= 45 && rsi <= 70
      ? 1
      : rsi > 80
        ? 0.2
        : 0.55
    : rsi <= 55 && rsi >= 30
      ? 1
      : rsi < 20
        ? 0.2
        : 0.55;
  const smaAgree = bullish ? raw.price > sma20 : raw.price < sma20;
  const pTechnical = ((macdAgree ? 0.45 : 0) + rsiZone * 0.35 + (smaAgree ? 0.2 : 0)) * 15;
  // Pattern bonus: direction-aware
  const dirPatterns = bullish
    ? ["breakout", "channel-up", "oversold"]
    : ["channel-down", "overbought", "near-bottom"];
  const patternHits = signals.filter((s) => dirPatterns.includes(s)).length;
  const pPattern = clamp(patternHits / 2, 0, 1) * 15;
  // Options activity: unusual flow is information
  const pOptions = clamp((sim.optionsRatio - 1) / 3, 0, 1) * 10;
  // Events: earnings ≤5d and Fed-day proximity both raise the edge (volatility = opportunity)
  const daysToFed = daysToNextFed();
  const earningsBoost = sim.daysToEarnings >= 0 && sim.daysToEarnings <= 5 ? 1 : sim.daysToEarnings >= 0 && sim.daysToEarnings <= 10 ? 0.5 : 0;
  const fedBoost = daysToFed <= 1 ? 1 : daysToFed <= 3 ? 0.5 : 0;
  const pEvents = Math.max(earningsBoost, fedBoost) * 10;
  const pGap = clamp(Math.abs(gapPct) / 5, 0, 1) * 5;

  const scoreParts = {
    momentum: Math.round(pMomentum),
    volume: Math.round(pVolume),
    technical: Math.round(pTechnical),
    pattern: Math.round(pPattern),
    options: Math.round(pOptions),
    events: Math.round(pEvents),
    gap: Math.round(pGap),
  };
  const score = Math.round(clamp(pMomentum + pVolume + pTechnical + pPattern + pOptions + pEvents + pGap, 0, 100));

  return {
    symbol: u.symbol,
    name: u.name,
    sector: u.sector,
    price: round2(raw.price),
    open: round2(raw.open),
    prevClose: round2(raw.prevClose),
    dayHigh: round2(raw.dayHigh),
    dayLow: round2(raw.dayLow),
    volume: Math.floor(raw.volume),
    avgVolume: u.avgVolume,
    changePct: round2(changePct),
    gapPct: round2(gapPct),
    rvol: round2(rvol),
    rangePosition: round2(rangePosition),
    dollarVolume: Math.floor(raw.price * raw.volume),
    score,
    scoreParts,
    rsi: round2(rsi),
    macdHist: round2(macdHistPct),
    sma20: round2(sma20),
    sma50: round2(sma50),
    bollingerB: round2(pctB),
    atrPct: round2(atrPct),
    signals,
    optionsRatio: sim.optionsRatio,
    daysToEarnings: sim.daysToEarnings,
    daysToFed,
    ts: Date.now(),
  };
}

// ── Yahoo provider ──────────────────────────────────────────────────────────

const YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

interface YahooQuoteRaw {
  regularMarketPrice?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
}

let liveCache: { ts: number; quotes: Map<string, RawQuote> } | null = null;
let liveFailures = 0;
const LIVE_TTL_MS = 12_000;
const LIVE_CIRCUIT_MS = 5 * 60_000; // stop hammering Yahoo for 5 min after failures

async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, RawQuote> | null> {
  if (liveCache && Date.now() - liveCache.ts < LIVE_TTL_MS) return liveCache.quotes;
  if (liveFailures > 0 && liveCache && Date.now() - liveCache.ts < LIVE_CIRCUIT_MS) return null;

  for (const host of YAHOO_HOSTS) {
    try {
      const url = `https://${host}/v7/finance/quote?symbols=${symbols.join(",")}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { quoteResponse?: { result?: Array<Record<string, unknown> & YahooQuoteRaw & { symbol?: string }> } };
      const result = json.quoteResponse?.result ?? [];
      if (result.length === 0) continue;
      const map = new Map<string, RawQuote>();
      for (const q of result) {
        if (!q.symbol || q.regularMarketPrice == null) continue;
        map.set(q.symbol, {
          price: q.regularMarketPrice,
          open: q.regularMarketOpen ?? q.regularMarketPrice,
          prevClose: q.regularMarketPreviousClose ?? q.regularMarketPrice,
          dayHigh: q.regularMarketDayHigh ?? q.regularMarketPrice,
          dayLow: q.regularMarketDayLow ?? q.regularMarketPrice,
          volume: q.regularMarketVolume ?? 0,
        });
      }
      if (map.size > 0) {
        liveCache = { ts: Date.now(), quotes: map };
        liveFailures = 0;
        return map;
      }
    } catch {
      // try next host
    }
  }
  liveFailures++;
  if (!liveCache) liveCache = { ts: Date.now(), quotes: new Map() };
  return null;
}

// ── Public engine API ───────────────────────────────────────────────────────

export interface EngineResult {
  quotes: Quote[];
  source: DataSource;
}

/** Get quotes for symbols (default: full universe), live when possible. */
export async function getQuotes(symbols?: string[]): Promise<EngineResult> {
  const entries = symbols?.length
    ? symbols.map((s) => UNIVERSE_MAP.get(s.toUpperCase())).filter((e): e is UniverseEntry => !!e)
    : UNIVERSE;

  // Advance the simulated tape every poll — it is both the fallback and the
  // filler for symbols Yahoo doesn't return.
  warmUpSimulation();
  tickSimulation();

  const live = await fetchYahooQuotes(entries.map((e) => e.symbol));
  const source: DataSource = live && live.size > 0 ? "live" : "simulated";

  const quotes = entries.map((u) => {
    const s = getSim(u);
    const lq = live?.get(u.symbol);
    if (lq) return buildQuote(u, lq, s);
    return buildQuote(
      u,
      {
        price: s.price,
        open: s.open,
        prevClose: s.prevClose,
        dayHigh: s.dayHigh,
        dayLow: s.dayLow,
        volume: s.volume,
      },
      s,
    );
  });

  return { quotes, source };
}

/** Run the scanner: filter + score + sort the universe. */
export async function scan(
  filters: ScanFilters,
  sort: ScanSortKey = "score",
  limit = 50,
): Promise<{ rows: Quote[]; total: number; matched: number; source: DataSource }> {
  const { quotes, source } = await getQuotes();

  const search = filters.search.trim().toUpperCase();
  const rows = quotes.filter((q) => {
    if (q.price < filters.minPrice || q.price > filters.maxPrice) return false;
    if (filters.sectors.length > 0 && !filters.sectors.includes(q.sector)) return false;
    if (search && !q.symbol.includes(search) && !q.name.toUpperCase().includes(search)) return false;
    if (q.volume < filters.minVolume) return false;
    if (q.rvol < filters.minRvol) return false;
    if (Math.abs(q.gapPct) < filters.minGapPct) return false;
    if (q.score < filters.minScore) return false;
    // Pattern filter: require ANY of the selected signals
    if (filters.patterns.length > 0 && !filters.patterns.some((p) => q.signals.includes(p))) return false;
    // Options activity filter
    if (filters.minOptionsRatio > 0 && q.optionsRatio < filters.minOptionsRatio) return false;
    // Earnings-proximity filter
    if (filters.earningsWithinDays > 0 && (q.daysToEarnings < 0 || q.daysToEarnings > filters.earningsWithinDays)) return false;
    const absChg = Math.abs(q.changePct);
    if (absChg < filters.minChangePct) return false;
    if (filters.direction === "up" && q.changePct <= 0) return false;
    if (filters.direction === "down" && q.changePct >= 0) return false;
    return true;
  });

  // Default: descending by the sort key (biggest first). Exception: sorting by
  // changePct in a "down" scan means biggest *losers* first (ascending).
  const ascending = sort === "changePct" && filters.direction === "down";
  rows.sort((a, b) => {
    const diff = (a[sort] as number) - (b[sort] as number);
    const primary = ascending ? diff : -diff;
    return primary !== 0 ? primary : b.score - a.score;
  });

  return { rows: rows.slice(0, limit), total: quotes.length, matched: rows.length, source };
}

// ── Candles ─────────────────────────────────────────────────────────────────

export async function getCandles(symbol: string, range = "1d"): Promise<{ candles: Candle[]; source: DataSource }> {
  const u = UNIVERSE_MAP.get(symbol.toUpperCase());
  if (!u) return { candles: [], source: "simulated" };

  // Try live first
  try {
    const interval = range === "1d" ? "5m" : range === "5d" ? "15m" : "1d";
    for (const host of YAHOO_HOSTS) {
      const res = await fetch(`https://${host}/v8/finance/chart/${u.symbol}?range=${range}&interval=${interval}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            timestamp?: number[];
            indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }> };
          }>;
        };
      };
      const r = json.chart?.result?.[0];
      const ts = r?.timestamp ?? [];
      const q = r?.indicators?.quote?.[0];
      if (ts.length && q?.close) {
        const candles: Candle[] = [];
        for (let i = 0; i < ts.length; i++) {
          const c = q.close?.[i];
          if (c == null) continue;
          candles.push({
            time: ts[i],
            open: q.open?.[i] ?? c,
            high: q.high?.[i] ?? c,
            low: q.low?.[i] ?? c,
            close: c,
            volume: q.volume?.[i] ?? 0,
          });
        }
        if (candles.length > 1) return { candles, source: "live" };
      }
    }
  } catch {
    // fall through to synthetic
  }

  // Synthetic intraday path consistent with the sim state
  const s = getSim(u);
  const bars = range === "1d" ? 78 : range === "5d" ? 5 * 26 : 60;
  const rnd = mulberry32(hashSeed(u.symbol + range + dayStamp()));
  const candles: Candle[] = [];
  let price = s.open * (1 - s.drift / 200); // start slightly behind
  const nowSec = Math.floor(Date.now() / 1000);
  const stepSec = range === "1d" ? 300 : range === "5d" ? 900 : 86400;
  const target = s.price;
  for (let i = 0; i < bars; i++) {
    const pull = (target - price) / price / (bars - i);
    const pathVol = (u.vol / 100) * Math.sqrt(stepSec / 86400) * 2;
    const o = price;
    let h = o;
    let l = o;
    let c = o;
    for (let k = 0; k < 4; k++) {
      c *= 1 + (rnd() - 0.5) * pathVol + pull / 4;
      h = Math.max(h, c);
      l = Math.min(l, c);
    }
    price = c;
    candles.push({
      time: nowSec - (bars - i) * stepSec,
      open: round2(o),
      high: round2(h),
      low: round2(l),
      close: round2(c),
      volume: Math.floor((u.avgVolume / bars) * (0.5 + rnd())),
    });
  }
  return { candles, source: "simulated" };
}
