import { useRef } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Section 5 — CTA strip with a one-shot scanline sweep on entry. */
export default function StrategiesCta() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <section ref={ref} className="relative overflow-hidden py-24">
      <div className="dot-grid absolute inset-0 opacity-30" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(0,230,140,0.07), transparent)',
        }}
      />
      {/* One-shot scanline sweep crossing the section on entry */}
      {inView && (
        <motion.span
          initial={{ top: '-2px', opacity: 0.35 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ duration: 1.2, ease: 'linear' }}
          className="pointer-events-none absolute left-0 right-0 h-[2px] bg-pulse"
          aria-hidden="true"
        />
      )}

      <div className="relative mx-auto max-w-[800px] px-6 text-center lg:px-12">
        <motion.h2
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-ink-primary md:text-5xl"
        >
          Load an engine. Hunt.
        </motion.h2>
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          className="mt-8"
        >
          <Link
            to="/scanner"
            className="btn-shine animate-glow-pulse inline-flex items-center gap-2 rounded-lg bg-pulse px-7 py-3.5 text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
          >
            Open the Live Scanner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 font-mono text-xs text-ink-muted"
        >
          no card required · free tier includes 3 engines
        </motion.p>
      </div>
    </section>
  )
}
