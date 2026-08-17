import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Signal = 'BREAKOUT' | 'WATCH' | 'FADE'
type Category = 'Momentum' | 'Gappers' | 'Unusual Vol' | 'Halts'

interface Row {
  id: string
  sym: string
  price: number
  chg: number
  relVol: number
  float: number
  signal: Signal
  cat: Category
  flashDir: 'up' | 'down' | null
  flashN: number
  isNew: boolean
}

const SYMBOLS: [string, number, Category][] = [
  ['SOUN', 6.84, 'Momentum'],
  ['MARA', 22.09, 'Momentum'],
  ['IONQ', 38.46, 'Unusual Vol'],
  ['ASTS', 27.93, 'Gappers'],
  ['RKLB', 24.31, 'Gappers'],
  ['PLTR', 66.21, 'Momentum'],
  ['SMCI', 33.77, 'Unusual Vol'],
  ['UPST', 74.6, 'Gappers'],
  ['HOOD', 35.9, 'Unusual Vol'],
  ['RIOT', 12.44, 'Momentum'],
  ['CVNA', 188.2, 'Halts'],
  ['FFIE', 3.12, 'Halts'],
  ['BBAI', 5.67, 'Gappers'],
  ['SOFI', 14.12, 'Unusual Vol'],
  ['GME', 27.55, 'Momentum'],
  ['DJT', 31.08, 'Unusual Vol'],
]

const FILTERS: ('All' | Category)[] = ['All', 'Momentum', 'Gappers', 'Unusual Vol', 'Halts']

let uid = 0
function makeRow(sym: string, price: number, cat: Category, isNew = false): Row {
  const chg = (Math.random() - 0.35) * 12
  return {
    id: `r${uid++}`,
    sym,
    price,
    chg,
    relVol: 1 + Math.random() * 9,
    float: 4 + Math.random() * 180,
    signal: chg > 4 ? 'BREAKOUT' : chg > 0 ? 'WATCH' : 'FADE',
    cat,
    flashDir: null,
    flashN: 0,
    isNew,
  }
}

function initialRows(): Row[] {
  return SYMBOLS.slice(0, 10).map(([s, p, c]) => makeRow(s, p, c))
}

function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={cn(
        'inline-block rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide',
        signal === 'BREAKOUT' && 'bg-pulse/10 text-pulse',
        signal === 'WATCH' && 'bg-amber-watch/10 text-amber-watch',
        signal === 'FADE' && 'bg-signal/10 text-signal',
      )}
    >
      {signal}
    </span>
  )
}

