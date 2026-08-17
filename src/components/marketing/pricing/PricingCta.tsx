import { Link } from 'react-router'
import { motion } from 'framer-motion'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function PricingCta() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* radial green glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/[0.07] blur-[120px]"
      />
      {/* one-time scanline sweep */}
      <motion.div
        aria-hidden
        initial={{ y: '-2px', opacity: 0 }}
        whileInView={{ y: '100vh', opacity: [0, 0.2, 0] }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease: 'linear' }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-pulse"
      />

      <div className="relative mx-auto max-w-[720px] px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-display text-[32px] font-bold tracking-[-0.02em] text-ink-primary md:text-5xl"
        >
          The tape doesn&rsquo;t wait.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="mt-8"
        >
          <Link
            to="/scanner"
            className="btn-shine inline-block rounded-lg bg-pulse px-8 py-3.5 text-sm font-semibold text-abyss shadow-glow transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
          >
            Start Free — No Card →
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 font-mono text-xs text-ink-muted"
        >
          14-day money-back on all paid plans
        </motion.p>
      </div>
    </section>
  )
}
