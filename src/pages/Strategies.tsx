import StrategiesHero from '@/components/strategies/StrategiesHero'
import FlagshipDeepDive from '@/components/strategies/FlagshipDeepDive'
import PlaybookGrid from '@/components/strategies/PlaybookGrid'
import BacktestBand from '@/components/strategies/BacktestBand'
import StrategiesCta from '@/components/strategies/StrategiesCta'

/**
 * /strategies — the playbook library.
 * Hero → pinned flagship deep-dive (GSAP) → 9-engine grid →
 * backtest methodology band → CTA.
 */
export default function Strategies() {
  return (
    <>
      <StrategiesHero />
      <FlagshipDeepDive />
      <PlaybookGrid />
      <BacktestBand />
      <StrategiesCta />
    </>
  )
}
