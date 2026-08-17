import { useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export default function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return
    setSubscribed(true)
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24 lg:px-12">
      <motion.div
        className="relative mx-auto max-w-[560px] overflow-hidden rounded-xl border border-grid bg-carbon p-8 md:p-10"
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* Terminal scanline sweep */}
        <div className="scanline-sweep" />
        {/* Dot grid texture */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative">
          <h2 className="font-display text-2xl font-medium leading-[1.2] text-ink-primary">
            <span className="font-mono font-bold text-pulse">$</span>{' '}
            <span className="font-mono">subscribe --to the-edge-letter</span>
            <span
              aria-hidden
              className="ml-1 inline-block h-5 w-2.5 translate-y-0.5 animate-caret-blink bg-pulse"
            />
          </h2>
          <p className="mt-4 text-sm leading-[1.6] text-ink-secondary">
            One email each Sunday: the week's best alert, the trade review, and one lesson. Read by{' '}
            <span className="font-mono text-pulse">34,000</span> traders.
          </p>

          <div className="mt-6 min-h-[52px]">
            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.div
                  key="success"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pulse/40 bg-pulse/10">
                    <Check className="h-4 w-4 text-pulse" />
                  </span>
                  <p className="font-mono text-sm text-pulse">
                    SUBSCRIBED. <span className="text-ink-secondary">First letter lands Sunday.</span>
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={onSubmit}
                  className="flex flex-col gap-3 sm:flex-row"
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@desk.com"
                    aria-label="Email address"
                    className="w-full flex-1 rounded-lg border border-grid bg-steel px-4 py-3 font-mono text-sm text-ink-primary placeholder:text-ink-muted focus:border-pulse/60 focus:outline-none focus:ring-2 focus:ring-pulse/40"
                  />
                  <button
                    type="submit"
                    className="btn-shine shrink-0 rounded-lg bg-pulse px-6 py-3 font-mono text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
                  >
                    Subscribe ↵
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-4 font-mono text-[11px] tracking-wide text-ink-muted">
            // no spam. no signals-for-sale. unsubscribe anytime.
          </p>
        </div>

        {/* Scanline flash on subscribe */}
        <AnimatePresence>
          {subscribed && (
            <motion.div
              className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] bg-pulse"
              initial={{ y: 0, opacity: 0.7 }}
              animate={{ y: 320, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
