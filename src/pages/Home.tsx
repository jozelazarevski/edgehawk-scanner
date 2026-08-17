import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  ArrowRight,
  Cpu,
  Layers,
  Pause,
  Play,
  Radar,
  RefreshCw,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import TickerTape from '@/components/TickerTape'
import LiveScannerPreview from '@/components/home/LiveScannerPreview'
import EdgeStory from '@/components/home/EdgeStory'
import { cn } from '@/lib/utils'

const HeroParticles = lazy(() => import('@/components/home/HeroParticles'))

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/* ---------------------------------- utils --------------------------------- */

function useWebGLSupport() {
  return useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  }, [])
}

/** Standard entrance reveal: y 32 → 0, fade, ease-out, 15% viewport trigger. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ y: 32, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Character-level split: chars slide up from clipped masks. */
function SplitChars({
  text,
  className,
  delay = 0,
  stagger = 0.05,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * stagger, ease: EASE }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** Word-level split for longer headlines (reveals on scroll). */
function SplitWords({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
          >
            {w}
          </motion.span>
          <span>&nbsp;</span>
        </span>
      ))}
    </span>
  )
}

/** Magnetic pull wrapper: content translates toward cursor, springs back. */
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 250, damping: 18 })
  const sy = useSpring(y, { stiffness: 250, damping: 18 })

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        x.set(Math.max(-8, Math.min(8, dx * 0.25)))
        y.set(Math.max(-8, Math.min(8, dy * 0.25)))
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/** Count-up number, triggered on scroll entry. tabular-nums, no layout shift. */
function CountUp({
  end,
  decimals = 0,
  suffix = '',
  className,
}: {
  end: number
  decimals?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  useEffect(() => {
    if (!inView || !ref.current) return
    const controls = animate(0, end, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix
      },
    })
    return () => controls.stop()
  }, [inView, end, decimals, suffix])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {(0).toFixed(decimals) + suffix}
    </span>
  )
}

/* ---------------------------------- hero ---------------------------------- */

function HeroEyebrow() {
  const [count, setCount] = useState(5412)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 4))
      setFlash((f) => f + 1)
    }, 2000)
    return () => clearInterval(id)
  }, [])
  return (
    <motion.p
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
      className="label-eyebrow flex items-center gap-2 text-pulse"
    >
      <span className="live-dot" />
      LIVE ·{' '}
      <span key={flash} className="animate-tick-up rounded px-1 tabular-nums">
        {count.toLocaleString()}
      </span>{' '}
      SYMBOLS SCANNING NOW
    </motion.p>
  )
}

function DemoDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl border-grid bg-carbon p-0">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <span className="scanline-sweep" />
          <div className="dot-grid absolute inset-0 opacity-40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-pulse/40 bg-pulse/10">
              <Play className="h-6 w-6 text-pulse" />
            </span>
            <p className="font-mono text-sm text-ink-secondary">
              EDGEHAWK_WALKTHROUGH.MP4 — 90s
            </p>
            <p className="font-mono text-xs text-ink-muted">
              Demo walkthrough placeholder · simulated UI loop
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Hero() {
  const webgl = useWebGLSupport()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const terminalY = useTransform(scrollY, [0, 600], [120, 0])

  return (
    <section
      ref={heroRef}
      className="relative -mt-16 flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden pt-24 pb-16"
      style={{ minHeight: 'max(720px, 100dvh)' }}
    >
      {/* Background layers */}
      {webgl ? (
        <Suspense fallback={<div className="dot-grid absolute inset-0 opacity-40" />}>
          <HeroParticles />
        </Suspense>
      ) : (
        <div className="dot-grid absolute inset-0 opacity-40" />
      )}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(0,230,140,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <HeroEyebrow />
        <h1
          className="mt-6 font-display font-bold leading-[0.95] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(48px, 8vw, 84px)' }}
        >
          <SplitChars text="SEE THE MOVE" delay={0.5} className="text-ink-primary" />
          <br />
          <span style={{ textShadow: '0 0 32px rgba(0,230,140,0.35)' }}>
            <SplitChars text="BEFORE IT MOVES." delay={0.95} stagger={0.04} className="text-pulse" />
          </span>
        </h1>
        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
          className="mt-6 max-w-[560px] text-lg leading-relaxed text-ink-secondary"
        >
          Edgehawk scans every tick on every US exchange in realtime — volume
          anomalies, momentum ignition, unusual options flow — and surfaces only
          the setups with statistical edge.
        </motion.p>
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.22, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Magnetic>
            <Link
              to="/scanner"
              className="btn-shine animate-glow-pulse inline-flex items-center gap-2 rounded-lg bg-pulse px-6 py-3 text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
            >
              Launch the Live Scanner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
          <Magnetic>
            <span>
              <DemoDialog>
                <button className="btn-shine inline-flex items-center gap-2 rounded-lg border border-grid px-6 py-3 text-sm font-medium text-ink-primary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06]">
                  <Play className="h-4 w-4" />
                  Watch 90s Demo
                </button>
              </DemoDialog>
            </span>
          </Magnetic>
        </motion.div>
      </div>

      {/* Terminal mockup */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.3, ease: EASE }}
        className="relative z-10 mt-16 w-full max-w-[1100px] px-6"
      >
        <motion.div style={{ y: terminalY, perspective: 1200 }}>
          <div style={{ transform: 'rotateX(8deg)', transformStyle: 'preserve-3d' }}>
            <div
              className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: 'rgba(0,230,140,0.18)' }}
            />
            <img
              src="/hero-terminal.webp"
              alt="Edgehawk live scanner terminal"
              className="w-full rounded-xl border border-grid shadow-2xl"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ------------------------------- features --------------------------------- */

