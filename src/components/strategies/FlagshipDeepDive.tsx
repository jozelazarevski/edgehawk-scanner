import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { SCAN_PRESETS } from '@contracts/market'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const PRESET = SCAN_PRESETS.find((p) => p.id === 'momentum-breakout') ?? SCAN_PRESETS[0]

const ACTS = [
  {
    key: 'ACT I',
    title: 'THE COIL',
    caption: 'Volatility contracts. Volume dries up. The crowd looks away.',
  },
  {
    key: 'ACT II',
    title: 'THE IGNITION',
    caption: 'First tick through the level on 8× relative volume. The engine fires.',
  },
  {
    key: 'ACT III',
    title: 'THE RIDE',
    caption: 'Entry, stop, target — delivered as an alert in 14ms. You execute.',
  },
]

interface StatDef {
  label: string
  target: number
  decimals: number
  prefix?: string
  suffix?: string
  threshold: number
}

const STATS: StatDef[] = [
  { label: 'Win rate', target: PRESET.winRate, decimals: 0, suffix: '%', threshold: 0.12 },
  { label: 'Avg move', target: PRESET.avgMove, decimals: 1, prefix: '+', suffix: '%', threshold: 0.35 },
  { label: 'Signals / day', target: 8, decimals: 0, threshold: 0.58 },
  { label: 'Max drawdown', target: 6.2, decimals: 1, suffix: '%', threshold: 0.8 },
]

/** Deterministic jagged rising equity-curve path (viewBox 560x240). */
const EQUITY_PATH = (() => {
  const pts: Array<[number, number]> = []
  const n = 28
  let y = 200
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 560
    if (i > 0) {
      const drift = -6.4 // upward bias (SVG y grows downward)
      const noise = (rand() - 0.42) * 22
      y = Math.min(214, Math.max(24, y + drift + noise))
    }
    pts.push([x, y])
  }
  return pts.map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ')
})()

/** Shared draw-in style for scrubbed/stepped SVG strokes (pathLength normalized to 1). */
function drawStyle(active: boolean, delayMs = 0): React.CSSProperties {
  return {
    strokeDasharray: 1,
    strokeDashoffset: active ? 0 : 1,
    opacity: active ? 1 : 0,
    transition: `stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1) ${delayMs}ms, opacity 0.4s ease ${delayMs}ms`,
  }
}

