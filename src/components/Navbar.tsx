import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/scanner', label: 'Scanner' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/academy', label: 'Academy' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/changelog', label: 'Changelog' },
]

function useUtcClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function marketsOpen(now: Date) {
  const day = now.getUTCDay()
  if (day === 0 || day === 6) return false
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes()
  return mins >= 13 * 60 + 30 && mins < 20 * 60
}

function UtcClock() {
  const now = useUtcClock()
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')
  return (
    <span className="font-mono text-xs text-ink-muted tabular-nums">
      {hh}:{mm}:{ss} UTC
    </span>
  )
}

function MarketPill() {
  const now = useUtcClock()
  const open = marketsOpen(now)
  return (
    <span className="hidden items-center gap-2 rounded-full border border-grid bg-steel px-3 py-1 lg:flex">
      <span
        className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-pulse' : 'bg-ink-muted')}
      />
      <span
        className={cn(
          'font-mono text-[11px] font-medium tracking-wide',
          open ? 'text-pulse' : 'text-ink-muted',
        )}
      >
        {open ? 'MARKETS OPEN' : 'MARKETS CLOSED'}
      </span>
    </span>
  )
}

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [atTop, setAtTop] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setAtTop(y < 16)
      if (y > 96 && y > lastY.current) setHidden(true)
      else if (y < lastY.current) setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 border-b transition-transform duration-300',
          hidden && !drawerOpen ? '-translate-y-full' : 'translate-y-0',
          atTop
            ? 'border-transparent bg-transparent'
            : 'border-grid bg-carbon/80 backdrop-blur-[12px]',
        )}
      >
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6 lg:px-12">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Edgehawk logo" className="h-7 w-7" />
            <span className="font-display text-base font-bold tracking-tight text-ink-primary">
              EDGEHAWK
            </span>
          </Link>

          {/* Center links */}
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'group relative text-sm font-medium transition-colors duration-200',
                    isActive ? 'text-ink-primary' : 'text-ink-secondary hover:text-ink-primary',
                  )
                }
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-[2px] w-0 bg-pulse transition-all duration-200 group-hover:w-full" />
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="hidden items-center gap-4 md:flex">
            <UtcClock />
            <MarketPill />
            <Link
              to="/scanner"
              className="btn-shine rounded-lg border border-grid px-4 py-2 text-sm font-medium text-ink-primary transition-colors duration-200 hover:border-pulse/50 hover:bg-pulse/[0.06]"
            >
              Log in
            </Link>
            <Link
              to="/scanner"
              className="btn-shine animate-glow-pulse rounded-lg bg-pulse px-5 py-2.5 text-sm font-semibold text-abyss transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0"
            >
              Launch Scanner
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-grid text-ink-primary md:hidden"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-abyss/95 px-8 backdrop-blur-md md:hidden"
          >
            <nav className="flex flex-col gap-6">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ x: -32, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -32, opacity: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-baseline gap-4"
                  >
                    <span className="font-mono text-sm text-pulse">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-4xl font-bold text-ink-primary">
                      {l.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-12"
            >
              <Link
                to="/scanner"
                onClick={() => setDrawerOpen(false)}
                className="inline-block rounded-lg bg-pulse px-6 py-3 text-sm font-semibold text-abyss"
              >
                Launch Scanner
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
