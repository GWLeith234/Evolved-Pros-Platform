import { describe, expect, it } from 'vitest'
import { assertNoEmDash } from '@/lib/home/bands'
import { ACADEMY_STILL_ALT, stripEmDashCopy } from '@/lib/home/cardImagery'
import {
  CITY_STOCK_CATALOG,
  EVENT_CITY_FALLBACK_IMAGE,
  eventCardImageAlt,
  eventCardImageUrl,
  isManagedEventImage,
  lookupCityStock,
  normalizeCityInput,
  resolveCityStock,
} from './cityStock'

describe('city stock resolver', () => {
  it('normalizes a typed city and rejects junk', () => {
    expect(normalizeCityInput('  Las Vegas  ')).toBe('Las Vegas')
    expect(normalizeCityInput('')).toBeNull()
    expect(normalizeCityInput('???')).toBeNull()
    expect(normalizeCityInput('Las Vegas <script>')).toBeNull()
  })

  it('looks up catalog cities by alias and never invents one', () => {
    expect(lookupCityStock('vegas')?.label).toBe('Las Vegas')
    expect(lookupCityStock('NYC')?.label).toBe('New York')
    expect(lookupCityStock('Boise')).toBeNull()
    expect(lookupCityStock('GTM 2026 Pavilion')).toBeNull()
  })

  it('stores city plus catalog image when the city is known', () => {
    const resolved = resolveCityStock({ city: 'Las Vegas' })
    expect(resolved.city).toBe('Las Vegas')
    expect(resolved.fallback).toBe(false)
    expect(resolved.source).toBe('catalog')
    expect(resolved.imageUrl).toContain('images.unsplash.com')
    expect(resolved.imageUrl).toContain('photo-1605833556294-ea5c7a74f57d')
  })

  it('uses the branded fallback when the city is unknown or blank', () => {
    expect(resolveCityStock({ city: null })).toEqual({
      city: null,
      imageUrl: EVENT_CITY_FALLBACK_IMAGE,
      fallback: true,
      source: 'fallback',
    })
    expect(resolveCityStock({ city: 'Boise' }).imageUrl).toBe(EVENT_CITY_FALLBACK_IMAGE)
    expect(resolveCityStock({ city: 'Boise' }).city).toBe('Boise')
    expect(resolveCityStock({ city: 'Boise' }).fallback).toBe(true)
  })

  it('keeps a custom cover and still stores the typed city', () => {
    const resolved = resolveCityStock({
      city: 'Austin',
      imageUrl: 'https://cdn.example/custom-cover.jpg',
    })
    expect(resolved.city).toBe('Austin')
    expect(resolved.imageUrl).toBe('https://cdn.example/custom-cover.jpg')
    expect(resolved.source).toBe('provided')
  })

  it('treats Unsplash catalog and fallback URLs as managed', () => {
    expect(isManagedEventImage(EVENT_CITY_FALLBACK_IMAGE)).toBe(true)
    expect(isManagedEventImage(CITY_STOCK_CATALOG[0].imageUrl)).toBe(true)
    expect(isManagedEventImage('https://cdn.example/custom-cover.jpg')).toBe(false)
    expect(isManagedEventImage(null)).toBe(true)
  })

  it('card image and alt never invent a city name', () => {
    expect(eventCardImageUrl(null)).toBe(EVENT_CITY_FALLBACK_IMAGE)
    expect(eventCardImageUrl('https://images.unsplash.com/photo-x')).toContain('unsplash')
    expect(eventCardImageAlt('Las Vegas')).toBe('Stock photo of Las Vegas')
    expect(eventCardImageAlt(null)).toBe('Event')
    expect(assertNoEmDash(eventCardImageAlt('Las Vegas'))).toBe(true)
    expect(assertNoEmDash(ACADEMY_STILL_ALT)).toBe(true)
  })

  it('strips em dashes from card titles', () => {
    expect(stripEmDashCopy('GTM 2026 — Pavilion Annual Conference')).toBe(
      'GTM 2026. Pavilion Annual Conference',
    )
    expect(assertNoEmDash(stripEmDashCopy('GTM 2026 — Pavilion Annual Conference'))).toBe(true)
  })
})
