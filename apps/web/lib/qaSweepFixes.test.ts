import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'
import {
  HOME_JOIN_FREE,
  HOME_SECONDARY_CTA,
  HERO_IMAGE_MD5,
  HERO_IMAGE_SRC,
} from '@/lib/home/conversion'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')

function read(rel: string): string {
  return readFileSync(resolve(webRoot, rel), 'utf8')
}

describe('QA sweep P0 /pricing TBT', () => {
  const page = read('app/(public)/pricing/page.tsx')
  const cards = read('app/(public)/pricing/PricingTierCards.tsx')

  it('keeps #152 JSON-LD and locked differentiator copy on the server page', () => {
    expect(page).toMatch(/pricingJsonLd/)
    expect(page).toMatch(/application\/ld\+json/)
    expect(page).toMatch(/MUST_CITE_PRICING_DIFFERENTIATOR/)
    expect(page).toMatch(/id="pricing-differentiator"/)
  })

  it('does not hydrate the pricing ladder — CSS billing toggle, client CTAs only', () => {
    expect(cards.startsWith("'use client'")).toBe(false)
    expect(cards).toContain('ep-pricing-billing')
    expect(cards).toContain('ep-price-monthly')
    expect(cards).toContain('ep-price-annual')
    expect(cards).toContain('ANNUAL_BILLING_TOOLTIP')
    expect(cards).toContain('title={ANNUAL_BILLING_TOOLTIP}')
    expect(cards).not.toMatch(/useState/)
    expect(cards).toContain('Join free')
    expect(cards).toContain('Start VIP')
    expect(cards).toContain('Go Professional')
    expect(cards).toContain('Book George')
    expect(page).toMatch(/next\/dynamic/)
    expect(page).toMatch(/nextDynamic/)
    expect(page).toMatch(/RedeemCodeForm/)
    expect(page).toMatch(/export const dynamic = 'force-dynamic'/)
  })
})

describe('QA sweep P1 /media LCP', () => {
  const masthead = read('components/media/Masthead.tsx')
  const layout = read('app/(public)/media/layout.tsx')
  const css = read('app/globals.css')

  it('preloads the parchment lockup and prioritizes the visible light PNG', () => {
    expect(layout).toContain('rel="preload"')
    expect(layout).toContain('MEDIA_LOCKUP_LIGHT')
    expect(masthead).toMatch(/fetchpriority: 'high'/)
    expect(masthead).toMatch(/loading="lazy"/)
    expect(masthead).toContain('width={612}')
    expect(masthead).toContain('height={139}')
    expect(masthead).not.toMatch(/next\/image/)
  })

  it('keeps the full-width parchment lockup and both theme files', () => {
    expect(masthead).toContain('MEDIA_LOCKUP_LIGHT')
    expect(masthead).toContain('MEDIA_LOCKUP_DARK')
    expect(MEDIA_LOCKUP_LIGHT).toBe('/brand/masthead/media-lockup-light.png')
    expect(MEDIA_LOCKUP_DARK).toBe('/brand/masthead/media-lockup-dark.png')
    expect(css).toMatch(/\.ep-media-masthead-logo \{\n  width: 100%;\n  max-width: 100%;\n  height: auto;\n\}/)
    expect(css).toMatch(/\.ep-media-masthead \{[\s\S]*background: var\(--paper\)/)
    expect(css).not.toMatch(/\.ep-media-masthead \{[\s\S]{0,240}background: var\(--navy/)
  })
})

describe('QA sweep P1 /live + home LCP', () => {
  const hero = read('components/live/LiveSplitHero.tsx')
  const livePage = read('app/live/page.tsx')
  const home = read('components/home/ConversionHome.tsx')

  it('promotes the LIVE hero photo to a prioritized img and keeps inquire above the proof row', () => {
    expect(hero).toContain("LIVE_HERO_PHOTO = '/live/george-stage-blue-jacket.jpg'")
    expect(hero).toContain("fetchpriority: 'high'")
    expect(hero).not.toMatch(/backgroundImage:/)
    expect(hero).toContain('live-hero-inquire-early')
    expect(hero).toContain('INQUIRE_BOOKING_TOOLTIP')
    expect(livePage).toContain('rel="preload"')
    expect(livePage).toContain('LIVE_HERO_PHOTO')
    const early = hero.indexOf('live-hero-inquire-early')
    const stats = hero.indexOf('live-hero-proof')
    expect(early).toBeGreaterThan(-1)
    expect(stats).toBeGreaterThan(early)
  })

  it('keeps GOLD hero bytes and JOIN FREE above the fold while lowering LCP payload', () => {
    expect(home).toContain('quality={58}')
    expect(home).toContain('priority')
    expect(home).toMatch(/src=\{HERO_IMAGE_SRC\}/)
    expect(home).toMatch(/label=\{HOME_JOIN_FREE\}/)
    expect(home).toMatch(/href=\{JOIN_FREE_HREF\}/)
    expect(home).toMatch(/label=\{HOME_OPEN_PLATFORM\}/)
    const fold = home.slice(home.indexOf('ep-home-fold-copy'))
    expect(fold.indexOf('HOME_OPEN_PLATFORM')).toBeGreaterThan(-1)
    expect(fold.indexOf('HOME_JOIN_FREE')).toBeGreaterThan(-1)
    expect(fold.indexOf('HOME_OPEN_PLATFORM')).toBeLessThan(fold.indexOf('HOME_JOIN_FREE'))
    expect(home).toContain('HOME_SECONDARY_CTA')
    const bytes = readFileSync(resolve(webRoot, 'public/brand/hero-evolved-architecture.png'))
    expect(createHash('md5').update(bytes).digest('hex')).toBe(HERO_IMAGE_MD5)
    expect(HERO_IMAGE_SRC).toBe('/brand/hero-evolved-architecture.png')
    expect(HOME_JOIN_FREE).toBe('Join free')
    expect(HOME_SECONDARY_CTA).toBe('See pricing')
  })
})
