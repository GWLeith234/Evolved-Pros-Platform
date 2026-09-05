import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACADEMY_STILL_DARK, ACADEMY_STILL_LIGHT } from '@/lib/home/cardImagery'
import { EVENT_CITY_FALLBACK_IMAGE } from '@/lib/events/cityStock'
import { PUBLIC_BRAND_PREFIX, isPublicBrandAsset } from './publicAssets'

describe('public brand assets', () => {
  it('allows svg and other static files under /brand only', () => {
    expect(isPublicBrandAsset('/brand/architecture-still-light.svg')).toBe(true)
    expect(isPublicBrandAsset('/brand/architecture-still-dark.svg')).toBe(true)
    expect(isPublicBrandAsset('/brand/city-fallback.svg')).toBe(true)
    expect(isPublicBrandAsset('/brand/hero-evolved-architecture.png')).toBe(true)
    expect(isPublicBrandAsset('/academy/architecture-still-light.svg')).toBe(false)
    expect(isPublicBrandAsset('/events/city-fallback.svg')).toBe(false)
    expect(isPublicBrandAsset('/brand/no-extension')).toBe(false)
    expect(isPublicBrandAsset('/home')).toBe(false)
  })

  it('keeps Fuel stills on the public /brand prefix, not gated routes', () => {
    expect(ACADEMY_STILL_LIGHT).toBe(`${PUBLIC_BRAND_PREFIX}/architecture-still-light.svg`)
    expect(ACADEMY_STILL_DARK).toBe(`${PUBLIC_BRAND_PREFIX}/architecture-still-dark.svg`)
    expect(EVENT_CITY_FALLBACK_IMAGE).toBe(`${PUBLIC_BRAND_PREFIX}/city-fallback.svg`)
    for (const src of [ACADEMY_STILL_LIGHT, ACADEMY_STILL_DARK, EVENT_CITY_FALLBACK_IMAGE]) {
      expect(src.startsWith(`${PUBLIC_BRAND_PREFIX}/`)).toBe(true)
      expect(src.startsWith('/academy/')).toBe(false)
      expect(src.startsWith('/events/')).toBe(false)
      expect(isPublicBrandAsset(src)).toBe(true)
    }
  })

  it('ships the still files next to the conversion hero', () => {
    const root = resolve(__dirname, '../../public')
    expect(existsSync(resolve(root, 'brand/architecture-still-light.svg'))).toBe(true)
    expect(existsSync(resolve(root, 'brand/architecture-still-dark.svg'))).toBe(true)
    expect(existsSync(resolve(root, 'brand/city-fallback.svg'))).toBe(true)
    expect(existsSync(resolve(root, 'academy/architecture-still-light.svg'))).toBe(false)
    expect(existsSync(resolve(root, 'events/city-fallback.svg'))).toBe(false)
  })
})

describe('middleware public stills lock', () => {
  const middleware = readFileSync(resolve(__dirname, '../../middleware.ts'), 'utf8')

  it('lets /brand stills through and never matches /brand as a member route', () => {
    expect(middleware).toContain("from '@/lib/auth/publicAssets'")
    expect(middleware).toContain('isPublicBrandAsset(pathname)')
    expect(middleware).toMatch(/PUBLIC_ROUTES = \[[\s\S]*'\/brand'/)
    expect(middleware).not.toMatch(/'\/brand\/:path\*'/)
    expect(middleware).toContain("'/academy/:path*'")
    expect(middleware).toContain("'/events/:path*'")
  })
})