export default function LiveScannerPreview() {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [matches, setMatches] = useState(2847)
  const [alerts, setAlerts] = useState(12)
  const [latency, setLatency] = useState(14)
  const extraIdx = useRef(10)

  // Tick engine: update a random row every ~1.4s
  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) => {
        const next = [...prev]
        const i = Math.floor(Math.random() * next.length)
        const r = { ...next[i] }
        const delta = r.price * (Math.random() - 0.48) * 0.012
        r.price = Math.max(0.5, r.price + delta)
        r.chg += delta > 0 ? Math.random() * 0.4 : -Math.random() * 0.4
        r.relVol = Math.max(0.5, r.relVol + (Math.random() - 0.5) * 0.6)
        r.flashDir = delta >= 0 ? 'up' : 'down'
        r.flashN = r.flashN + 1
        r.isNew = false
        next[i] = r
        return next
      })
      setMatches((m) => m + Math.floor(Math.random() * 7) - 3)
    }, 1400)
    return () => clearInterval(id)
  }, [])

  // New alert row slides in every ~8s
  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) => {
        const [s, p, c] = SYMBOLS[extraIdx.current % SYMBOLS.length]
        extraIdx.current += 1
        const row = makeRow(s, p * (0.95 + Math.random() * 0.1), c, true)
        return [row, ...prev].slice(0, 12)
      })
      setAlerts((a) => a + 1)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  // Latency ticker
  useEffect(() => {
    const id = setInterval(() => setLatency(8 + Math.floor(Math.random() * 17)), 1500)
    return () => clearInterval(id)
  }, [])

  const visible = useMemo(
    () =>
      rows
        .filter((r) => filter === 'All' || r.cat === filter)
        .slice(0, 8),
    [rows, filter],
  )

  return (
    <div>
      {/* Header row */}
      <div className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div className="max-w-xl">
          <motion.p
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="label-eyebrow mb-4 text-pulse"
          >
            THE PRODUCT
          </motion.p>
          <motion.h2
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl font-bold tracking-tight md:text-5xl"
          >
            Your edge, streaming.
          </motion.h2>
          <motion.p
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-ink-secondary"
          >
            This is not a screenshot. The panel below runs the same tick engine
            as the full scanner — filters, signal badges and alerts included.
          </motion.p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-full border border-grid bg-steel px-3 py-1.5">
            <span className="live-dot" />
            <span className="font-mono text-[11px] font-medium tracking-wide text-pulse">
              LIVE FEED
            </span>
          </span>
          <span className="font-mono text-sm text-pulse tabular-nums">{latency}ms</span>
        </div>
      </div>

      {/* Terminal panel */}
      <motion.div
        initial={{ y: 64, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl border border-grid bg-carbon shadow-glow"
      >
        <span className="scanline-sweep" />

        {/* Chrome */}
        <div className="flex items-center gap-3 border-b border-grid px-5 py-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-grid" />
            <span className="h-2.5 w-2.5 rounded-full bg-grid" />
            <span className="h-2.5 w-2.5 rounded-full bg-grid" />
          </span>
          <span className="font-mono text-xs text-ink-muted">
            edgehawk — scanner v4.2
          </span>
          <span className="ml-1 inline-block h-3.5 w-1.5 animate-caret-blink bg-pulse/70" />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 border-b border-grid px-5 py-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md border px-3 py-1 font-mono text-xs transition-colors duration-200',
                filter === f
                  ? 'border-pulse/50 bg-pulse/10 text-pulse'
                  : 'border-grid bg-steel text-ink-secondary hover:border-pulse/30 hover:text-ink-primary',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="bg-steel">
                {['Symbol', 'Price', 'Chg%', 'RelVol', 'Float', 'Signal'].map((h) => (
                  <th
                    key={h}
                    className="label-eyebrow px-5 py-2.5 font-mono text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((r) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'h-10 border-b border-grid transition-colors hover:bg-steel',
                      r.isNew && 'bg-amber-watch/[0.07]',
                    )}
                  >
                    <td className="px-5 py-2">
                      <span
                        className={cn(
                          'border-l-2 pl-2 font-mono text-sm font-bold',
                          r.chg >= 0 ? 'border-pulse text-ink-primary' : 'border-signal text-ink-primary',
                        )}
                      >
                        {r.sym}
                      </span>
                    </td>
                    <td
                      key={r.flashN}
                      className={cn(
                        'px-5 py-2 font-mono text-sm text-ink-primary tabular-nums',
                        r.flashDir === 'up' && 'animate-tick-up',
                        r.flashDir === 'down' && 'animate-tick-down',
                      )}
                    >
                      {r.price.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-5 py-2 font-mono text-sm tabular-nums',
                        r.chg >= 0 ? 'text-pulse' : 'text-signal',
                      )}
                    >
                      {r.chg >= 0 ? '▲' : '▼'}
                      {Math.abs(r.chg).toFixed(2)}%
                    </td>
                    <td className="px-5 py-2 font-mono text-sm text-ice tabular-nums">
                      {r.relVol.toFixed(1)}x
                    </td>
                    <td className="px-5 py-2 font-mono text-sm text-ink-secondary tabular-nums">
                      {r.float.toFixed(1)}M
                    </td>
                    <td className="px-5 py-2">
                      <SignalBadge signal={r.signal} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-start justify-between gap-3 px-5 py-3 sm:flex-row sm:items-center">
          <span className="font-mono text-xs text-ink-muted tabular-nums">
            {matches.toLocaleString()} matches · {alerts} alerts in last 60s
          </span>
          <Link
            to="/scanner"
            className="group flex items-center gap-1.5 font-mono text-xs font-medium text-pulse hover:brightness-110"
          >
            Open full scanner
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
