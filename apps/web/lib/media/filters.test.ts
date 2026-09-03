import { describe, expect, it } from 'vitest'
import { mediaFilterCategories } from './filters'

describe('mediaFilterCategories', () => {
  it('only returns pillars that have at least one story', () => {
    const cats = mediaFilterCategories([
      { pillar: 'foundation' },
      { pillar: 'foundation' },
      { pillar: 'execution' },
      { pillar: null },
      { pillar: 'revenue' },
    ])
    expect(cats.map(c => c.slug)).toEqual(['foundation', 'execution'])
    expect(cats.every(c => c.label !== 'Revenue' && c.label !== 'AI' && c.label !== 'Leadership')).toBe(
      true,
    )
  })

  it('returns nothing when no real pillars are present', () => {
    expect(mediaFilterCategories([{ pillar: null }, { pillar: 'leadership' }])).toEqual([])
  })
})
