import { describe, expect, it } from 'vitest'
import {
  MEDIA_INDEX_SECTIONS,
  MEDIA_NAVY,
  MEDIA_ON_AIR,
  MEDIA_RED,
  MEDIA_TEAL,
  moreInLabel,
  popularStories,
  splitHubDesk,
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
    expect(MEDIA_INDEX_SECTIONS.map(s => s.label)).toEqual([
      'Strategy',
      'Execution',
      'Identity',
      'Foundation',
    ])
    expect(desk.sections.map(s => s.label)).toEqual([
      'Strategy',
      'Execution',
      'Identity',
      'Foundation',
    ])
    expect(desk.sections[0]?.href).toBe('/media/strategy')
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
    expect(MEDIA_ON_AIR.map(l => l.href)).toEqual(['/live', '/podcast', '/podcast'])
    expect(MEDIA_ON_AIR.map(l => l.label)).toEqual(['LIVE', 'Podcast', 'Email brief'])
    expect(MEDIA_ON_AIR.some(l => l.label === 'Events' || l.href === '/events')).toBe(false)
  })
})
