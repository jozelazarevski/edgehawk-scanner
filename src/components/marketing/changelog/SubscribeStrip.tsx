import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function SubscribeStrip() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <motion.section
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="border-y border-grid bg-carbon"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between lg:px-12">
        <div>
          <p className="font-mono text-sm text-ink-primary">
            <span className="text-pulse">$</span> edgehawk releases --rss
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Get release notes in your inbox. Monthly digest, zero noise.
          </p>
        </div>

        <div className="flex min-h-[46px] items-center">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex items-center gap-2.5 rounded-lg border border-pulse/40 bg-pulse/10 px-5 py-3"
              >
                <Check className="h-4 w-4 text-pulse" />
                <span className="font-mono text-sm font-medium tracking-wide text-pulse">
                  SUBSCRIBED
                </span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex w-full gap-3 sm:w-auto"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (email.trim()) setDone(true)
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@fund.com"
                  aria-label="Email address"
                  className="w-full rounded-lg border border-grid bg-steel px-4 py-2.5 font-mono text-sm text-ink-primary placeholder:text-ink-muted focus:border-pulse/60 focus:outline-none sm:w-64"
                />
                <button
                  type="submit"
                  className="btn-shine shrink-0 rounded-lg bg-pulse px-5 py-2.5 text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
                >
                  Subscribe
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  )
}
