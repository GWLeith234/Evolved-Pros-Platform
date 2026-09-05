import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HomeBannerBand } from '@/components/home/HomeBannerBand'
import { HomeAccountabilityBand } from '@/components/home/HomeAccountabilityBand'
import { HomeFuelBand } from '@/components/home/HomeFuelBand'
import { HomeEpisodeCard } from '@/components/home/HomeEpisodeCard'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { JUAN_EP010_STILL } from '@/lib/podcast/stillUrl'

const PILLARS = ([1, 2, 3, 4, 5, 6] as const).map(n => ({
  number: n,
  name: `P${n}`,
  state: n === 4 ? ('in-progress' as const) : n < 4 ? ('earned' as const) : ('locked' as const),
  progressPct: n === 4 ? 40 : undefined,
}))

describe('Home band markup', () => {
  it('renders the locked Banner / Accountability / Fuel anatomy', () => {
    const banner = renderToStaticMarkup(
      <HomeBannerBand
        wig={{
          id: 'g1',
          title: 'Close $250K in new pipeline',
          period: 'Q2-2026',
          progress_pct: 75,
          weekly_delta: 11,
          pillar: 'strategy',
        }}
        pillars={PILLARS}
        streakDays={4}
        checkedInToday
        wins={[
          { id: 'w1', label: '$18K closed' },
          { id: 'w2', label: 'Referral in' },
        ]}
      />,
    )
    expect(banner).toContain('Quarterly WIG')
    expect(banner).toContain('Close $250K in new pipeline')
    expect(banner).toContain('75%')
    expect(banner).toContain('+11% wk')
    expect(banner).toContain('Found.')
    expect(banner).toContain('4-day streak')
    expect(banner).toContain('Checked in today')
    expect(banner).toContain('$18K closed')
    expect(banner).toContain('var(--bg-surface)')
    expect(banner).toContain('var(--teal)')
    expect(banner).not.toMatch(/\u2014|\u2013/)

    const engine = renderToStaticMarkup(
      <HomeAccountabilityBand
        habits={[
          { id: 'h1', name: 'Discovery calls', pillar: 'strategy', completedToday: true, recentCount: 4 },
          { id: 'h2', name: 'Proposals out', pillar: 'execution', completedToday: false, recentCount: 0 },
        ]}
        commitments={[{ id: 'c1', commitment: 'Book two first meetings', is_completed: true }]}
      />,
    )
    expect(engine).toContain('Leading measures')
    expect(engine).toContain('weekly commit pulse')
    expect(engine).toContain('Discovery calls')
    expect(engine).toContain('Lead tied to WIG')
    expect(engine).toContain('NOT YET')
    expect(engine).not.toMatch(/\u2014|\u2013/)

    const fuel = renderToStaticMarkup(
      <HomeFuelBand
        academy={{
          title: 'Objection Handling',
          href: '/academy/strategy/objection-handling',
          pillarName: 'Strategy pillar',
          moduleLabel: 'Module 3 of 7',
          remainingLabel: '12 min left',
          progressPct: 40,
        }}
        thread={{
          title: 'How do you handle price pushback on first calls?',
          href: '/community/strategy?post=1',
          authorName: 'Marcus T.',
          replyLabel: '14 replies',
          age: '2h',
        }}
        live={{
          title: 'GTM 2026 — Pavilion Annual Conference',
          href: '/events/1',
          whenLabel: 'Thu Sep 11 · 12:00 PM CT',
          isLive: true,
          imageUrl: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1400&q=80',
          city: 'Las Vegas',
        }}
      />,
    )
    expect(fuel).toContain('Resume lesson')
    expect(fuel).toContain('Join thread')
    expect(fuel).toContain('Save my seat')
    expect(fuel).toContain('GTM 2026. Pavilion Annual Conference')
    expect(fuel).toContain('/academy/architecture-still-light.svg')
    expect(fuel).toContain('/academy/architecture-still-dark.svg')
    expect(fuel).toContain('Evolved Pros Academy architecture')
    expect(fuel).toContain('photo-1605833556294-ea5c7a74f57d')
    expect(fuel).toContain('Stock photo of Las Vegas')
    expect(fuel).not.toMatch(/\u2014|\u2013/)

    const empty = renderToStaticMarkup(<HomeFuelBand academy={null} thread={null} live={null} />)
    expect(empty).toContain('Open the Academy')
    expect(empty).toContain('Start Foundation when you are ready.')
    expect(empty).toContain('/academy/architecture-still-light.svg')
    expect(empty).not.toContain('/events/city-fallback.svg')
    expect(empty).toContain('Watch the calendar for the next workshop.')
    expect(empty).not.toMatch(/\u2014|\u2013/)

    const unknownCity = renderToStaticMarkup(
      <HomeFuelBand
        academy={null}
        thread={null}
        live={{
          title: 'Friday Mastermind',
          href: '/events/2',
          whenLabel: 'Fri Oct 2 · 2:00 PM CT',
          isLive: false,
          imageUrl: null,
          city: null,
        }}
      />,
    )
    expect(unknownCity).toContain('/events/city-fallback.svg')
    expect(unknownCity).toContain('alt="Event"')
    expect(unknownCity).not.toMatch(/\u2014|\u2013/)
  })

  it('shows the guest still on episode cards and keeps Juan on the public path', () => {
    const html = renderToStaticMarkup(
      <HomeEpisodeCard
        href="/podcast/evolved-pros-podcast-ep-010-juan-fernandez"
        title="Juan Fernandez"
        guestName="Juan Fernandez"
        episodeNumber={10}
        guestImageUrl={JUAN_EP010_STILL}
      />,
    )
    expect(html).toContain(JUAN_EP010_STILL)
    expect(html).toContain('Juan Fernandez')
    expect(html).toContain('object-cover')
  })

  it('mounts the standard platform footer', () => {
    const html = renderToStaticMarkup(<PublicFooter />)
    expect(html).toContain('ep-public-footer')
    expect(html).toContain('Footer')
  })
})
