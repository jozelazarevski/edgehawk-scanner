import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const STEPS = [
  {
    key: 'SCAN',
    title: 'SCAN',
    body: '5,412 symbols. 3.2M ticks per second. Every exchange, every dark pool print, every options sweep — ingested raw.',
  },
  {
    key: 'FILTER',
    title: 'FILTER',
    body: '73 signal engines score every tick against 12 years of pattern history. 99.4% of the market is noise. We delete it.',
  },
  {
    key: 'STRIKE',
    title: 'STRIKE',
    body: 'You get 6–12 qualified alerts a day. Entry, stop, target, and the statistical edge behind it — before the crowd sees the chart.',
  },
]

/**
 * Pinned scroll story (GSAP ScrollTrigger, 250vh pin).
 * Left: sticky step text that swaps on scroll. Right: radar visual that
 * progresses through 3 states (sweep → filtered → lock-on reticle).
 */
export default function EdgeStory() {
  const container = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: container.current,
        start: 'top top',
        end: '+=250%',
        pin: true,
        onUpdate: (self) => {
          const s = Math.min(2, Math.floor(self.progress * 3))
          setStep(s)
        },
      })
    },
    { scope: container },
  )

  return (
    <div ref={container} className="relative overflow-hidden bg-abyss">
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1280px] items-center gap-16 px-6 lg:px-12">
        {/* Step indicator */}
        <div className="relative hidden h-48 w-px bg-grid md:block">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              className={cn(
                'absolute -left-[5px] h-2.5 w-2.5 rounded-full border transition-all duration-300',
                i === step
                  ? 'scale-150 border-pulse bg-pulse shadow-glow'
                  : 'border-grid bg-steel',
              )}
              style={{ top: `${i * 50}%` }}
              aria-label={`Step ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Text column */}
        <div className="w-full md:w-[42%]">
          <p className="label-eyebrow mb-4 text-pulse">HOW THE EDGE WORKS</p>
          <div className="relative min-h-[220px]">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  'absolute inset-0 transition-all duration-500',
                  i === step
                    ? 'translate-y-0 opacity-100'
                    : i < step
                      ? '-translate-y-6 opacity-0'
                      : 'translate-y-6 opacity-0',
                )}
              >
                <span className="font-mono text-sm text-ink-muted">
                  0{i + 1} / 03
                </span>
                <h3 className="mt-2 font-display text-5xl font-bold tracking-tight text-ink-primary md:text-6xl">
                  {s.title}
                </h3>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-secondary">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar visual */}
        <div className="relative hidden flex-1 md:block">
          <div className="relative overflow-hidden rounded-2xl border border-grid bg-carbon">
            <span className="scanline-sweep" />
            <img
              src="/edge-radar.webp"
              alt="Edgehawk radar visualization"
              className={cn(
                'aspect-square w-full object-cover transition-all duration-700',
                step === 1 && 'scale-110 brightness-75',
                step === 2 && 'scale-125',
              )}
            />
            {/* Rotating sweep arm */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 transition-opacity duration-500',
                step === 2 ? 'opacity-0' : 'opacity-100',
              )}
            >
              <div
                className="absolute inset-0 animate-[spin_4s_linear_infinite]"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(0,230,140,0.35), transparent 18%)',
                }}
              />
            </div>
            {/* Lock-on reticle (step 3) */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-500',
                step === 2 ? 'scale-100 opacity-100' : 'scale-125 opacity-0',
              )}
            >
              <div className="relative h-40 w-40">
                {[
                  'top-0 left-0 border-t-2 border-l-2',
                  'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2',
                  'bottom-0 right-0 border-b-2 border-r-2',
                ].map((pos) => (
                  <span key={pos} className={cn('absolute h-8 w-8 border-pulse', pos)} />
                ))}
                <span className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse shadow-glow" />
                <span className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-pulse/60" />
              </div>
            </div>
            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-grid bg-carbon/80 px-4 py-2 backdrop-blur-sm">
              <span className="font-mono text-[11px] text-ink-muted">
                RADAR / {STEPS[step].key}
              </span>
              <span className="font-mono text-[11px] text-pulse tabular-nums">
                {step === 0 ? '5,412 TRACKED' : step === 1 ? '61 QUALIFIED' : 'LOCK: SOUN +14.3%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
