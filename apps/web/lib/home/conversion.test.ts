import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { TIERS } from '@/lib/pricing'
import {
  EM_DASH,
  HERO_IMAGE_ALT,
  HERO_IMAGE_HEIGHT,
  HERO_IMAGE_SRC,
  HERO_IMAGE_WIDTH,
  HOME_ARIA,
  HOME_BOOK,
  HOME_H1,
  HOME_JOIN_FREE,
  HOME_LADDER,
  HOME_LADDER_LINE,
  HOME_NAV_LINKS,
  HOME_PRIMARY_CTA,
  HOME_SECONDARY_CTA,
  HOME_SUB,
  HOME_TITLE,
  JOIN_FREE_HREF,
  SEE_PRICING_HREF,
  conversionCopyStrings,
  hasEmDash,
  homeEpisodeKicker,
  homeEpisodeMeta,
} from './conversion'

describe('conversion homepage locks', () => {
  it('uses the locked title, promise, and CTA labels', () => {
    expect(HOME_TITLE).toBe(
      'Evolved Pros | The daily operating system for sales professionals',
    )
    expect(HOME_H1).toBe('The daily operating system for sales professionals.')
    expect(HOME_SUB).toBe(
      'Everything but the curriculum is free. The Academy is what you upgrade for.',
    )
    expect(HOME_PRIMARY_CTA).toBe('Join free. Full community, no card')
    expect(HOME_SECONDARY_CTA).toBe('See pricing')
    expect(HOME_LADDER_LINE).toBe(
      'Start free. Upgrade when the Academy is the next step.',
    )
    expect(HOME_ARIA).toBe('Evolved Pros home')
    expect(HERO_IMAGE_ALT).toBe('The Evolved Architecture')
    expect(HERO_IMAGE_SRC).toBe('/brand/hero-evolved-architecture.png')
    expect(HERO_IMAGE_WIDTH / HERO_IMAGE_HEIGHT).toBe(1.5)
  })

  it('sends primary Join free to signup, not /pricing or the /join 308', () => {
    expect(JOIN_FREE_HREF).toBe('/login?mode=signup')
    expect(SEE_PRICING_HREF).toBe('/pricing')
    expect(HOME_LADDER[0]?.href).toBe(JOIN_FREE_HREF)
    expect(HOME_LADDER[0]?.cta).toBe(HOME_JOIN_FREE)
    for (const href of [JOIN_FREE_HREF, HOME_LADDER[0]!.href]) {
      expect(href).not.toBe('/join')
      expect(href).not.toBe('/pricing')
    }
  })

  it('keeps the $49 / $249 sequence and does not feature Professional', () => {
    expect(TIERS.vip.monthly).toBe(49)
    expect(TIERS.professional.monthly).toBe(249)
    expect(HOME_LADDER.map(c => c.name)).toEqual(['Community', 'VIP', 'Professional'])
    expect(HOME_LADDER[1]?.price).toBe('$49 / mo')
    expect(HOME_LADDER[2]?.price).toBe('$249 / mo')
    expect(HOME_LADDER[0]?.featured).toBe(true)
    expect(HOME_LADDER[1]?.featured).toBe(false)
    expect(HOME_LADDER[2]?.featured).toBe(false)
    expect(HOME_LADDER[1]?.href).toBe(SEE_PRICING_HREF)
    expect(HOME_LADDER[2]?.href).toBe(SEE_PRICING_HREF)
  })

  it('nav is logo doors plus LIVE to /live, with no Book George', () => {
    expect(HOME_NAV_LINKS.map(l => [l.label, l.href])).toEqual([
      ['Podcast', '/podcast'],
      ['Media', '/media'],
      ['Academy', '/academy'],
      ['LIVE', '/live'],
    ])
    const blob = conversionCopyStrings().join(' ').toLowerCase()
    expect(blob).not.toContain('book george')
    expect(blob).not.toContain('keynote')
    expect(HOME_BOOK.href).toBe(BOOK_PREORDER_PATH)
    expect(HOME_BOOK.release).toBe('Out 15 Sep.')
  })

  it('has zero U+2014 on title, meta, copy, and aria', () => {
    for (const value of conversionCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
    }
  })
})

describe('conversion homepage layout contracts', () => {
  it('reserves the architecture hero box and keeps JOIN FREE off the wrapping nav', () => {
    const src = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../components/home/ConversionHome.tsx'),
      'utf8',
    )
    expect(src).toMatch(/aspect-\[3\/2\]/)
    expect(src).toMatch(/HERO_IMAGE_WIDTH/)
    expect(src).toMatch(/JOIN_FREE_HREF/)
    expect(src).toMatch(/shrink-0 items-center bg-red/)
    expect(src).toMatch(/flex h-10 items-center justify-between/)
    expect(src).not.toMatch(
      /header[\s\S]{0,80}flex max-w-6xl flex-wrap items-center justify-between/,
    )
  })
})

describe('home episode display', () => {
  it('pads the EP kicker and joins date + duration without an em dash', () => {
    expect(homeEpisodeKicker(7)).toBe('EP 007')
    expect(homeEpisodeKicker(null)).toBe('EPISODE')
    const meta = homeEpisodeMeta('2026-09-02T12:00:00Z', 65 * 60)
    expect(meta).toBe('SEP 2 · 65 MIN')
    expect(hasEmDash(meta)).toBe(false)
  })
})
