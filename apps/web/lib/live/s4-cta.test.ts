import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EM_DASH, hasEmDash } from '@/lib/home/conversion'
import {
  ANNUAL_BILLING_TOOLTIP,
  INQUIRE_BOOKING_LABEL,
  INQUIRE_BOOKING_TOOLTIP,
  SEE_EVENTS_HREF,
  SEE_EVENTS_LABEL,
  SEE_EVENTS_TOOLTIP,
  liveCtaCopyStrings,
} from './s4-cta'

describe('S4 LIVE CTA copy', () => {
  it('locks the inquire tooltip without an em dash', () => {
    expect(INQUIRE_BOOKING_LABEL).toBe('Inquire about booking')
    expect(INQUIRE_BOOKING_TOOLTIP).toBe(
      'Request speaking details. No payment or commitment.',
    )
    expect(SEE_EVENTS_LABEL).toBe('See events →')
    expect(SEE_EVENTS_HREF).toBe('/events')
    expect(SEE_EVENTS_TOOLTIP).toBe(
      'Member event details. Sign in to continue and return to this event list.',
    )
    expect(ANNUAL_BILLING_TOOLTIP).toBe('Annual billing includes two months free.')
    for (const value of liveCtaCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
    }
  })
})

describe('S4 LIVE fold wiring (source)', () => {
  const root = resolve(__dirname, '../..')
  const hero = readFileSync(resolve(root, 'components/live/LiveSplitHero.tsx'), 'utf8')
  const css = readFileSync(resolve(root, 'app/globals.css'), 'utf8')
  const upcoming = readFileSync(
    resolve(root, 'components/live/LiveUpcomingDates.tsx'),
    'utf8',
  )
  const inquireBtn = readFileSync(
    resolve(root, 'components/live/InquireBookingButton.tsx'),
    'utf8',
  )
  const pricing = readFileSync(
    resolve(root, 'app/(public)/pricing/PricingTierCards.tsx'),
    'utf8',
  )

  it('places the mobile inquire CTA above the proof row and pins a sticky bar', () => {
    const early = hero.indexOf('live-hero-inquire-early')
    const stats = hero.indexOf('live-hero-proof')
    const late = hero.indexOf('live-hero-inquire-late')
    expect(early).toBeGreaterThan(-1)
    expect(stats).toBeGreaterThan(early)
    expect(late).toBeGreaterThan(stats)
    expect(hero).toContain('INQUIRE_BOOKING_TOOLTIP')
    expect(hero).toContain('live-mobile-inquire-bar')
    expect(inquireBtn).toContain('INQUIRE_BOOKING_TOOLTIP')
  })

  it('does not lead the mobile hero with the photo', () => {
    expect(css).not.toMatch(/\.live-split-hero-photo\s*\{[^}]*order:\s*-1/)
    expect(css).toContain('.live-hero-inquire-early')
    expect(css).toContain('.live-mobile-inquire-bar')
  })

  it('exposes See events with the locked tooltip', () => {
    expect(upcoming).toContain('SEE_EVENTS_LABEL')
    expect(upcoming).toContain('SEE_EVENTS_HREF')
    expect(upcoming).toContain('SEE_EVENTS_TOOLTIP')
  })

  it('tooltips the annual billing toggle', () => {
    expect(pricing).toContain('ANNUAL_BILLING_TOOLTIP')
  })
})
