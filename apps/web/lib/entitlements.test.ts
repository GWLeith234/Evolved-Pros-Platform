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
  canOpenLesson,
  canPlayLesson,
  entitlementsFor,
  liveDiscountPct,
  liveDiscountedCents,
  mastermindCadence,
  pricingComparisonRows,
  proRoomCallout,
  requiredTierFor,
  tierCardLines,
  tierLabel,
  toTierKey,
} from './entitlements'
import { TIERS } from './pricing'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

describe('the canonical matrix', () => {
  // This is the card's table, transcribed. If a row here has to change, the
  // product changed - not the implementation.
  it('matches the approved tier model exactly', () => {
    expect(ENTITLEMENTS).toEqual({
      community: {
        media: 'full',
        events: 'full',
        habits: 'full',
        assessmentScores: 'full',
        fit: 'teaser',
        academy: 'teaser',
        mastermind: 'none',
        network: 'teaser',
        liveDiscountPct: 0,
        evprosToday: 'headlines',
        seatCap: null,
      },
      vip: {
        media: 'full',
        events: 'full',
        habits: 'full',
        assessmentScores: 'full',
        fit: 'full',
        academy: 'full',
        mastermind: 'monthly-45',
        network: 'full',
        liveDiscountPct: 10,
        evprosToday: 'full',
        seatCap: null,
      },
      pro: {
        media: 'full',
        events: 'full',
        habits: 'full',
        assessmentScores: 'full',
        fit: 'full',
        academy: 'full',
        mastermind: 'twice-month',
        network: 'full',
        liveDiscountPct: 20,
        evprosToday: 'full',
        seatCap: 99,
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
    expect(ENTITLEMENTS.vip.network).toBe('full')
    expect(ENTITLEMENTS.vip.network).toBe(ENTITLEMENTS.pro.network)
    expect(ENTITLEMENTS.vip.evprosToday).toBe('full')
    expect(ENTITLEMENTS.community.evprosToday).toBe('headlines')
    expect(ENTITLEMENTS.vip.mastermind).not.toBe(ENTITLEMENTS.pro.mastermind)
    expect(ENTITLEMENTS.pro.seatCap).toBe(99)
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

  it('gates direct messages at VIP, and Community does not get them', () => {
    expect(canAccessNetwork('community')).toBe(false)
    expect(canAccessNetwork('vip')).toBe(true)
    expect(canAccessNetwork('pro')).toBe(true)
    expect(requiredTierFor('network')).toBe('vip')
  })

  it('gives each tier its mastermind cadence', () => {
    expect(mastermindCadence('community')).toBe('none')
    expect(mastermindCadence('vip')).toBe('monthly-45')
    expect(mastermindCadence('pro')).toBe('twice-month')
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

  it('opens Foundation lesson 1 on a vip course row, and nothing else', () => {
    expect(canOpenLesson({
      tier: 'community',
      requiredTier: 'vip',
      courseSlug: 'foundation',
      sortOrder: 1,
    })).toBe(true)
    expect(canOpenLesson({
      tier: 'community',
      requiredTier: 'vip',
      courseSlug: 'foundation',
      sortOrder: 2,
    })).toBe(false)
    expect(canOpenLesson({
      tier: 'community',
      requiredTier: 'vip',
      courseSlug: 'identity',
      sortOrder: 1,
    })).toBe(false)
    // Pillar 1 is Foundation even when the stored slug is not the word.
    expect(canOpenLesson({
      tier: 'community',
      requiredTier: 'vip',
      courseSlug: 'p1-foundation',
      pillarNumber: 1,
      sortOrder: 1,
    })).toBe(true)
  })

  it('does not let the teaser override a row the viewer fails while already having the Academy', () => {
    expect(canOpenLesson({
      tier: 'vip',
      requiredTier: 'pro',
      courseSlug: 'foundation',
      sortOrder: 1,
    })).toBe(false)
    expect(canOpenLesson({
      tier: 'vip',
      requiredTier: 'vip',
      courseSlug: 'execution',
      sortOrder: 4,
    })).toBe(true)
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
    const lesson = read('../app/(member)/academy/[pillarSlug]/[lessonSlug]/page.tsx')
    const mux = read('../app/api/lessons/[lessonId]/mux-token/route.ts')
    expect(lesson).toContain('canOpenLesson')
    expect(mux).toContain('canOpenLesson')
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
    const cards = read('../app/(public)/pricing/PricingTierCards.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    expect(cards).toContain('tierCardLines')
    expect(cards).not.toContain('Academy Pillar 1: Foundation')
    expect(cards).not.toContain('Professional')
    expect(cards).not.toContain('Weekly mastermind')
    expect(cards).not.toContain('1:1 time with George')
    const dollars = {
      community: TIERS.community.monthly,
      vip: TIERS.vip.monthly,
      pro: TIERS.professional.monthly,
    }
    const community = tierCardLines('community', dollars).map(line => line.text).join('\n')
    const vip = tierCardLines('vip', dollars).map(line => line.text).join('\n')
    const pro = tierCardLines('pro', dollars).map(line => line.text).join('\n')
    expect(community).toContain('Preview + 1 lesson')
    expect(community).not.toContain('All 6 pillars')
    expect(vip).toContain('All 6 pillars')
    expect(vip).toContain('10% off')
    expect(vip).toContain('Monthly 45-minute mastermind')
    expect(vip).toContain('Full profiles + messages')
    expect(vip).toContain('Full, personalized')
    expect(pro).toContain('20% off')
    expect(pro).toContain('Twice a month with George')
    expect(pro).not.toContain('Bi-weekly')
    expect(pro).toContain('99')
    expect(proRoomCallout()).toBe(
      'Twice a month with George, capped at 99 seats. The room is the product.',
    )
    const labels = pricingComparisonRows(dollars).map(row => row.label)
    expect(labels).toEqual([
      'Price',
      'Community feed, Media, Podcast',
      'Events and registration',
      'Habits / Own the Day',
      'Pillar Assessment scores',
      'Academy',
      'Assessment breakdown + pillar plan',
      'Fit library',
      'Member directory',
      'EvPros Today brief',
      'Mastermind',
      'LIVE event discount',
      'Seats',
    ])
  })
})
