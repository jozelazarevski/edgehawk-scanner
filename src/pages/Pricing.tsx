import { useState } from 'react'
import PricingHero from '@/components/marketing/pricing/PricingHero'
import TierCards from '@/components/marketing/pricing/TierCards'
import ComparisonMatrix from '@/components/marketing/pricing/ComparisonMatrix'
import TrustBand from '@/components/marketing/pricing/TrustBand'
import PricingFaq from '@/components/marketing/pricing/PricingFaq'
import PricingCta from '@/components/marketing/pricing/PricingCta'
import type { Billing } from '@/components/marketing/pricing/billing'

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly')
  return (
    <>
      <PricingHero billing={billing} onBillingChange={setBilling} />
      <TierCards billing={billing} />
      <ComparisonMatrix />
      <TrustBand />
      <PricingFaq />
      <PricingCta />
    </>
  )
}
