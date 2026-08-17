import { motion } from 'framer-motion'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const BARS = [
  { label: '12yr data', pct: 100, note: 'TICK-LEVEL · SURVIVORSHIP-FREE' },
  { label: 'walk-forward OOS', pct: 80, note: 'OUT-OF-SAMPLE VALIDATED' },
  { label: 'weekly re-validation', pct: 60, note: 'DECAYED EDGES RETIRED' },
]

/** Section 4 — full-bleed backtest methodology band with animated stat bars. */
export default function BacktestBand() {
  return (
    <section className="relative border-y border-grid bg-carbon">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-20 lg:px-12">
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="label-eyebrow text-pulse">METHODOLOGY</p>
          <h3 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-[-0.01em] text-ink-primary md:text-4xl">
            Backtested like we mean it.
          </h3>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-secondary">
            Every engine is validated on 12 years of survivorship-bias-free tick
            data, walk-forward tested out-of-sample, and re-scored weekly.
            Slippage and commissions modeled at retail-realistic rates. If an
            edge decays below significance, we retire the playbook — publicly,
            in the changelog.
          </p>
        </motion.div>

        <div className="flex flex-col justify-center gap-7">
          {BARS.map((b, i) => (
            <div key={b.label}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-mono text-sm font-medium text-ink-primary">{b.label}</span>
                <span className="font-mono text-[10px] tracking-wider text-ink-muted">
                  {b.note}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-steel">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.pct}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1, ease: EASE, delay: i * 0.15 }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #00E68C66, #00E68C)',
                    boxShadow: '0 0 12px #00E68C40',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
