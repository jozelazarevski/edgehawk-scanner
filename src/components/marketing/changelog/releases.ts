export type ReleaseCategory = 'ENGINE' | 'FEED' | 'UI' | 'FIX' | 'RETIRED'
export type ChangeKind = 'added' | 'improved' | 'removed' | 'fixed'

export interface ReleaseChange {
  kind: ChangeKind
  text: string
}

export interface Release {
  version: string
  date: string
  categories: ReleaseCategory[]
  title: string
  changes: ReleaseChange[]
  perf?: { label: string; from?: string; to: string }
  latest?: boolean
}

export const CATEGORY_COLORS: Record<ReleaseCategory, string> = {
  ENGINE: '#8B7CFF',
  FEED: '#4DD8FF',
  UI: '#00E68C',
  FIX: '#FFB224',
  RETIRED: '#FF4D5E',
}

export const CHANGE_GLYPHS: Record<ChangeKind, { glyph: string; color: string }> = {
  added: { glyph: '+', color: '#00E68C' },
  improved: { glyph: '~', color: '#4DD8FF' },
  removed: { glyph: '−', color: '#FF4D5E' },
  fixed: { glyph: '!', color: '#FFB224' },
}

/** Newest first. */
export const RELEASES: Release[] = [
  {
    version: 'v4.2.0',
    date: 'NOV 28, 2025',
    categories: ['ENGINE', 'FEED'],
    title: 'Dark pool prints, scored.',
    latest: true,
    changes: [
      {
        kind: 'added',
        text: 'Dark Pool Prints engine: block prints scored by size anomaly vs. 30-day profile',
      },
      { kind: 'added', text: 'Heatmap view in scanner (tile sizing by RelVol)' },
      { kind: 'improved', text: 'Alert pipeline rewrite — median latency 19ms → 14ms' },
      { kind: 'fixed', text: 'Fixed sparkline flicker on halted symbols' },
    ],
    perf: { label: 'median alert latency', from: '19ms', to: '14ms' },
  },
  {
    version: 'v4.1.2',
    date: 'NOV 14, 2025',
    categories: ['FIX'],
    title: 'The quiet one.',
    changes: [
      { kind: 'fixed', text: 'Resolved duplicate alerts on symbol re-halts' },
      { kind: 'fixed', text: 'Watchlist stars persisting across sessions' },
      { kind: 'improved', text: 'Mobile scanner drawer gesture polish' },
    ],
  },
  {
    version: 'v4.1.0',
    date: 'OCT 30, 2025',
    categories: ['ENGINE'],
    title: 'Power Hour joins the desk.',
    changes: [
      { kind: 'added', text: 'Power Hour engine: 3PM momentum continuation detection' },
      { kind: 'added', text: 'SMS alerts for Quant Score ≥ 80' },
      { kind: 'improved', text: 'Quant Score model retrained on +6mo data — precision +3.1%' },
    ],
    perf: { label: 'Quant Score precision', to: '+3.1%' },
  },
  {
    version: 'v4.0.0',
    date: 'OCT 02, 2025',
    categories: ['UI', 'ENGINE'],
    title: 'The Quant Score release.',
    changes: [
      { kind: 'added', text: 'Quant Score (0–100) on every alert — 12yr pattern engine, now public' },
      { kind: 'added', text: 'New scanner workspace: filter rail, alerts rail, detail drawer' },
      { kind: 'removed', text: 'Retired legacy v3 dashboard' },
    ],
  },
  {
    version: 'v3.9.1',
    date: 'SEP 18, 2025',
    categories: ['RETIRED'],
    title: 'Retiring Opening Drive.',
    changes: [
      {
        kind: 'removed',
        text: 'Opening Drive engine retired — edge decayed below significance (posted full backtest)',
      },
      { kind: 'improved', text: "Gap Hunter v2 filters absorb 80% of OD's true positives" },
    ],
  },
  {
    version: 'v3.9.0',
    date: 'SEP 04, 2025',
    categories: ['FEED'],
    title: 'OPRA, full firehose.',
    changes: [
      { kind: 'added', text: 'Full OPRA options feed — sweeps & blocks in scanner' },
      { kind: 'improved', text: 'Tick ingestion capacity 1.8M → 3.2M ticks/sec' },
    ],
    perf: { label: 'tick ingestion', from: '1.8M', to: '3.2M ticks/sec' },
  },
  {
    version: 'v3.8.0',
    date: 'AUG 12, 2025',
    categories: ['UI'],
    title: 'Terminal mode.',
    changes: [
      { kind: 'added', text: 'Sound alerts w/ per-engine tones' },
      { kind: 'added', text: 'Keyboard navigation: / search, J/K row nav, Enter detail' },
      { kind: 'fixed', text: '40+ contrast & a11y fixes' },
    ],
  },
  {
    version: 'v3.7.0',
    date: 'JUL 21, 2025',
    categories: ['ENGINE'],
    title: 'Capitulation, quantified.',
    changes: [
      { kind: 'added', text: 'Capitulation Reversal engine' },
      { kind: 'added', text: 'Float Rotation alerts (turnover ≥ 1.0× float)' },
      { kind: 'improved', text: 'RelVol now computed tick-wise (was 5s buckets)' },
    ],
  },
]
