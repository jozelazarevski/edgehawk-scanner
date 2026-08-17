import { motion } from 'framer-motion'
import WordReveal from '@/components/marketing/WordReveal'
import { cn } from '@/lib/utils'
import type { Billing } from './billing'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const OPTIONS: { value: Billing; label: string }[] = [
  { value: 'monthly', label: 'MONTHLY' },
  { value: 'annual', label: 'ANNUAL' },
]

export default function PricingHero({
  billing,
  onBillingChange,
}: {
  billing: Billing
  onBillingChange: (billing: Billing) => void
}) {
  return (
    <section className="dot-grid relative overflow-hidden">
      {/* soft radial glow behind hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-pulse/[0.05] blur-[110px]"
      />
      <div className="relative mx-auto max-w-[720px] px-6 pb-16 pt-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="label-eyebrow text-pulse"
        >
          PRICING
        </motion.p>
        <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.02em] text-ink-primary md:text-[64px]">
          <WordReveal text="An edge costs less than one bad trade." delay={0.1} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          className="mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-ink-secondary"
        >
          Start free. Upgrade when the alerts pay for it — usually the first week.
        </motion.p>

        {/* Billing toggle — segmented control with sliding pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.5 }}
          className="mt-10 inline-flex"
        >
          <div
            role="group"
            aria-label="Billing period"
            className="relative flex items-center rounded-full border border-grid bg-carbon p-1"
          >
            {OPTIONS.map((opt) => {
              const active = billing === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onBillingChange(opt.value)}
                  className="relative rounded-full px-5 py-2 font-mono text-xs font-medium tracking-[0.08em]"
                >
                  {active && (
                    <motion.span
                      layoutId="billing-pill"
                      className="absolute inset-0 rounded-full bg-pulse"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 flex items-center gap-2 transition-colors duration-200',
                      active ? 'text-abyss' : 'text-ink-secondary hover:text-ink-primary',
                    )}
                  >
                    {opt.label}
                    {opt.value === 'annual' && (
                      <span className="rounded-full border border-amber-watch/50 bg-amber-watch/10 px-1.5 py-px text-[10px] leading-tight text-amber-watch">
                        -20%
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