interface Feature {
  icon: LucideIcon
  title: string
  body: string
  stat: string
  violet?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Radar,
    title: 'Volume Anomaly',
    body: 'Relative volume spikes detected tick-by-tick against 20-day profiles.',
    stat: 'avg lead time 47s',
  },
  {
    icon: Zap,
    title: 'Momentum Ignition',
    body: 'Catches the first candle of a move, not the fifth.',
    stat: '0.8s tick-to-alert',
  },
  {
    icon: Layers,
    title: 'Unusual Options Flow',
    body: 'Sweeps, blocks, and dark pool prints scored by size vs. open interest.',
    stat: '$2.1B tracked daily',
  },
  {
    icon: Pause,
    title: 'Halt & Circuit Breaker',
    body: 'LULD halts flagged with resumption odds and volatility context.',
    stat: '100% halt coverage',
  },
  {
    icon: RefreshCw,
    title: 'Float Rotation',
    body: 'Alerts when turnover exceeds float — the squeeze precondition.',
    stat: 'rotations ≥1.0 flagged',
  },
  {
    icon: Cpu,
    title: 'Quant Score',
    body: 'Every alert carries a 0–100 statistical edge score from our pattern engine.',
    stat: '12y pattern history',
    violet: true,
  },
]

function FeatureCard({ f, i }: { f: Feature; i: number }) {
  const Icon = f.icon
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
      className={cn(
        'group rounded-xl border border-grid bg-carbon p-8 transition-all duration-300 hover:-translate-y-1',
        f.violet
          ? 'hover:border-quant/40 hover:shadow-[0_8px_32px_#8B7CFF14]'
          : 'hover:border-pulse/30 hover:shadow-glow-lg',
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-11 w-11 items-center justify-center rounded-lg border transition-transform duration-500 group-hover:rotate-[360deg]',
          f.violet
            ? 'border-quant/30 bg-quant/10 text-quant'
            : 'border-pulse/30 bg-pulse/10 text-pulse',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl font-medium tracking-tight">{f.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.body}</p>
      <p
        className={cn(
          'mt-5 font-mono text-xs tabular-nums',
          f.violet ? 'text-quant' : 'text-pulse',
        )}
      >
        {f.stat}
      </p>
    </motion.div>
  )
}

function FeatureGrid() {
  return (
    <section className="relative py-24">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <p className="label-eyebrow mb-4 text-pulse">SIGNAL ENGINES</p>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Built like an institution's desk.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- stats band ------------------------------- */

const STATS: { end: number; decimals: number; suffix: string; label: string }[] = [
  { end: 3.2, decimals: 1, suffix: 'M', label: 'TICKS / SEC INGESTED' },
  { end: 14, decimals: 0, suffix: 'ms', label: 'MEDIAN ALERT LATENCY' },
  { end: 99.4, decimals: 1, suffix: '%', label: 'NOISE FILTERED' },
  { end: 12, decimals: 0, suffix: 'yr', label: 'PATTERN HISTORY' },
]

function StatsBand() {
  return (
    <motion.section
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="border-y border-grid bg-carbon"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 divide-grid px-6 py-16 sm:grid-cols-4 sm:divide-x lg:px-12">
        {STATS.map((s) => (
          <div key={s.label} className="px-6 py-4 text-center sm:py-0">
            <CountUp
              end={s.end}
              decimals={s.decimals}
              suffix={s.suffix}
              className="font-mono text-[32px] font-bold leading-none text-pulse"
            />
            <p className="label-eyebrow mt-3 text-ink-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

/* ----------------------------- strategies teaser --------------------------- */

const STRATEGIES = [
  {
    img: '/strategy-momentum.webp',
    name: 'Momentum Breakout',
    desc: 'First-candle entries on volume-confirmed range breaks.',
    win: '61.2%',
    avgR: '2.4R',
    perDay: '4.1',
    score: 87,
  },
  {
    img: '/strategy-reversal.webp',
    name: 'Capitulation Reversal',
    desc: 'Climax-sell exhaustion reversed off cyan support zones.',
    win: '58.7%',
    avgR: '2.9R',
    perDay: '2.3',
    score: 82,
  },
  {
    img: '/strategy-gap.webp',
    name: 'Gap Hunter',
    desc: 'Overnight gaps with pre-market continuation flow.',
    win: '64.5%',
    avgR: '1.8R',
    perDay: '5.6',
    score: 91,
  },
]

function StrategiesTeaser() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label-eyebrow mb-4 text-pulse">PLAYBOOKS</p>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Nine engines. One edge.
            </h2>
          </div>
          <Link
            to="/strategies"
            className="btn-shine rounded-lg border border-grid px-5 py-2.5 text-sm font-medium text-ink-primary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06]"
          >
            Browse all strategies →
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STRATEGIES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ y: 48, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className="group overflow-hidden rounded-xl border border-grid bg-carbon transition-all duration-300 hover:-translate-y-1 hover:border-pulse/30 hover:shadow-glow-lg"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={s.img}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-quant bg-abyss/80 font-mono text-xs font-bold text-quant backdrop-blur-sm">
                  {s.score}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-medium tracking-tight">
                    {s.name}
                  </h3>
                  <span className="flex items-center gap-1 font-mono text-xs text-pulse opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2">
                    View playbook →
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-secondary">{s.desc}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-grid pt-4 font-mono text-xs tabular-nums">
                  <span className="text-pulse">{s.win} win</span>
                  <span className="text-ink-secondary">{s.avgR} avg</span>
                  <span className="text-ink-secondary">{s.perDay}/day</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- testimonials ------------------------------ */

const QUOTES = [
  {
    quote:
      'Edgehawk flagged the SOUN squeeze 40 seconds before my old scanner. That\u2019s the whole game.',
    name: 'Marcus Chen',
    handle: '@chenscalps',
    avatar: '/avatar-1.webp',
    pnl: '+38.2% YTD',
  },
  {
    quote:
      'I trade two hours a day. The Gap Hunter playbook is basically my entire morning routine now.',
    name: 'Dana Whitfield',
    handle: '@dwhit_swings',
    avatar: '/avatar-2.webp',
    pnl: '+24.6% YTD',
  },
  {
    quote:
      'The quant score killed my FOMO trades. If it\u2019s under 70, I don\u2019t touch it. My equity curve thanks me.',
    name: 'Andre Volkov',
    handle: '@volkovquant',
    avatar: '/avatar-3.webp',
    pnl: '+51.9% YTD',
  },
]

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <Reveal>
          <p className="label-eyebrow mb-4 text-pulse">DESK TALK</p>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Traders who stopped guessing.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.figure
              key={q.handle}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
              className="group relative overflow-hidden rounded-xl border border-grid bg-carbon p-8 transition-all duration-300 hover:-translate-y-1 hover:border-pulse/30"
            >
              <span className="pointer-events-none absolute -top-4 right-4 font-display text-[120px] leading-none text-grid transition-transform duration-300 group-hover:-translate-y-1">
                &ldquo;
              </span>
              <blockquote className="relative text-lg leading-relaxed text-ink-primary">
                {q.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img
                  src={q.avatar}
                  alt={q.name}
                  className="animate-ring-pulse h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-ink-primary">{q.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{q.handle}</p>
                </div>
                <span className="ml-auto text-right">
                  <span className="block font-mono text-sm font-bold text-pulse tabular-nums">
                    {q.pnl}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-ink-muted">
                    verified member result
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- final CTA -------------------------------- */

function FinalCTA() {
  const [online, setOnline] = useState(12400)
  useEffect(() => {
    const id = setInterval(
      () => setOnline((n) => n + Math.floor(Math.random() * 9) - 4),
      2500,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(0,230,140,0.1) 0%, transparent 60%)',
        }}
      />
      {/* Horizontal scan-line sweeping left↔right */}
      <motion.div
        className="pointer-events-none absolute top-0 bottom-0 w-px"
        style={{ background: 'rgba(0,230,140,0.5)', opacity: 0.08 }}
        animate={{ left: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6 text-center lg:px-12">
        <h2
          className="font-display font-bold leading-none tracking-[-0.02em]"
          style={{ fontSize: 'clamp(40px, 6.5vw, 64px)' }}
        >
          <SplitWords text="THE EDGE IS REALTIME." />
        </h2>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-5 max-w-md text-lg text-ink-secondary">
            Free tier forever. No credit card. Your first alert in under 60 seconds.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/scanner"
              className="btn-shine animate-glow-pulse inline-flex items-center gap-2 rounded-lg bg-pulse px-8 py-4 text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
            >
              Launch the Scanner
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="font-mono text-xs text-ink-muted tabular-nums">
              4.2 · {online.toLocaleString()} traders online now
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* --------------------------------- page ----------------------------------- */

export default function Home() {
  return (
    <>
      <Hero />
      <TickerTape />
      <section className="py-32">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
          <LiveScannerPreview />
        </div>
      </section>
      <EdgeStory />
      <FeatureGrid />
      <StatsBand />
      <StrategiesTeaser />
      <Testimonials />
      <FinalCTA />
    </>
  )
}
