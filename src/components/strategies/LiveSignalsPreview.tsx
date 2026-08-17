import { trpc } from '@/providers/trpc'
import type { ScanPreset } from '@contracts/market'
import { cn } from '@/lib/utils'

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex h-7 items-center gap-2">
          <div className="h-4 w-14 animate-pulse rounded bg-steel" style={{ animationDelay: `${i * 120}ms` }} />
          <div className="h-4 flex-1 animate-pulse rounded bg-steel/70" style={{ animationDelay: `${i * 120 + 60}ms` }} />
          <div className="h-4 w-12 animate-pulse rounded bg-steel" style={{ animationDelay: `${i * 120 + 120}ms` }} />
        </div>
      ))}
    </div>
  )
}

/**
 * Live "signals right now" preview for the flagship card.
 * Polls the scanner API every 8s; renders an elegant skeleton on
 * load or error so the page never breaks.
 */
export default function LiveSignalsPreview({ preset }: { preset: ScanPreset }) {
  const query = trpc.market.scan.useQuery(
    { filters: preset.filters, sort: preset.sort, limit: 3 },
    {
      refetchInterval: 8000,
      retry: 1,
      placeholderData: (prev) => prev,
    },
  )

  const rows = query.data?.rows ?? []
  const showSkeleton = (query.isLoading || query.isError) && rows.length === 0

  return (
    <div className="rounded-lg border border-grid bg-abyss/60 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-ink-muted">
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          SIGNALS RIGHT NOW
        </span>
        {query.data && (
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">
            {query.data.matched} MATCHED · {query.data.source === 'live' ? 'LIVE' : 'DEMO'}
          </span>
        )}
      </div>
      {showSkeleton ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="py-2 text-center font-mono text-[11px] text-ink-muted">
          NO MATCHES THIS SECOND — THE ENGINE WAITS.
        </p>
      ) : (
        <ul className="space-y-1">
          {rows.map((q) => {
            const up = q.changePct >= 0
            return (
              <li
                key={q.symbol}
                className="flex h-7 items-center gap-2 rounded px-1 transition-colors hover:bg-steel/60"
              >
                <span
                  className={cn(
                    'rounded border-l-2 bg-steel px-1.5 py-0.5 font-mono text-[11px] font-bold',
                    up ? 'border-pulse text-ink-primary' : 'border-signal text-ink-primary',
                  )}
                >
                  {q.symbol}
                </span>
                <span className="flex-1 truncate font-mono text-[11px] text-ink-muted">
                  {q.name}
                </span>
                <span className="font-mono text-[11px] text-ink-secondary tabular-nums">
                  {q.price.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'w-16 text-right font-mono text-[11px] font-medium tabular-nums',
                    up ? 'text-pulse' : 'text-signal',
                  )}
                >
                  {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
