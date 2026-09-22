import { describe, expect, it } from 'vitest'
import {
  ALL_MEDIA_SECTIONS,
  MEDIA_NAVY,
  MEDIA_ON_AIR,
  MEDIA_RED,
  MEDIA_TEAL,
  mediaIndexSections,
  moreInLabel,
  popularStories,
  splitHubDesk,
  splitSectionDesk,
} from './desk'

function story(
  id: string,
  pillar: string | null,
  views = 0,
  published_at = '2026-08-12T00:00:00.000Z',
) {
  return { id, pillar, views, published_at }
}

describe('splitHubDesk', () => {
  const stories = [
    story('a', 'identity', 10),
    story('b', 'strategy', 4),
    story('c', 'execution', 3),
    story('d', 'foundation', 2),
    story('e', 'identity', 1),
    story('f', 'strategy', 8),
    story('g', 'execution', 9),
    story('h', 'foundation', 7),
    story('i', 'strategy', 2),
    story('j', 'identity', 3),
  ]

  it('puts the newest story in the lede, the next as secondary, then a Featured 2-up', () => {
    const desk = splitHubDesk(stories)
    expect(desk.featured?.id).toBe('a')
    expect(desk.secondary?.id).toBe('b')
    expect(desk.featuredGrid.map(s => s.id)).toEqual(['c', 'd'])
    expect(desk.latestList.map(s => s.id)).toEqual(['e', 'f', 'g', 'h', 'i', 'j'])
    expect(desk.latestList.length).toBeGreaterThanOrEqual(5)
  })

  it('builds named category sections without reusing hero or Featured stories', () => {
    const desk = splitHubDesk(stories, { sectionSize: 2, latestList: 2 })
    // Derived from the stories, in canonical pillar order — not a constant.
    expect(desk.sections.map(s => s.label)).toEqual([
      'Foundation',
      'Identity',
      'Strategy',
      'Execution',
    ])
    expect(desk.sections.find(s => s.label === 'Strategy')?.href).toBe('/media/strategy')
    const used = new Set(
      [desk.featured, desk.secondary, ...desk.featuredGrid, ...desk.latestList]
        .filter(Boolean)
        .map(s => s!.id),
    )
    for (const section of desk.sections) {
      for (const row of section.stories) {
        expect(used.has(row.id)).toBe(false)
      }
    }
    expect(moreInLabel('Strategy')).toBe('More in Strategy')
  })

  // SPRINT M — the bug this replaced: MEDIA_INDEX_SECTIONS was hardcoded to
  // strategy/execution/identity/foundation, so published stories under
  // accountability and mental-toughness got no section block and no nav door.
  it('gives every pillar with a published story a section, including the two that were stranded', () => {
    const withStranded = [
      ...stories,
      story('k', 'accountability', 5),
      story('l', 'accountability', 4),
      story('m', 'mental-toughness', 6),
      story('n', 'mental-toughness', 5),
    ]
    const labels = splitHubDesk(withStranded, { sectionSize: 2, latestList: 2 })
      .sections.map(s => s.label)
    expect(labels).toContain('Accountability')
    expect(labels).toContain('Mental Toughness')
  })
})

describe('mediaIndexSections', () => {
  it('lists only pillars that have a published story, in canonical order', () => {
    expect(
      mediaIndexSections([
        { pillar: 'execution' },
        { pillar: 'accountability' },
        { pillar: 'foundation' },
        { pillar: 'foundation' },
      ]).map(s => s.id),
    ).toEqual(['foundation', 'accountability', 'execution'])
  })

  it('drops nulls and slugs that are not pillars, and never invents a section', () => {
    expect(mediaIndexSections([{ pillar: null }, { pillar: 'revenue' }])).toEqual([])
    expect(mediaIndexSections([])).toEqual([])
  })

  it('points each section at its own /media route', () => {
    expect(mediaIndexSections([{ pillar: 'mental-toughness' }])).toEqual([
      {
        id: 'mental-toughness',
        label: 'Mental Toughness',
        pillar: 'mental-toughness',
        href: '/media/mental-toughness',
      },
    ])
  })

  it('keeps all six pillars available as the degraded-mode fallback', () => {
    expect(ALL_MEDIA_SECTIONS).toHaveLength(6)
    expect(ALL_MEDIA_SECTIONS.map(s => s.href)).toContain('/media/accountability')
    expect(ALL_MEDIA_SECTIONS.map(s => s.href)).toContain('/media/mental-toughness')
  })
})

describe('splitSectionDesk', () => {
  it('builds a mini-hero, Featured 2-up, and Latest rail from one section list', () => {
    const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id, i) =>
      story(id, 'strategy', i),
    )
    const desk = splitSectionDesk(rows)
    expect(desk.featured?.id).toBe('a')
    expect(desk.secondary?.id).toBe('b')
    expect(desk.featuredGrid.map(s => s.id)).toEqual(['c', 'd'])
    expect(desk.latestList.map(s => s.id)).toEqual(['e', 'f', 'g', 'h'])
    expect(desk.latestList.length).toBeGreaterThanOrEqual(4)
  })
})

describe('popularStories', () => {
  it('ranks by views, then recency', () => {
    const rows = [
      story('old-high', 'strategy', 20, '2026-04-01T00:00:00.000Z'),
      story('new-low', 'identity', 1, '2026-08-20T00:00:00.000Z'),
      story('new-high', 'execution', 20, '2026-08-12T00:00:00.000Z'),
    ]
    expect(popularStories(rows, 2).map(s => s.id)).toEqual(['new-high', 'old-high'])
  })
})

describe('desk chrome locks', () => {
  it('keeps Evolved Pros navy / red / teal and real On Air destinations', () => {
    expect(MEDIA_NAVY).toBe('#1B3C5A')
    expect(MEDIA_RED).toBe('#EF0E30')
    expect(MEDIA_TEAL).toBe('#68A2B9')
    expect(MEDIA_ON_AIR.map(l => l.href)).toEqual(['/live', '/podcast'])
    expect(MEDIA_ON_AIR.map(l => l.label)).toEqual(['LIVE', 'Podcast'])
    expect(MEDIA_ON_AIR.some(l => l.label === 'Events' || l.href === '/events')).toBe(false)
    // SPRINT M — "Email brief" used to sit here pointing at /podcast. The
    // brief is a real capture form now; it is not a nav link to a podcast.
    expect(MEDIA_ON_AIR.some(l => /brief/i.test(l.label))).toBe(false)
  })
})
