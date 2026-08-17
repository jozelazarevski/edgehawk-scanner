import { useEffect } from 'react'
import { Link } from 'react-router'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Billing } from './billing'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface Tier {
  name: string
  tagline: string
  monthly: number
  annual: number
  cta: string
  popular?: boolean
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'SCOUT',
    tagline: 'Taste the feed.',
    monthly: 0,
    annual: 0,
    cta: 'Start Free',
    features: [
      '15-min delayed data',
      '1 saved scan',
      '3 preset engines',
      '10 alerts / day',
      'Community Discord',
    ],
  },
  {
    name: 'PRO',
    tagline: 'The full desk.',
    monthly: 49,
    annual: 39,
    cta: 'Go Pro →',
    popular: true,
    features: [
      'Realtime ticks (0ms delay)',
      'Unlimited scans & custom filters',
      'All 9 engines',
      'Unlimited alerts + sound / SMS',
      'Quant Score access',
      'Heatmap view',
      'API (1k calls/day)',
    ],
  },
  {
    name: 'DESK',
    tagline: 'For teams & prop.',
    monthly: 149,
    annual: 119,
    cta: 'Talk to Sales',
    features: [
      'Everything in Pro',
      '5 seats',
      'Shared watchlists',
      'Options flow detail',
      'Priority 8ms feed',
      'Dedicated support',
      'API (50k calls/day)',
    ],
  },
]

/** Price number that tweens to its new value on billing toggle (0.4s). */
function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value)
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.4, ease: EASE })
    return () => controls.stop()
  }, [value, mv])
  const text = useTransform(mv, (v) => String(Math.round(v)))
  return <motion.span className="tabular-nums">{text}</motion.span>
}

function TierCard({ tier, billing, index }: { tier: Tier; billing: Billing; index: number }) {
  const price = billing === 'annual' ? tier.annual : tier.monthly
  const discounted = billing === 'annual' && tier.annual !== tier.monthly
  return (
    <motion.div
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.12 }}
      whileHover={{ y: -4 }}
      style={tier.popular ? { scale: 1.03 } : undefined}
      className={cn(
        'relative flex flex-col rounded-xl bg-carbon p-8 transition-[box-shadow,border-color] duration-300',
        tier.popular
          ? 'animate-glow-pulse border-2 border-pulse shadow-glow-lg'
          : 'border border-grid hover:border-pulse/30 hover:shadow-glow',
      )}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-watch/60 bg-abyss px-3 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-amber-watch">
          MOST POPULAR
        </span>
      )}

      <p
        className={cn(
          'label-eyebrow',
          tier.popular ? 'text-pulse' : 'text-ink-secondary',
        )}
      >
        {tier.name}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="font-mono text-5xl font-bold leading-none text-ink-primary">
          $<AnimatedPrice value={price} />
        </span>
        {discounted && (
          <s className="pb-0.5 font-mono text-lg text-ink-muted tabular-nums">
            ${tier.monthly}
          </s>
        )}
        <span className="pb-0.5 font-mono text-xs text-ink-muted">/mo USD</span>
      </div>
      <p className="mt-1 h-4 font-mono text-[11px] text-pulse">
        {discounted ? 'billed annually — save 20%' : ''}
      </p>

      <p className="mt-3 text-sm text-ink-secondary">{tier.tagline}</p>

      <div className="my-6 border-t border-grid" />

      <ul className="flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-pulse" />
            <span className="text-sm leading-snug text-ink-secondary">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/scanner"
        className={cn(
          'btn-shine mt-8 block rounded-lg px-5 py-3 text-center text-sm transition-all duration-200',
          tier.popular
            ? 'bg-pulse font-semibold text-abyss hover:-translate-y-px hover:brightness-110 active:translate-y-0'
            : 'border border-grid font-medium text-ink-primary hover:border-pulse/50 hover:bg-pulse/[0.06]',
        )}
      >
        {tier.cta}
      </Link>
      <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-ink-muted">
        Cancel anytime. Data: consolidated tape.
      </p>
    </motion.div>
  )
}

export default function TierCards({ billing }: { billing: Billing }) {
  return (
    <section className="py-16">
      <div className="mx-auto grid max-w-[1280px] items-start gap-6 px-6 md:grid-cols-3 lg:px-12">
        {TIERS.map((tier, i) => (
          <TierCard key={tier.name} tier={tier} billing={billing} index={i} />
        ))}
      </div>
    </section>
  )
}
