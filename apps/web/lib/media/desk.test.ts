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
  ]

  it('puts the newest story in featured and the next six in the list module', () => {
    const desk = splitHubDesk(stories)
    expect(desk.featured?.id).toBe('a')
    expect(desk.latestList.map(s => s.id)).toEqual(['b', 'c', 'd', 'e', 'f', 'g'])
  })

  it('builds named category sections with a More in exit', () => {
    const desk = splitHubDesk(stories, { sectionSize: 2 })
    expect(MEDIA_INDEX_SECTIONS.map(s => s.label)).toEqual([
      'Latest',
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
    expect(desk.sections[0]?.stories).toHaveLength(2)
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
    expect(MEDIA_ON_AIR.map(l => l.href)).toEqual(['/live', '/podcast', '/events'])
  })
})
