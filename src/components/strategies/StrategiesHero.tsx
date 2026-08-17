import { motion } from 'framer-motion'
import { SCAN_PRESETS } from '@contracts/market'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * Section 1 — Page hero: eyebrow, word-split H1, sub, stat chips.
 * Load-triggered Framer Motion staggers (UI layer — no GSAP here).
 */
export default function StrategiesHero() {
  const words = ['Nine', 'engines.', 'Zero', 'noise.']
  const avgWin = Math.round(
    SCAN_PRESETS.reduce((acc, p) => acc + p.winRate, 0) / SCAN_PRESETS.length,
  )
  const chips = [
    `${SCAN_PRESETS.length} engines`,
    '12yr backtested',
    `avg ${avgWin}% win rate`,
    'updated weekly',
  ]

  return (
    <section className="relative overflow-hidden pt-24 pb-16">
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(0,230,140,0.08), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-[800px] px-6 text-center lg:px-12">
        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="label-eyebrow text-pulse"
        >
          SIGNAL LIBRARY
        </motion.p>

        <h1 className="mt-5 font-display text-[40px] font-bold leading-none tracking-[-0.02em] text-ink-primary md:text-[64px]">
          {words.map((w, i) => (
            <span key={w} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.06 }}
              >
                {w}
                {i < words.length - 1 ? ' ' : ''}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
          className="mx-auto mt-6 max-w-[640px] text-lg leading-relaxed text-ink-secondary"
        >
          Every playbook is a codified edge — entry conditions, filters, and exits
          distilled from 12 years of tick data. Load one into your scanner with a
          single click.
        </motion.p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {chips.map((c, i) => (
            <motion.span
              key={c}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.6 + i * 0.08 }}
              className="rounded-full border border-grid bg-carbon px-4 py-1.5 font-mono text-xs text-ink-secondary tabular-nums"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
