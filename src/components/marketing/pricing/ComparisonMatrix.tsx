import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

type Cell = string | true | null

interface MatrixRow {
  feature: string
  cells: [Cell, Cell, Cell]
}

const GROUPS: { label: string; rows: MatrixRow[] }[] = [
  {
    label: 'DATA',
    rows: [
      { feature: 'Data delay', cells: ['15m', '0ms', '0ms'] },
      { feature: 'Symbols scanned', cells: ['2,000', '5,412', '5,412'] },
    ],
  },
  {
    label: 'SCANNING',
    rows: [
      { feature: 'Preset engines', cells: ['3', '9', '9'] },
      { feature: 'Custom filters', cells: [null, true, true] },
      { feature: 'Quant Score', cells: [null, true, true] },
      { feature: 'Heatmap view', cells: [null, true, true] },
      { feature: 'Options flow', cells: [null, 'summary', 'full'] },
    ],
  },
  {
    label: 'ALERTS',
    rows: [
      { feature: 'Alerts per day', cells: ['10', '∞', '∞'] },
      { feature: 'SMS alerts', cells: [null, true, true] },
    ],
  },
  {
    label: 'PLATFORM',
    rows: [
      { feature: 'API calls per day', cells: [null, '1k', '50k'] },
      { feature: 'Seats', cells: ['1', '1', '5'] },
      { feature: 'Support', cells: ['community', 'email', 'dedicated'] },
    ],
  },
]

const TIER_HEADERS = ['SCOUT', 'PRO', 'DESK']

function MatrixCell({ cell, pro }: { cell: Cell; pro: boolean }) {
  return (
    <td
      className={cn(
        'px-5 py-3 font-mono text-sm tabular-nums',
        pro && 'bg-pulse/[0.04]',
      )}
    >
      {cell === null ? (
        <span className="text-ink-muted">—</span>
      ) : cell === true ? (
        <Check className="h-4 w-4 text-pulse" />
      ) : (
        <span className="text-ink-primary">{cell}</span>
      )}
    </td>
  )
}

export default function ComparisonMatrix() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1000px] px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center font-display text-3xl font-bold tracking-[-0.01em] text-ink-primary md:text-4xl"
        >
          Every feature, on the tape.
        </motion.h2>

        <motion.div
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mt-10 overflow-x-auto rounded-xl border border-grid"
        >
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-steel">
                <th className="label-eyebrow px-5 py-3.5 font-semibold text-ink-muted">
                  FEATURE
                </th>
                {TIER_HEADERS.map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'label-eyebrow px-5 py-3.5 font-semibold',
                      i === 1 ? 'bg-pulse/[0.04] text-pulse' : 'text-ink-secondary',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => (
                <Fragment key={group.label}>
                  <tr className="border-t border-grid bg-steel/60">
                    <td
                      colSpan={4}
                      className="label-eyebrow px-5 py-2.5 text-ink-secondary"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.feature}
                      className="h-10 border-t border-grid transition-colors duration-150 hover:bg-steel/70"
                    >
                      <td className="px-5 py-3 text-sm text-ink-secondary">
                        {row.feature}
                      </td>
                      {row.cells.map((cell, ci) => (
                        <MatrixCell key={ci} cell={cell} pro={ci === 1} />
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
