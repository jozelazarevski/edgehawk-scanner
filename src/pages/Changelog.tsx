import { useState } from 'react'
import ChangelogHero from '@/components/marketing/changelog/ChangelogHero'
import FilterChips from '@/components/marketing/changelog/FilterChips'
import type { Filter } from '@/components/marketing/changelog/FilterChips'
import ReleaseTimeline from '@/components/marketing/changelog/ReleaseTimeline'
import SubscribeStrip from '@/components/marketing/changelog/SubscribeStrip'

export default function Changelog() {
  const [filter, setFilter] = useState<Filter>('ALL')
  return (
    <>
      <ChangelogHero />
      <FilterChips active={filter} onChange={setFilter} />
      <ReleaseTimeline filter={filter} />
      <SubscribeStrip />
    </>
  )
}
