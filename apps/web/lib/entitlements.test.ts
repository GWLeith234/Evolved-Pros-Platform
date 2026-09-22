import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_TEASER_LESSON_COUNT,
  ENTITLEMENTS,
  TIER_KEYS,
  TIER_LABELS,
  canAccessAcademy,
  canAccessFit,
  canAccessNetwork,
  canPlayLesson,
  entitlementsFor,
  liveDiscountPct,
  liveDiscountedCents,
  mastermindCadence,
  requiredTierFor,
  tierLabel,
  toTierKey,
} from './entitlements'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

describe('the canonical matrix', () => {
  // This is the card's table, transcribed. If a row here has to change, the
  // product changed - not the implementation.
  it('matches the approved tier model exactly', () => {
    expect(ENTITLEMENTS).toEqual({
      community: {
        media: 'full',
        fit: 'teaser',
        academy: 'teaser',
        mastermind: 'none',
        // SPRINT Q1 - the directory is open to everyone, with a public
        // payload and no direct messages. 'teaser', not 'none'.
        network: 'teaser',
        liveDiscountPct: 0,
      },
      vip: {
        media: 'full',
        fit: 'full',
        academy: 'full',
        mastermind: 'monthly-45',
        network: 'teaser',
        liveDiscountPct: 10,
      },
      pro: {
        media: 'full',
        fit: 'full',
        academy: 'full',
        mastermind: 'biweekly-90',
        network: 'full',
        liveDiscountPct: 20,
      },
    })
  })

  it('gives every tier the open surfaces in full', () => {
    for (const key of TIER_KEYS) {
      expect(ENTITLEMENTS[key].media, key).toBe('full')
    }
  })

  it('separates the tiers on the room, not on the coursework', () => {
    // VIP and The 99 hold identical Academy and Fit access. Everything that
    // distinguishes them is access to George and to each other.
    expect(ENTITLEMENTS.vip.academy).toBe(ENTITLEMENTS.pro.academy)
    expect(ENTITLEMENTS.vip.fit).toBe(ENTITLEMENTS.pro.fit)
    expect(ENTITLEMENTS.vip.mastermind).not.toBe(ENTITLEMENTS.pro.mastermind)
    expect(ENTITLEMENTS.vip.network).not.toBe(ENTITLEMENTS.pro.network)
    expect(ENTITLEMENTS.vip.liveDiscountPct).toBeLessThan(ENTITLEMENTS.pro.liveDiscountPct)
  })
})

describe('the key stays `pro`, the name becomes The Evolved Pros 99', () => {
  it('keeps the DB enum untouched', () => {
    // users.tier is CHECK-constrained to these three, and the Stripe webhook
    // writes them. Renaming the key is a migration plus a webhook outage.
    expect(TIER_KEYS).toEqual(['community', 'vip', 'pro'])
  })

  it('renders the product name, never the raw key', () => {
    expect(TIER_LABELS.pro).toBe('The Evolved Pros 99')
    expect(tierLabel('pro')).toBe('The Evolved Pros 99')
    expect(tierLabel('professional')).toBe('The Evolved Pros 99')
    expect(tierLabel('vip')).toBe('VIP')
  })
})

describe('toTierKey fails closed', () => {
  it('accepts the shapes the DB actually stores', () => {
    expect(toTierKey('Pro')).toBe('pro')
    expect(toTierKey(' VIP ')).toBe('vip')
    expect(toTierKey('professional')).toBe('pro')
  })

  it('treats null and anything unrecognised as the free tier', () => {
    // An unknown string must never read as an entitlement nobody bought.
    for (const bad of [null, undefined, '', 'enterprise', 'legacy-gold', 'admin']) {
      expect(toTierKey(bad), String(bad)).toBe('community')
    }
  })
})

describe('entitlementsFor respects a dead subscription', () => {
  it('collapses an unpaid or cancelled member to the free tier', () => {
    for (const status of ['unpaid', 'canceled', 'cancelled', 'expired']) {
      // The free tier's network is 'teaser' since SPRINT Q1, so a lapsed
      // member of The 99 keeps the directory and loses the inbox - which is
      // exactly what collapsing to the free tier now means.
      expect(entitlementsFor('pro', status).network, status).toBe('teaser')
      expect(canAccessNetwork('pro', status), status).toBe(false)
      expect(entitlementsFor('vip', status).academy, status).toBe('teaser')
    }
  })

  it('keeps access during the past_due grace window', () => {
    expect(entitlementsFor('vip', 'past_due').academy).toBe('full')
  })
})

