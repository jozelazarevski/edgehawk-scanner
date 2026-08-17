import { Link } from 'react-router'
import TickerTape, { TAPE_SYMBOLS } from '@/components/TickerTape'

const PRODUCT_LINKS = [
  { label: 'Scanner', to: '/scanner' },
  { label: 'Strategies', to: '/strategies' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Alerts', to: '/scanner' },
]
const RESOURCE_LINKS = [
  { label: 'Academy', to: '/academy' },
  { label: 'Docs', to: '/academy' },
  { label: 'API', to: '/changelog' },
  { label: 'Changelog', to: '/changelog' },
]
const COMPANY_LINKS = [
  { label: 'About', to: '/' },
  { label: 'Careers', to: '/' },
  { label: 'Contact', to: '/' },
  { label: 'Press', to: '/' },
]

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M4 4l16 16M20 4L4 20" strokeLinecap="round" />
    </svg>
  )
}
function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M8 17l-4 2 1.5-4.5M16 17l4 2-1.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13c0-4 2.5-7 7-7s7 3 7 7c0 1.5-.5 3-1.5 4h-11C5.5 16 5 14.5 5 13z" strokeLinejoin="round" />
      <circle cx="9.5" cy="12.5" r="0.5" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="0.5" fill="currentColor" />
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.75v4.5L14.5 12l-4-2.25z" fill="currentColor" stroke="none" />
    </svg>
  )
}
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M9 19c-3 1-3.5-2-5-2m10 3v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 00-6.2 0C6.5 1.8 5.4 2.1 5.4 2.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004 8.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LinkColumn({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="label-eyebrow mb-4 text-ink-muted">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-ink-secondary transition-colors duration-200 hover:text-pulse"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const mini = TAPE_SYMBOLS.slice(0, 5)
  return (
    <footer className="bg-abyss">
      <TickerTape />
      <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Edgehawk logo" className="h-7 w-7" />
              <span className="font-display text-base font-bold tracking-tight">EDGEHAWK</span>
            </Link>
            <p className="mt-3 text-sm text-ink-secondary">See the move before it moves.</p>
            <div className="mt-5 space-y-1.5">
              {mini.map((s) => (
                <div key={s.sym} className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-ink-primary">{s.sym}</span>
                  <span className="text-ink-muted tabular-nums">{s.price.toFixed(2)}</span>
                  <span className={s.chg >= 0 ? 'text-pulse' : 'text-signal'}>
                    {s.chg >= 0 ? '▲' : '▼'}
                    {Math.abs(s.chg).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Resources" links={RESOURCE_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-grid pt-8 md:flex-row">
          <p className="text-xs text-ink-muted">
            © 2025 Edgehawk Systems · Not financial advice · Data simulated for demo
          </p>
          <div className="flex items-center gap-5 text-ink-muted">
            {[XIcon, DiscordIcon, YoutubeIcon, GithubIcon].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="transition-colors duration-200 hover:text-pulse"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
