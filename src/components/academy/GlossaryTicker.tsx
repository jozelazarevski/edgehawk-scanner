import { useEffect, useRef, useState } from 'react'
import type { AnimationPlaybackControls } from 'framer-motion'
import { animate, motion, useInView, useMotionValue } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const TERMS: { term: string; def: string }[] = [
  { term: 'REL VOL', def: "Today's volume vs. its own 20-day average for this minute. Above 2.0, pay attention." },
  { term: 'FLOAT ROTATION', def: 'Shares traded ÷ float. One full rotation means the entire float changed hands.' },
  { term: 'LULD HALT', def: 'Limit Up-Limit Down pause. Trading freezes when price exits the band.' },
  { term: 'VWAP', def: "Volume-weighted average price. The institution's benchmark — the line algos defend." },
  { term: 'DARK POOL', def: 'Off-exchange venue where size moves without printing to the lit book.' },
  { term: 'SWEEP', def: 'An aggressive options order split across exchanges. Someone wants fills now.' },
  { term: 'SHORT INTEREST', def: 'Percentage of float sold short. High SI plus a catalyst is squeeze fuel.' },
  { term: 'GAP FILL', def: 'Price returning to the prior close. Most gaps fill — the question is when.' },
]

const CARD_W = 240
const GAP = 24

export default function GlossaryTicker() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const driftRef = useRef<AnimationPlaybackControls | null>(null)
  const x = useMotionValue(0)
  const [maxDrag, setMaxDrag] = useState(0)
  const [interacted, setInteracted] = useState(false)
  const inView = useInView(viewportRef, { amount: 0.3 })

  // Measure draggable range
  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current
      const track = trackRef.current
      if (!vp || !track) return
      setMaxDrag(Math.max(0, track.scrollWidth - vp.clientWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (viewportRef.current) ro.observe(viewportRef.current)
    if (trackRef.current) ro.observe(trackRef.current)
    return () => ro.disconnect()
  }, [])

  // Slow auto-drift until the user takes control
  useEffect(() => {
    if (!inView || interacted || maxDrag <= 0) return
    const remaining = maxDrag + x.get() // distance left to travel (x is <= 0)
    if (remaining <= 1) return
    const controls = animate(x, -maxDrag, {
      duration: 60 * (remaining / maxDrag),
      ease: 'linear',
    })
    driftRef.current = controls
    return () => controls.stop()
  }, [inView, interacted, maxDrag, x])

  const takeControl = () => {
    driftRef.current?.stop()
    setInteracted(true)
  }

  const nudge = (dir: 'prev' | 'next') => {
    takeControl()
    const step = CARD_W + GAP
    const target = x.get() + (dir === 'next' ? -step : step)
    const clamped = Math.max(-maxDrag, Math.min(0, target))
    animate(x, clamped, { duration: 0.5, ease: EASE })
  }

  return (
    <section className="border-y border-grid bg-carbon py-16">
      {/* Header row */}
      <div className="mx-auto flex max-w-[1280px] items-end justify-between px-6 lg:px-12">
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="label-eyebrow text-pulse">GLOSSARY</p>
          <h3 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ink-primary md:text-4xl">
            Speak the tape.
          </h3>
        </motion.div>
        <div className="flex gap-2">
          <button
            onClick={() => nudge('prev')}
            aria-label="Scroll glossary left"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-grid text-ink-secondary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06] hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => nudge('next')}
            aria-label="Scroll glossary right"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-grid text-ink-secondary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06] hover:text-ink-primary"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Draggable strip */}
      <div ref={viewportRef} className="tape-mask mt-10 overflow-hidden">
        <motion.div
          ref={trackRef}
          className="flex w-fit cursor-grab gap-6 select-none active:cursor-grabbing"
          style={{
            x,
            paddingLeft: 'max(1.5rem, calc((100vw - 1280px) / 2 + 3rem))',
            paddingRight: 'max(1.5rem, calc((100vw - 1280px) / 2 + 3rem))',
          }}
          drag="x"
          dragConstraints={{ left: -maxDrag, right: 0 }}
          dragElastic={0.12}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
          onDragStart={takeControl}
        >
          {TERMS.map((t, i) => (
            <motion.div
              key={t.term}
              className="w-[240px] shrink-0 rounded-xl border border-grid bg-abyss p-5"
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            >
              <p className="font-mono text-sm font-bold tracking-wide text-pulse">{t.term}</p>
              <p className="mt-3 line-clamp-2 text-sm leading-[1.5] text-ink-secondary">{t.def}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
