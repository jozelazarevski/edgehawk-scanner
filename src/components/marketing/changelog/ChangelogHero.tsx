import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import WordReveal from '@/components/marketing/WordReveal'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** "avg ships/week" stat that flashes a green tick every few seconds. */
function TickingStat() {
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    const id = setInterval(() => {
      setFlash(true)
      timeout = setTimeout(() => setFlash(false), 350)
    }, 7000)
    return () => {
      clearInterval(id)
      if (timeout) clearTimeout(timeout)
    }
  }, [])
  return (
    <span className={cn('rounded px-1.5 py-0.5', flash && 'animate-tick-up')}>
      avg 2.4 ships/week
    </span>
  )
}

export default function ChangelogHero() {
  return (
    <section className="dot-grid relative overflow-hidden">
      <div className="relative mx-auto max-w-[1280px] px-6 pb-14 pt-20 lg:px-12">
        <div className="max-w-[720px]">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="label-eyebrow text-pulse"
          >
            CHANGELOG
          </motion.p>
          <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.02em] text-ink-primary md:text-[64px]">
            <WordReveal text="Shipped. Logged. On the record." delay={0.1} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
            className="mt-6 max-w-[560px] text-lg leading-relaxed text-ink-secondary"
          >
            Every engine update, feed improvement, and retired edge — publicly
            committed. Latest release:{' '}
            <span className="font-mono font-medium text-pulse">v4.2.0</span>
          </motion.p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-ink-muted">
            {['first commit MAR 2021', '142 releases'].map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <span className="rounded bg-steel px-1.5 py-0.5">{chip}</span>
                <span aria-hidden>·</span>
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.5 + 2 * 0.08 }}
              className="rounded bg-steel"
            >
              <TickingStat />
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  )
}
