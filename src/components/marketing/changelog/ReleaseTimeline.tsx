import { useRef } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { Activity } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Filter } from './FilterChips'
import type { Release } from './releases'
import { CATEGORY_COLORS, CHANGE_GLYPHS, RELEASES } from './releases'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

function CategoryChip({ category }: { category: Release['categories'][number] }) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide"
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      {category}
    </span>
  )
}

function ReleaseEntry({ release, index }: { release: Release; index: number }) {
  const nodeColor = CATEGORY_COLORS[release.categories[0]]
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index, 3) * 0.1 }}
      className="relative pl-16"
    >
      {/* node dot on the timeline */}
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, ease: EASE, delay: 0.15 }}
        className="absolute left-[19px] top-2 h-3 w-3 rounded-full"
        style={{ backgroundColor: nodeColor, boxShadow: '0 0 0 3px #05070B' }}
      >
        {release.latest && (
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ backgroundColor: nodeColor, opacity: 0.5 }}
          />
        )}
      </motion.span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-lg font-bold text-ink-primary">
          {release.version}
        </span>
        <span className="font-mono text-xs text-ink-muted">{release.date}</span>
        {release.latest && (
          <span className="flex items-center gap-1.5 rounded-full border border-pulse/40 bg-pulse/10 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-pulse">
            <span className="live-dot" />
            LATEST
          </span>
        )}
        <span className="flex gap-1.5">
          {release.categories.map((c) => (
            <CategoryChip key={c} category={c} />
          ))}
        </span>
      </div>

      <h3 className="mt-2 font-display text-2xl font-medium leading-snug text-ink-primary">
        {release.title}
      </h3>

      <ul className="mt-4 space-y-2">
        {release.changes.map((change, ci) => {
          const { glyph, color } = CHANGE_GLYPHS[change.kind]
          return (
            <li key={ci} className="flex gap-3 font-mono text-sm leading-relaxed">
              <span className="w-3 shrink-0 font-bold" style={{ color }}>
                {glyph}
              </span>
              <span className="text-ink-secondary">{change.text}</span>
            </li>
          )
        })}
      </ul>

      {release.perf && (
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-grid pt-3 font-mono text-xs text-ink-muted">
          <Activity className="h-3.5 w-3.5" />
          <span>{release.perf.label}</span>
          {release.perf.from && (
            <>
              <span className="text-ink-secondary tabular-nums">{release.perf.from}</span>
              <span aria-hidden>→</span>
            </>
          )}
          <span className="font-bold text-pulse tabular-nums">{release.perf.to}</span>
        </p>
      )}
    </motion.article>
  )
}

function GhostEntry() {
  return (
    <div className="relative pl-16 opacity-40">
      <span
        className="absolute left-[19px] top-2 h-3 w-3 rounded-full bg-ink-muted"
        style={{ boxShadow: '0 0 0 3px #05070B' }}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-lg font-bold text-ink-secondary">v1.0.0</span>
        <span className="font-mono text-xs text-ink-muted">MAR 2021</span>
      </div>
      <h3 className="mt-2 font-display text-2xl font-medium text-ink-secondary">
        &ldquo;first commit&rdquo;
      </h3>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="mt-4 font-mono text-sm text-pulse transition-opacity hover:opacity-80"
            >
              Browse full archive →
            </button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default function ReleaseTimeline({ filter }: { filter: Filter }) {
  const filtered = RELEASES.filter(
    (r) => filter === 'ALL' || r.categories.includes(filter),
  )
  const lineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ['start 0.7', 'end 0.5'],
  })
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[820px] px-6">
        <div ref={lineRef} className="relative">
          {/* base line + scroll-drawn progress line */}
          <div className="absolute bottom-4 left-6 top-2 w-[2px] bg-grid" />
          <motion.div
            style={{ scaleY }}
            className="absolute bottom-4 left-6 top-2 w-[2px] origin-top bg-pulse"
          />

          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {filtered.map((release, i) => (
                <ReleaseEntry key={release.version} release={release} index={i} />
              ))}
            </AnimatePresence>
            <GhostEntry />
          </div>
        </div>
      </div>
    </section>
  )
}
