import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/** Inline mini chart illustration — RelVol profile bars in palette colors. */
function MiniChart() {
  const bars = [22, 30, 26, 41, 35, 58, 47, 66, 54, 82, 71, 95, 78, 88, 64, 52]
  const w = 560
  const h = 180
  const bw = w / bars.length
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-4 w-full rounded-lg border border-grid bg-abyss"
      role="img"
      aria-label="Relative volume profile chart"
    >
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={w}
          y1={h * f}
          y2={h * f}
          stroke="#161F2C"
          strokeWidth={1}
        />
      ))}
      {/* 20-day average line */}
      <line x1={0} x2={w} y1={h * 0.45} y2={h * 0.45} stroke="#FFB224" strokeWidth={1.5} strokeDasharray="6 4" />
      {bars.map((v, i) => {
        const bh = (v / 100) * (h - 24)
        const hot = v > 60
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.2}
            y={h - bh}
            width={bw * 0.6}
            height={bh}
            rx={2}
            fill={hot ? '#00E68C' : '#111823'}
            stroke={hot ? '#00E68C' : '#161F2C'}
            strokeWidth={1}
            opacity={hot ? 0.9 : 1}
          />
        )
      })}
      <text x={8} y={h * 0.45 - 6} fill="#FFB224" fontSize={10} fontFamily="'JetBrains Mono', monospace">
        20D AVG
      </text>
    </svg>
  )
}

function ArticleBody() {
  return (
    <div className="space-y-8 text-lg leading-[1.6] text-ink-secondary">
      <section>
        <h3 className="mb-3 font-display text-xl font-bold text-ink-primary">
          01 · The 20-day baseline
        </h3>
        <p>
          Relative volume is not "volume is high." It is volume measured against this stock's own
          20-day profile for this exact minute of the session. A name that trades 4M shares by 10:00
          can be dead if it usually trades 6M by then. The scanner's RelVol field divides today's
          cumulative tape by the expected cumulative tape — a 1.0 is perfectly normal, a 3.2 means
          the float is moving three times faster than its own history says it should.
        </p>
        <p className="mt-4">
          Market makers internalize this curve instinctively. They quote wider when RelVol rips
          through 2.0 because informed flow is arriving, and tighter when it decays below 0.7
          because the book is safe. You can read the same signal without the seat.
        </p>
        <MiniChart />
        <p className="mt-2 font-mono text-xs text-ink-muted">
          FIG 1.1 — 10-minute RelVol profile. Bars above the 20-day mean (amber) are where the
          scanner starts scoring.
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-display text-xl font-bold text-ink-primary">
          02 · The opening-range signature
        </h3>
        <p>
          The first thirty minutes contaminate every naive RelVol calculation — volume is always
          elevated at the open. That is why a 4.0 at 9:45 is ordinary and a 4.0 at 13:30 is a siren.
          The engine weights the curve by time-of-day, so the number you see at lunch is already
          normalized. When it prints above 2.5 after 11:00 with price holding above VWAP, you are
          looking at sustained institutional participation, not opening noise.
        </p>
        <p className="mt-4">
          Pair it with float rotation: RelVol tells you how fast, rotation tells you how much of the
          float has actually changed hands. A 2.5 RelVol on a 40M float name that has rotated 0.3×
          is accumulation. The same print on a 4M micro-float that has rotated 6× is a crowd
          fighting over the same shares — and it ends violently in both directions.
        </p>
      </section>

      <section>
        <h3 className="mb-3 font-display text-xl font-bold text-ink-primary">
          03 · Fading the spike, keeping the trend
        </h3>
        <p>
          The most misread moment is the RelVol peak itself. New traders chase the 8.0 print; the
          tape is usually done paying by then. The edge lives in the decay pattern. A spike that
          fades to 1.5 and holds while price bases sideways is coiling for the second leg — the
          engine flags these as RESET states. A spike that collapses straight through 1.0 with price
          losing VWAP is distribution, and the alert was the exit, not the entry.
        </p>
        <p className="mt-4">
          Build the scan: RelVol ≥ 2.0, price above VWAP, float rotation between 0.5× and 3×, spread
          under 0.3%. Then do the one thing the scanner cannot do for you — wait for the level. The
          machine finds the crowd. You still have to read the room.
        </p>
        <div className="rounded-lg border border-grid bg-steel px-4 py-3 font-mono text-xs text-ink-secondary">
          <span className="text-pulse">$</span> scan --relvol '&gt;=2.0' --above vwap --rotation
          0.5..3.0 --spread '&lt;0.3%'
        </div>
      </section>
    </div>
  )
}

export default function FeaturedArticle() {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-12">
      <motion.div
        className="group grid overflow-hidden rounded-2xl border border-grid bg-carbon transition-[box-shadow,border-color] duration-300 hover:border-pulse/30 hover:shadow-glow-lg md:grid-cols-[55%_45%]"
        initial={{ y: 48, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {/* Image — alternate crop of the academy hero */}
        <div className="relative min-h-[260px] overflow-hidden">
          <img
            src="/academy-hero.webp"
            alt="Trading desk with green charts and candlestick sketches"
            className="absolute inset-0 h-full w-full object-cover object-[72%_28%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-carbon/40 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-carbon" />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-watch/30 bg-amber-watch/10 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-amber-watch">
              FEATURED
            </span>
            <span className="font-mono text-xs text-ink-muted">12 min read</span>
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold leading-[1.1] tracking-[-0.01em] text-ink-primary md:text-4xl">
            How to Read Relative Volume Like a Market Maker
          </h2>
          <p className="mt-4 leading-[1.6] text-ink-secondary">
            RelVol is the single most predictive field in your scanner — and the most misread.
            Here's the 20-day profile method our quant engine uses, translated for humans.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-steel font-mono text-xs font-bold text-pulse ring-2 ring-pulse">
              JC
            </span>
            <div>
              <p className="text-sm font-medium text-ink-primary">
                J. Caldwell <span className="text-ink-muted">· Head of Quant Research</span>
              </p>
              <p className="font-mono text-xs text-ink-muted">2025-11-30</p>
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={() => setOpen(true)}
              className="btn-shine inline-flex items-center gap-2 rounded-lg border border-grid px-6 py-3 text-sm font-medium text-ink-primary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06]"
            >
              Read the breakdown <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reading modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[680px] gap-0 overflow-hidden rounded-xl border-grid bg-carbon p-0 sm:max-w-[680px]">
          {/* Reading progress bar */}
          <div className="h-[3px] w-full bg-steel">
            <div
              className="h-full bg-pulse transition-[width] duration-150 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="max-h-[78dvh] overflow-y-auto px-6 py-8 md:px-10"
          >
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-amber-watch/30 bg-amber-watch/10 px-2.5 py-1 font-mono text-[11px] font-medium tracking-wide text-amber-watch">
                  FEATURED
                </span>
                <span className="font-mono text-xs text-ink-muted">12 min read · 2025-11-30</span>
              </div>
              <DialogTitle className="font-display text-2xl font-bold leading-[1.1] tracking-[-0.01em] text-ink-primary md:text-3xl">
                How to Read Relative Volume Like a Market Maker
              </DialogTitle>
              <DialogDescription className="text-sm text-ink-secondary">
                J. Caldwell · Head of Quant Research
              </DialogDescription>
            </DialogHeader>
            <ArticleBody />
            <div className="mt-10 border-t border-grid pt-6">
              <p className="font-mono text-xs text-ink-muted">
                END OF ARTICLE · FILED UNDER <span className="text-pulse">SCANNER BASICS</span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
