import { memo } from 'react'
import { cn } from '@/lib/utils'

export interface TapeSymbol {
  sym: string
  price: number
  chg: number
}

export const TAPE_SYMBOLS: TapeSymbol[] = [
  { sym: 'AAPL', price: 214.32, chg: 1.24 },
  { sym: 'NVDA', price: 131.88, chg: 2.87 },
  { sym: 'TSLA', price: 248.5, chg: -1.12 },
  { sym: 'AMD', price: 122.44, chg: 0.86 },
  { sym: 'MSFT', price: 428.15, chg: 0.42 },
  { sym: 'SOUN', price: 6.84, chg: 14.32 },
  { sym: 'PLTR', price: 66.21, chg: 3.05 },
  { sym: 'SMCI', price: 33.77, chg: -4.18 },
  { sym: 'MARA', price: 22.09, chg: 5.61 },
  { sym: 'GME', price: 27.55, chg: -2.34 },
  { sym: 'HOOD', price: 35.9, chg: 1.77 },
  { sym: 'SOFI', price: 14.12, chg: 2.19 },
  { sym: 'IONQ', price: 38.46, chg: 6.02 },
  { sym: 'RKLB', price: 24.31, chg: 4.44 },
  { sym: 'CRWD', price: 342.08, chg: -0.68 },
  { sym: 'ARM', price: 148.72, chg: 2.31 },
  { sym: 'COIN', price: 264.19, chg: 3.88 },
  { sym: 'RIVN', price: 13.27, chg: -1.95 },
  { sym: 'ASTS', price: 27.93, chg: 7.26 },
  { sym: 'UPST', price: 74.6, chg: -3.41 },
  { sym: 'DDOG', price: 152.35, chg: 1.09 },
  { sym: 'NET', price: 108.44, chg: 0.97 },
  { sym: 'SNOW', price: 172.81, chg: -0.54 },
  { sym: 'SHOP', price: 106.23, chg: 1.63 },
]

function TapeItem({ item, flashUp }: { item: TapeSymbol; flashUp: boolean }) {
  const up = item.chg >= 0
  return (
    <span
      className={cn(
        'flex items-center gap-2 px-5 font-mono text-[13px]',
        flashUp ? 'animate-tick-up' : 'animate-tick-down',
      )}
    >
      <span className="font-bold text-ink-primary">{item.sym}</span>
      <span className="text-ink-secondary tabular-nums">{item.price.toFixed(2)}</span>
      <span className={cn('tabular-nums', up ? 'text-pulse' : 'text-signal')}>
        {up ? '▲' : '▼'}
        {Math.abs(item.chg).toFixed(2)}%
      </span>
    </span>
  )
}

/** Full-bleed infinite marquee ticker tape. Pure CSS scroll, pauses on hover. */
function TickerTape({ className }: { className?: string }) {
  const row = TAPE_SYMBOLS.map((s, i) => (
    <TapeItem key={s.sym} item={s} flashUp={i % 7 === 3} />
  ))
  return (
    <div
      className={cn(
        'tape-mask relative h-12 overflow-hidden border-y border-grid bg-carbon',
        className,
      )}
    >
      <span className="absolute top-0 left-0 right-0 h-px bg-pulse" />
      <div className="flex h-full w-max animate-marquee items-center hover:[animation-play-state:paused]">
        <div className="flex items-center divide-x divide-grid/60">{row}</div>
        <div className="flex items-center divide-x divide-grid/60" aria-hidden>
          {row}
        </div>
      </div>
    </div>
  )
}

export default memo(TickerTape)
