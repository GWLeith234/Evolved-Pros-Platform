import { describe, expect, it } from 'vitest'
import { ACADEMY_CARDS_PER_AD } from '@/lib/ads/rhythm'
import { assignThreadAds } from './threadAds'

describe('assignThreadAds', () => {
  it('places one unit after every three cards on a six-lesson pillar', () => {
    expect(ACADEMY_CARDS_PER_AD).toBe(3)
    const cards = Array.from({ length: 6 }, (_, i) => ({ id: `l${i + 1}` }))
    const map = assignThreadAds(cards, ['a', 'b', 'c'])
    expect([...map.entries()]).toEqual([
      ['l3', 'a'],
      ['l6', 'b'],
    ])
  })

  it('covers a long thread without stacking leftover ads', () => {
    const cards = Array.from({ length: 12 }, (_, i) => ({ id: `l${i + 1}` }))
    const map = assignThreadAds(cards, ['a', 'b', 'c', 'd', 'e'])
    expect(map.size).toBe(4)
    expect(map.get('l3')).toBe('a')
    expect(map.get('l12')).toBe('d')
  })

  it('tightens after the first screen on a deep pillar', () => {
    const cards = Array.from({ length: 18 }, (_, i) => ({ id: `l${i + 1}` }))
    const map = assignThreadAds(cards, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])
    expect(map.get('l3')).toBe('a')
    expect(map.get('l12')).toBe('d')
    expect(map.get('l14')).toBe('e')
    expect(map.get('l16')).toBe('f')
    expect(map.get('l18')).toBe('g')
    expect(map.size).toBe(7)
  })
})