/** SVG annotation overlays keyed by act index. viewBox matches strategy-momentum.png (800x600). */
function Annotations({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 0 800 600"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* ACT I — THE COIL: dashed amber resistance + tightening bracket */}
      <g style={{ opacity: step === 0 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <line
          x1="70" y1="180" x2="730" y2="180"
          stroke="#FFB224" strokeWidth="2.5" strokeDasharray="10 8"
          pathLength={1}
          style={drawStyle(step === 0)}
        />
        <text x="726" y="166" textAnchor="end" fill="#FFB224" fontSize="20" fontFamily="'JetBrains Mono', monospace" fontWeight="500">
          RESISTANCE
        </text>
        {/* converging wedge bracket */}
        <path
          d="M120,420 L430,205"
          fill="none" stroke="#8A94A6" strokeWidth="2"
          pathLength={1}
          style={drawStyle(step === 0, 200)}
        />
        <path
          d="M120,480 L430,215"
          fill="none" stroke="#8A94A6" strokeWidth="2"
          pathLength={1}
          style={drawStyle(step === 0, 320)}
        />
        <path
          d="M120,420 L120,480"
          fill="none" stroke="#8A94A6" strokeWidth="2"
          pathLength={1}
          style={drawStyle(step === 0, 120)}
        />
      </g>

      {/* ACT II — THE IGNITION: arrow + RelVol callout + glow ring */}
      <g style={{ opacity: step === 1 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <circle
          cx="512" cy="150" r="52"
          fill="none" stroke="#00E68C" strokeWidth="2.5"
          pathLength={1}
          style={{
            ...drawStyle(step === 1),
            filter: 'drop-shadow(0 0 12px rgba(0,230,140,0.7))',
          }}
        />
        <path
          d="M590,330 L520,205"
          fill="none" stroke="#00E68C" strokeWidth="4" strokeLinecap="round"
          pathLength={1}
          style={drawStyle(step === 1, 150)}
        />
        <path
          d="M505,222 L520,198 L538,216"
          fill="none" stroke="#00E68C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          pathLength={1}
          style={drawStyle(step === 1, 420)}
        />
        <g
          style={{
            opacity: step === 1 ? 1 : 0,
            transform: step === 1 ? 'scale(1)' : 'scale(0.85)',
            transformBox: 'fill-box',
            transformOrigin: 'center',
            transition: 'opacity 0.4s ease 0.5s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.5s',
          }}
        >
          <rect x="560" y="330" width="180" height="48" rx="8" fill="#0A0E14" stroke="#00E68C" strokeOpacity="0.5" />
          <text x="650" y="361" textAnchor="middle" fill="#00E68C" fontSize="24" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
            8.2× RelVol
          </text>
        </g>
      </g>

      {/* ACT III — THE RIDE: trailing stop stepped line + target flag */}
      <g style={{ opacity: step === 2 ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <path
          d="M470,320 L540,320 L540,262 L610,262 L610,205 L680,205 L680,148"
          fill="none" stroke="#00E68C" strokeWidth="3"
          pathLength={1}
          style={{
            ...drawStyle(step === 2),
            filter: 'drop-shadow(0 0 8px rgba(0,230,140,0.5))',
          }}
        />
        <text x="472" y="348" fill="#8A94A6" fontSize="17" fontFamily="'JetBrains Mono', monospace">
          TRAILING STOP
        </text>
        <g
          style={{
            opacity: step === 2 ? 1 : 0,
            transform: step === 2 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease 0.55s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s',
          }}
        >
          <line x1="690" y1="60" x2="690" y2="140" stroke="#E8EDF4" strokeWidth="3" />
          <path d="M690,60 L756,78 L690,96 Z" fill="#00E68C" />
          <text x="686" y="130" textAnchor="end" fill="#E8EDF4" fontSize="17" fontFamily="'JetBrains Mono', monospace" fontWeight="500">
            TARGET
          </text>
        </g>
      </g>
    </svg>
  )
}

/**
 * Section 2 — Flagship deep-dive: GSAP-pinned 3-act scroll story.
 * Left: name, scroll-scrubbed equity curve, threshold count-up stats.
 * Right: artwork with scroll-scrubbed SVG annotations + crossfading captions.
 * GSAP is isolated to this component (no Framer Motion inside).
 */
export default function FlagshipDeepDive() {
  const container = useRef<HTMLDivElement>(null)
  const curveRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const statRefs = useRef<Array<HTMLSpanElement | null>>([])
  const firedRef = useRef<boolean[]>(STATS.map(() => false))
  const [step, setStep] = useState(0)

  useGSAP(
    () => {
      const curve = curveRef.current
      const fill = fillRef.current
      if (!curve || !fill) return
      const len = curve.getTotalLength()
      curve.style.strokeDasharray = String(len)
      curve.style.strokeDashoffset = String(len)
      fill.style.opacity = '0'

      const tweens: gsap.core.Tween[] = []
      const fireStat = (i: number) => {
        const el = statRefs.current[i]
        if (!el) return
        const s = STATS[i]
        const proxy = { v: 0 }
        tweens.push(
          gsap.to(proxy, {
            v: s.target,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = `${s.prefix ?? ''}${proxy.v.toFixed(s.decimals)}${s.suffix ?? ''}`
            },
          }),
        )
      }

      ScrollTrigger.create({
        trigger: container.current,
        start: 'top top',
        end: '+=220%',
        pin: true,
        onUpdate: (self) => {
          const p = self.progress
          curve.style.strokeDashoffset = String(len * (1 - p))
          fill.style.opacity = String(Math.min(1, p * 1.4) * 0.35)
          const s = Math.min(2, Math.floor(p * 3))
          setStep(s)
          STATS.forEach((st, i) => {
            if (!firedRef.current[i] && p >= st.threshold) {
              firedRef.current[i] = true
              fireStat(i)
            }
          })
        },
      })

      return () => {
        tweens.forEach((t) => t.kill())
      }
    },
    { scope: container },
  )

  return (
    <section ref={container} className="relative overflow-hidden bg-abyss">
      <div className="dot-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1280px] flex-col items-center justify-center gap-10 px-6 py-16 lg:flex-row lg:gap-16 lg:px-12">
        {/* Left column */}
        <div className="w-full lg:w-1/2">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <p className="label-eyebrow text-pulse">FLAGSHIP ENGINE · 01 / 09</p>
          </div>
          <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.0] tracking-[-0.02em] text-ink-primary md:text-[56px]">
            MOMENTUM
            <br />
            BREAKOUT
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-secondary">
            {PRESET.tagline}. {PRESET.description}
          </p>

          {/* Equity curve — stroke scrubs with scroll progress */}
          <div className="mt-8 overflow-hidden rounded-xl border border-grid bg-carbon">
            <div className="flex items-center justify-between border-b border-grid px-4 py-2">
              <span className="font-mono text-[11px] tracking-wide text-ink-muted">
                EQUITY CURVE / 12YR WALK-FORWARD
              </span>
              <span className="font-mono text-[11px] text-pulse tabular-nums">+312.4%</span>
            </div>
            <svg viewBox="0 0 560 240" className="block w-full">
              {/* grid lines */}
              {[60, 120, 180].map((y) => (
                <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#161F2C" strokeWidth="1" />
              ))}
              <path
                ref={fillRef}
                d={`${EQUITY_PATH} L560,240 L0,240 Z`}
                fill="url(#eqFill)"
                stroke="none"
              />
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E68C" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00E68C" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                ref={curveRef}
                d={EQUITY_PATH}
                fill="none"
                stroke="#00E68C"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,230,140,0.45))' }}
              />
            </svg>
          </div>

          {/* Stat stack — numbers count up past scroll thresholds */}
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-grid bg-grid sm:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={s.label} className="bg-carbon px-4 py-4">
                <span
                  ref={(el) => {
                    statRefs.current[i] = el
                  }}
                  className="font-mono text-xl font-bold text-ink-primary tabular-nums md:text-2xl"
                >
                  {s.prefix ?? ''}{(0).toFixed(s.decimals)}
                  {s.suffix ?? ''}
                </span>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — annotated artwork */}
        <div className="w-full lg:w-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-grid bg-carbon">
            <span className="scanline-sweep" />
            <div className="relative">
              <img
                src="/strategy-momentum.webp"
                alt="Momentum Breakout strategy artwork"
                className={cn(
                  'aspect-[4/3] w-full object-cover transition-all duration-700',
                  step === 1 && 'scale-[1.04]',
                  step === 2 && 'scale-[1.08] brightness-110',
                )}
              />
              <Annotations step={step} />
              {/* Act caption */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-grid bg-carbon/85 px-5 py-4 backdrop-blur-sm">
                <div className="relative min-h-[64px]">
                  {ACTS.map((a, i) => (
                    <div
                      key={a.key}
                      className={cn(
                        'absolute inset-0 transition-all duration-500',
                        i === step
                          ? 'translate-y-0 opacity-100'
                          : i < step
                            ? '-translate-y-6 opacity-0'
                            : 'translate-y-6 opacity-0',
                      )}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[11px] text-pulse">{a.key}</span>
                        <span className="font-display text-base font-bold tracking-wide text-ink-primary">
                          {a.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-snug text-ink-secondary">{a.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Act progress ticks */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {ACTS.map((a, i) => (
              <span
                key={a.key}
                className={cn(
                  'h-1 rounded-full transition-all duration-400',
                  i === step ? 'w-10 bg-pulse shadow-glow' : 'w-4 bg-grid',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
