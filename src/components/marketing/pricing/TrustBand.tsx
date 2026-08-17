import { motion } from 'framer-motion'
import CountUp from '@/components/marketing/CountUp'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STATS = [
  { to: 12400, suffix: '+', decimals: 0, label: 'active traders' },
  { to: 4.8, suffix: '/5', decimals: 1, label: 'on Trustpilot' },
  { to: 99.98, suffix: '%', decimals: 2, label: 'feed uptime (90d)' },
  { static: '$0', label: 'in hidden fees' },
]

export default function TrustBand() {
  return (
    <section className="bg-carbon">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-10 px-6 py-12 md:grid-cols-4 lg:px-12">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
            className={cn(
              'flex flex-col items-center gap-1.5 text-center',
              i > 0 && 'md:border-l md:border-grid',
            )}
          >
            <span className="font-mono text-[28px] font-bold leading-none tabular-nums text-ink-primary">
              {'static' in s ? (
                s.static
              ) : (
                <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
              )}
            </span>
            <span className="font-mono text-xs text-ink-muted">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
