# EDGEHAWK — Realtime Stock Scanner

A realtime stock scanner that hunts for trading edges: momentum, relative-volume,
gap, technical-indicator, pattern, options-activity and event-driven (earnings /
FOMC) signals, fused into a transparent 0–100 **Edge Score**.

## Features

- **Realtime scanner** across a ~90-name liquid US universe, refreshing every 4s
- **9 preset engines** (Momentum Breakout, Gap Hunter, Capitulation Reversal,
  Unusual Volume, Range Compression, Flush Scalp, Quiet Accumulation, Gap Fade,
  Sector Surge) + fully custom filters
- **Technical indicators**: RSI(14), MACD(12,26,9), SMA20/50, Bollinger %B, ATR%
- **Pattern detection**: breakout, near-bottom, channel up/down, overbought/oversold
- **Options-activity ratio** and **earnings/FOMC proximity** factored into ranking
- **Edge Score breakdown** — see exactly which factors drive each score
- Live candlestick detail drawer, heatmap view, streaming alerts rail, watchlist

## Data modes

The app ships with a provider chain: it tries live Yahoo Finance quotes first and
falls back to a deterministic simulation engine. Every payload carries a
`source` flag and the UI badges **LIVE DATA** vs **DEMO FEED** honestly.

- **Full-stack mode** (Node server): backend proxies Yahoo server-side.
- **Static mode** (GitHub Pages): the same engine runs entirely in the browser
  (demo feed — browsers are CORS-blocked from Yahoo).

## Development

```bash
npm install
npm run dev        # full-stack dev server on :3000
npm run build      # production build (frontend + server bundle)
npm start          # run production server
```

## Static build (GitHub Pages)

```bash
npm run build:static   # VITE_STATIC=1 — outputs dist/public with /<repo>/ base
```

### One-time GitHub Pages setup

API tokens without the `workflow` scope cannot push workflow files, so the CI
workflow ships as `pages-workflow.yml` in the repo root. To activate deploys:

1. In the GitHub web UI, open `pages-workflow.yml` and copy its content.
2. **Add file → Create new file** named `.github/workflows/pages.yml`, paste, commit to `main`.
3. The action builds and deploys automatically to
   `https://jozelazarevski.github.io/edgehawk-scanner/` (Pages is auto-enabled on first deploy).

> Image assets are stored base64-encoded under `assets-b64/` (the REST API only
> accepts text); the workflow decodes them into `public/` before building.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · tRPC + Hono (full-stack
mode) · lightweight-charts · GSAP · Framer Motion · Three.js

---

_Not financial advice. Market data may be delayed or simulated for demo purposes._
