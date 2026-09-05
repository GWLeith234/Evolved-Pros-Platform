import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Composer } from '@/components/community/Composer'
import { FilterRail } from '@/components/community/FilterRail'
import { PILLAR_ABBREV, PILLAR_NUMBERS } from '@/components/community/PillarNumberBadge'

const COMPOSER_USER = {
  displayName: 'George Leith',
  initials: 'GL',
  avatarUrl: null,
  tier: 'pro',
}

describe('composer TAG PILLAR', () => {
  const html = renderToStaticMarkup(
    <Composer currentUser={COMPOSER_USER} channelId="channel-1" />,
  )

  it('renders the six numbered circular badges with filter abbreviations', () => {
    expect(html).toContain('Tag Pillar')
    for (const n of PILLAR_NUMBERS) {
      expect(html).toContain(`>${n}<`)
      expect(html).toContain(PILLAR_ABBREV[n])
    }
    expect(html).toContain('border-radius:50%')
    expect(html).toContain('pillar-number-badge--abbrev-always')
    expect(html).toContain('pillar-number-badge-row')
  })

  it('does not render the old outlined full-name chips', () => {
    expect(html).not.toMatch(/>Foundation</)
    expect(html).not.toMatch(/>Identity</)
    expect(html).not.toMatch(/>Mental</)
    expect(html).not.toMatch(/>Strategy</)
    expect(html).not.toMatch(/>Accountability</)
    expect(html).not.toMatch(/>Execution</)
  })

  it('keeps the same 1-6 tag values the API already accepts', () => {
    expect(html).toContain('aria-label="Tag Foundation"')
    expect(html).toContain('aria-label="Tag Identity"')
    expect(html).toContain('aria-label="Tag Mental Toughness"')
    expect(html).toContain('aria-label="Tag Strategy"')
    expect(html).toContain('aria-label="Tag Accountability"')
    expect(html).toContain('aria-label="Tag Execution"')
  })
})

describe('feed PILLAR filter', () => {
  const html = renderToStaticMarkup(
    <FilterRail
      activeKind="all"
      activePillars={[]}
      sortBy="newest"
      onChangeKind={() => {}}
      onChangePillars={() => {}}
      onChangeSort={() => {}}
    />,
  )

  it('still uses the shared numbered badges, not the composer always-abbrev mode', () => {
    expect(html).toContain('Pillar:')
    expect(html).toContain('FOUND.')
    expect(html).toContain('Filter by Foundation')
    expect(html).not.toContain('class="pillar-number-badge pillar-number-badge--abbrev-always"')
    expect(html).toContain('class="pillar-number-badge"')
    expect(html).not.toMatch(/>Foundation</)
  })
})
