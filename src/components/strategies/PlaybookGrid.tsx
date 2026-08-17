import { memo } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SCAN_PRESETS } from '@contracts/market'
import type { ScanPreset } from '@contracts/market'
import LiveSignalsPreview from '@/components/strategies/LiveSignalsPreview'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface CardMeta {
  tags: string[]
  perDay: number
  artwork?: string
  score: number
  seed: number
}

/** Presentation overlay — presets stay the source of truth for data/filters. */
const META: Record<string, CardMeta> = {
  'momentum-breakout': {
    tags: ['INTRADAY', 'LARGE-CAP'],
    perDay: 8,
    artwork: '/strategy-momentum.webp',
    score: 92,
    seed: 11,
  },
  'gap-hunter': {
    tags: ['PRE-MARKET', 'INTRADAY'],
    perDay: 11,
    artwork: '/strategy-gap.webp',
    score: 87,
    seed: 23,
  },
  'capitulation-reversal': {
    tags: ['INTRADAY', 'REVERSAL'],
    perDay: 4,
    artwork: '/strategy-reversal.webp',
    score: 84,
    seed: 37,
  },
  'unusual-volume': { tags: ['VOLUME', 'SWING'], perDay: 6, score: 81, seed: 41 },
  'high-tight-flag': { tags: ['INTRADAY', 'BREAKOUT'], perDay: 5, score: 79, seed: 53 },
  'flush-scalp': { tags: ['INTRADAY', 'MEAN-REV'], perDay: 9, score: 74, seed: 67 },
  'quiet-accumulation': { tags: ['SWING', 'INSTITUTIONAL'], perDay: 3, score: 77, seed: 71 },
  'gap-fade': { tags: ['PRE-MARKET', 'FADE'], perDay: 7, score: 71, seed: 83 },
  'sector-surge': { tags: ['SWING', 'SECTOR'], perDay: 10, score: 76, seed: 97 },
}

const FALLBACK: CardMeta = { tags: ['INTRADAY'], perDay: 5, score: 70, seed: 5 }

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

interface Candle {
  x: number
  open: number
  close: number
  high: number
  low: number
  up: boolean
}

/**
 * Generated-looking SVG mini-chart motif for the six non-illustrated engines.
 * Abstract candlestick glyphs in palette colors, drawn in on first viewport
 * entry with a staggered fill/stroke reveal.
 */
const MiniChartMotif = memo(function MiniChartMotif({ seed }: { seed: number }) {
  const rand = seeded(seed)
  const candles: Candle[] = []
  let mid = 62 + rand() * 20
  const n = 9
  for (let i = 0; i < n; i++) {
    const x = 14 + i * 24
    const bodyH = 10 + rand() * 26
    const up = rand() > 0.42
    mid = Math.min(96, Math.max(26, mid + (up ? -1 : 1) * (4 + rand() * 10)))
    const open = up ? mid + bodyH / 2 : mid - bodyH / 2
    const close = up ? mid - bodyH / 2 : mid + bodyH / 2
    candles.push({
      x,
      open,
      close,
      high: Math.min(open, close) - 4 - rand() * 8,
      low: Math.max(open, close) + 4 + rand() * 8,
      up,
    })
  }

  return (
    <motion.svg
      viewBox="0 0 232 120"
      className="h-full w-full"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.05 }}
      aria-hidden="true"
    >
      {/* faint grid */}
      {[30, 60, 90].map((y) => (
        <line key={y} x1="0" y1={y} x2="232" y2={y} stroke="#161F2C" strokeWidth="1" />
      ))}
      {candles.map((c, i) => (
        <motion.g
          key={i}
          variants={{
            hidden: { opacity: 0, scaleY: 0 },
            show: {
              opacity: 1,
              scaleY: 1,
              transition: { duration: 0.4, ease: EASE },
            },
          }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <line
            x1={c.x} y1={c.high} x2={c.x} y2={c.low}
            stroke={c.up ? '#00E68C' : '#FF4D5E'}
            strokeWidth="1.5"
          />
          <rect
            x={c.x - 5}
            y={Math.min(c.open, c.close)}
            width="10"
            height={Math.max(3, Math.abs(c.close - c.open))}
            rx="1.5"
            fill={c.up ? '#00E68C' : '#FF4D5E'}
            fillOpacity={c.up ? 0.9 : 0.75}
          />
        </motion.g>
      ))}
    </motion.svg>
  )
})

function QuantBadge({ score }: { score: number }) {
  return (
    <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-quant bg-abyss/80 font-mono text-xs font-bold text-quant backdrop-blur-sm">
      {score}
    </span>
  )
}

function PlaybookCard({ preset, index }: { preset: ScanPreset; index: number }) {
  const meta = META[preset.id] ?? FALLBACK
  return (
    <motion.article
      initial={{ y: 48, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 3) * 0.08 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-grid bg-carbon transition-all duration-300 hover:-translate-y-1 hover:border-pulse/30 hover:shadow-glow-lg"
    >
      {/* Artwork / motif */}
      <div className="relative aspect-video overflow-hidden border-b border-grid bg-abyss">
        {meta.artwork ? (
          <img
            src={meta.artwork}
            alt={`${preset.name} strategy artwork`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full p-4 transition-transform duration-500 group-hover:scale-105">
            <MiniChartMotif seed={meta.seed} />
          </div>
        )}
        <QuantBadge score={meta.score} />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-medium leading-snug text-ink-primary">
          {preset.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{preset.tagline}.</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {meta.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-steel px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-ink-secondary"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 border-y border-grid py-2.5 font-mono text-xs tabular-nums">
          <span className="text-pulse">{preset.winRate}% win</span>
          <span className="text-ink-muted">·</span>
          <span className="text-ice">+{preset.avgMove.toFixed(1)}% avg</span>
          <span className="text-ink-muted">·</span>
          <span className="text-ink-secondary">{meta.perDay}/day</span>
        </div>

        {preset.id === 'momentum-breakout' && (
          <div className="mt-4">
            <LiveSignalsPreview preset={preset} />
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link
            to={`/scanner?preset=${preset.id}`}
            className="btn-shine flex w-full items-center justify-between rounded-lg border border-grid bg-steel px-4 py-2.5 font-mono text-xs font-medium text-ink-primary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06]"
          >
            <span>RUN THIS SCAN</span>
            <ArrowRight className="h-3.5 w-3.5 text-pulse transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

/** Section 3 — 3×3 playbook grid driven by the shared SCAN_PRESETS contract. */
export default function PlaybookGrid() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <motion.p
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="label-eyebrow text-pulse"
        >
          ALL ENGINES
        </motion.p>
        <motion.h2
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-ink-primary md:text-5xl"
        >
          Pick your weapon.
        </motion.h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SCAN_PRESETS.map((p, i) => (
            <PlaybookCard key={p.id} preset={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