describe('surface gates', () => {
  it('gates Fit at VIP', () => {
    expect(canAccessFit('community')).toBe(false)
    expect(canAccessFit('vip')).toBe(true)
    expect(canAccessFit('pro')).toBe(true)
    expect(requiredTierFor('fit')).toBe('vip')
  })

  it('gates the Academy at VIP', () => {
    expect(canAccessAcademy('community')).toBe(false)
    expect(canAccessAcademy('vip')).toBe(true)
    expect(canAccessAcademy('pro')).toBe(true)
    expect(requiredTierFor('academy')).toBe('vip')
  })

  it('gates direct messages at The 99, and VIP does NOT get them', () => {
    // SPRINT Q1 opened the directory but NOT the inbox. canAccessNetwork is
    // unchanged and still means "can reach other members".
    expect(canAccessNetwork('community')).toBe(false)
    expect(canAccessNetwork('vip')).toBe(false)
    expect(canAccessNetwork('pro')).toBe(true)
    expect(requiredTierFor('network')).toBe('pro')
  })

  it('gives each tier its mastermind cadence', () => {
    expect(mastermindCadence('community')).toBe('none')
    expect(mastermindCadence('vip')).toBe('monthly-45')
    expect(mastermindCadence('pro')).toBe('biweekly-90')
  })
})

describe('LIVE event discount', () => {
  it('is 0 / 10 / 20 percent', () => {
    expect(liveDiscountPct('community')).toBe(0)
    expect(liveDiscountPct('vip')).toBe(10)
    expect(liveDiscountPct('pro')).toBe(20)
  })

  it('applies to a ticket price in cents', () => {
    expect(liveDiscountedCents(50000, 'community')).toBe(50000)
    expect(liveDiscountedCents(50000, 'vip')).toBe(45000)
    expect(liveDiscountedCents(50000, 'pro')).toBe(40000)
  })

  it('never returns a fractional cent', () => {
    const cents = liveDiscountedCents(9999, 'vip')
    expect(Number.isInteger(cents)).toBe(true)
    expect(cents).toBe(8999)
  })
})

describe('the Academy teaser is one lesson, not one pillar', () => {
  it('opens Foundation lesson 1 and nothing else to the free tier', () => {
    expect(ACADEMY_TEASER_LESSON_COUNT).toBe(1)
    expect(canPlayLesson({ tier: 'community', courseSlug: 'foundation', sortOrder: 1 })).toBe(true)
    expect(canPlayLesson({ tier: 'community', courseSlug: 'foundation', sortOrder: 2 })).toBe(false)
    expect(canPlayLesson({ tier: null, courseSlug: 'foundation', sortOrder: 1 })).toBe(true)
  })

  it('does not open lesson 1 of any other pillar', () => {
    for (const slug of ['identity', 'mental-toughness', 'strategic-approach', 'execution']) {
      expect(canPlayLesson({ tier: 'community', courseSlug: slug, sortOrder: 1 }), slug).toBe(false)
    }
  })

  it('fails closed on a missing course slug or sort order', () => {
    expect(canPlayLesson({ tier: 'community', courseSlug: null, sortOrder: 1 })).toBe(false)
    expect(canPlayLesson({ tier: 'community', courseSlug: 'foundation', sortOrder: undefined })).toBe(false)
  })
})

describe('no tier logic lives outside the matrix', () => {
  it('routes Fit and the Academy page through entitlements, not a rank compare', () => {
    const fit = read('./fit/gating.ts')
    expect(fit).toContain("from '@/lib/entitlements'")
    expect(fit).not.toContain('hasTierAccess')

    const academy = read('../app/(member)/academy/page.tsx')
    expect(academy).toContain('canAccessAcademy')
    // This asked for 'pro', which showed the upgrade card to paying VIPs.
    expect(academy).not.toContain("hasTierAccess(profile?.tier, 'pro')")
  })

  it('keeps the invite email off the seat-capped mastermind', () => {
    // Live bug: a FREE invite promised "Professional" access and the
    // bi-weekly mastermind, which is The 99's $849 entitlement and is capped
    // at 99 seats. Comps do not consume a Stripe seat, so that promise could
    // seat an unlimited number of people in a room that sells 99.
    const invite = read('./resend/emails/FriendInvite.tsx')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    expect(invite).not.toContain('bi-weekly mastermind')
    expect(invite).not.toContain('Professional')
  })

  it('stops the free pricing card claiming a whole pillar', () => {
    // Comments stripped: the file records which tier it retired.
    const cards = read('../app/(public)/pricing/PricingTierCards.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    expect(cards).not.toContain('Academy Pillar 1: Foundation')
    expect(cards).toContain('first lesson playable')
    // VIP carries the whole curriculum now, and the 99 carries the room.
    expect(cards).toContain('The full Academy, all six pillars')
    expect(cards).toContain('10% off LIVE events')
    expect(cards).toContain('20% off LIVE events')
    expect(cards).not.toContain('Professional')
  })
})
