import { describe, expect, it, vi } from 'vitest'
import { EVENT_CITY_FALLBACK_IMAGE } from './cityStock'
import { resolveCityStockWithSearch } from './cityStockFetch'

describe('city stock search', () => {
  it('uses the catalog without calling Unsplash', async () => {
    const fetchImpl = vi.fn()
    const resolved = await resolveCityStockWithSearch({
      city: 'Las Vegas',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(resolved.source).toBe('catalog')
    expect(resolved.city).toBe('Las Vegas')
  })

  it('searches Unsplash for a typed city that is not in the catalog', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ urls: { regular: 'https://images.unsplash.com/photo-boise-skyline' } }],
      }),
    })
    const prev = process.env.UNSPLASH_ACCESS_KEY
    process.env.UNSPLASH_ACCESS_KEY = 'test-key'
    const resolved = await resolveCityStockWithSearch({
      city: 'Boise',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    process.env.UNSPLASH_ACCESS_KEY = prev
    expect(fetchImpl).toHaveBeenCalled()
    expect(resolved.fallback).toBe(false)
    expect(resolved.city).toBe('Boise')
    expect(resolved.imageUrl).toBe('https://images.unsplash.com/photo-boise-skyline')
  })

  it('falls back when the city is blank or search misses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false })
    const blank = await resolveCityStockWithSearch({ city: '', fetchImpl: fetchImpl as unknown as typeof fetch })
    expect(blank.city).toBeNull()
    expect(blank.imageUrl).toBe(EVENT_CITY_FALLBACK_IMAGE)
    expect(fetchImpl).not.toHaveBeenCalled()

    const prev = process.env.UNSPLASH_ACCESS_KEY
    process.env.UNSPLASH_ACCESS_KEY = 'test-key'
    const miss = await resolveCityStockWithSearch({
      city: 'Boise',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    process.env.UNSPLASH_ACCESS_KEY = prev
    expect(miss.fallback).toBe(true)
    expect(miss.city).toBe('Boise')
    expect(miss.imageUrl).toBe(EVENT_CITY_FALLBACK_IMAGE)
  })
})
