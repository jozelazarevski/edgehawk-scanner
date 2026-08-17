import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReleaseCategory } from './releases'
import { CATEGORY_COLORS } from './releases'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export type Filter = 'ALL' | ReleaseCategory

const FILTERS: { value: Filter; color: string }[] = [
  { value: 'ALL', color: '#E8EDF4' },
  { value: 'ENGINE', color: CATEGORY_COLORS.ENGINE },
  { value: 'FEED', color: CATEGORY_COLORS.FEED },
  { value: 'UI', color: CATEGORY_COLORS.UI },
  { value: 'FIX', color: CATEGORY_COLORS.FIX },
  { value: 'RETIRED', color: CATEGORY_COLORS.RETIRED },
]

export default function FilterChips({
  active,
  onChange,
}: {
  active: Filter
  onChange: (filter: Filter) => void
}) {
  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.7 }}
      className="sticky top-16 z-30 border-b border-grid bg-abyss/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-6 py-3 lg:px-12">
        <span className="mr-1 hidden shrink-0 font-mono text-[10px] tracking-[0.14em] text-ink-muted sm:inline">
          FILTER //
        </span>
        {FILTERS.map((f) => {
          const isActive = active === f.value
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(f.value)}
              style={
                isActive
                  ? {
                      color: f.color,
                      borderColor: `${f.color}99`,
                      backgroundColor: `${f.color}14`,
                    }
                  : undefined
              }
              className={cn(
                'shrink-0 rounded-md border px-3 py-1.5 font-mono text-xs font-medium tracking-wide transition-colors duration-200',
                !isActive &&
                  'border-grid bg-transparent text-ink-secondary hover:border-ink-muted hover:text-ink-primary',
              )}
            >
              {f.value}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
