import { describe, expect, it } from 'vitest'
import { HOME_CONTENT_CARDS } from '@/lib/ads/rhythm'
import { takeHomeContentRow } from './contentRow'

describe('takeHomeContentRow', () => {
  it('caps a home editorial row at two cards', () => {
    expect(HOME_CONTENT_CARDS).toBe(2)
    expect(takeHomeContentRow(['a', 'b', 'c'])).toEqual(['a', 'b'])
    expect(takeHomeContentRow(['a'])).toEqual(['a'])
    expect(takeHomeContentRow([])).toEqual([])
  })
})
