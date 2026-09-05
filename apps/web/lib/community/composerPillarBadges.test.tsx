import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Composer } from '@/components/community/Composer'
import { FilterRail } from '@/components/community/FilterRail'
import {
  PILLAR_ABBREV,
  PILLAR_NUMBERS,
  pillarFillToken,
} from '@/components/community/PillarNumberBadge'

const COMPOSER_USER = {
  displayName: 'George Leith',
  initials: 'GL',
  avatarUrl: null,
  tier: 'pro',
}

describe('shared pillar badge tokens (CoS lock)', () => {
  it('uses the feed/Home short labels 1 FOUND through 6 EXEC', () => {
    expect(PILLAR_NUMBERS.map(n => `${n} ${PILLAR_ABBREV[n]}`)).toEqual([
      '1 FOUND',
      '2 IDENT',
      '3 MENTAL',
      '4 STRAT',
      '5 ACCT',
      '6 EXEC',
    ])
    for (const n of PILLAR_NUMBERS) {
      expect(PILLAR_ABBREV[n]).not.toMatch(/\./)
      expect(pillarFillToken(n)).toBe(`var(--pillar-${n})`)
    }
  })
})

describe('composer TAG PILLAR', () => {
  const html = renderToStaticMarkup(
    <Composer currentUser={COMPOSER_USER} channelId="channel-1" />,
  )

  it('renders the six numbered circular badges with filter abbreviations', () => {
    expect(html).toContain('Tag Pillar')
    for (const n of PILLAR_NUMBERS) {
      expect(html).toContain(`>${n}<`)
      expect(html).toContain(PILLAR_ABBREV[n])
      expect(html).toContain(`var(--pillar-${n})`)
    }
    expect(html).toContain('border-radius:50%')
    expect(html).toContain('width:24px')
    expect(html).toContain('height:24px')
    expect(html).toContain('var(--navy-abyss)')
    expect(html).toContain('pillar-number-badge--abbrev-always')
    expect(html).toContain('pillar-number-badge-row')
    expect(html).toContain('color:var(--navy-abyss)')
    expect(html).not.toContain('background:#FFA538')
  })

  it('does not render the old outlined full-name chips', () => {
    expect(html).not.toMatch(/>Foundation</)
    expect(html).not.toMatch(/>Identity</)
    expect(html).not.toMatch(/>Mental</)
    expect(html).not.toMatch(/>Strategy</)
    expect(html).not.toMatch(/>Accountability</)
    expect(html).not.toMatch(/>Execution</)
    expect(html).not.toContain('FOUND.')
    expect(html).not.toContain('IDENT.')
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

  it('shares the same numbered badge tokens, not a third control', () => {
    expect(html).toContain('Pillar:')
    expect(html).toContain('FOUND')
    expect(html).toContain('IDENT')
    expect(html).toContain('Filter by Foundation')
    expect(html).toContain('var(--pillar-1)')
    expect(html).toContain('var(--navy-abyss)')
    expect(html).not.toContain('class="pillar-number-badge pillar-number-badge--abbrev-always"')
    expect(html).toContain('class="pillar-number-badge"')
    expect(html).not.toMatch(/>Foundation</)
  })
})
