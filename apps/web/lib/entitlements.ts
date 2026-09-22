/**
 * THE ENTITLEMENT MATRIX (SPRINT L).
 *
 * One table. Every gate in the app answers from here, and no surface decides
 * for itself what a tier includes. Before this file the answer was spread
 * across lib/tier.ts ranks, courses.required_tier rows, events.required_tier
 * rows, lib/fit/gating.ts, lib/academy/gating.ts, four pricing components and
 * an invite email - which is how an invite for a FREE account ended up
 * promising the bi-weekly mastermind.
 *
 * THE KEY IS `pro`, THE NAME IS "The Evolved Pros 99".
 * users.tier is a CHECK-constrained enum of community | vip | pro, and both
 * hasTierAccess() and the Stripe webhook key off it. Renaming it would be a
 * migration plus a webhook outage, for a label. So `pro` stays the internal
 * key forever and only TIER_LABELS changes. Never render a raw tier key.
 *
 * The canonical model, superseding every earlier tier table in this repo:
 *
 *                                  Free      VIP $99       The 99 $849
 *   Media/Podcast/Community/LIVE   full      full          full
 *   Fit                            teaser    full          full
 *   Academy - all six pillars      teaser    full          full
 *   Mastermind                     -         monthly 45m   bi-weekly 90m
 *   Network directory              public    public        full
 *   Network direct messages        -         -             full
 *   LIVE event discount            0%        10%           20%
 *
 * Academy teaser = the overview of all six pillars, plus Foundation lesson 1
 * playable. Fit teaser = the marketing surface, no library. Network teaser =
 * the directory with a PUBLIC payload (SPRINT Q1) and no direct messages.
 *
 * DEPENDENCY-FREE ON PURPOSE beyond lib/tier: this module must be importable
 * by a client component, a server route and a unit test alike.
 */

import { effectiveTier, hasTierAccess } from '@/lib/tier'

/** The DB enum. Do not add to it without a migration and a webhook review. */
export const TIER_KEYS = ['community', 'vip', 'pro'] as const
export type TierKeyName = (typeof TIER_KEYS)[number]

/** What a member sees. `pro` is the key; The Evolved Pros 99 is the product. */
export const TIER_LABELS: Record<TierKeyName, string> = {
  community: 'Community',
  vip: 'VIP',
  pro: 'The Evolved Pros 99',
}

/** Short label for a chip or a badge, where the full name will not fit. */
export const TIER_SHORT_LABELS: Record<TierKeyName, string> = {
  community: 'Free',
  vip: 'VIP',
  pro: 'The 99',
}

/** How much of a surface a tier gets. `teaser` is a real state, not a denial. */
export type AccessLevel = 'none' | 'teaser' | 'full'

export type MastermindCadence = 'none' | 'monthly-45' | 'biweekly-90'

export interface Entitlements {
  /** Media, the Podcast, the Community feed and LIVE marketing. */
  media: AccessLevel
  /** The Fit library. `teaser` is the marketing page with no programming. */
  fit: AccessLevel
  /** The Academy curriculum, all six pillars. */
  academy: AccessLevel
  /** Mastermind cadence, or none. */
  mastermind: MastermindCadence
  /**
   * The member network.
   *   'teaser' - the directory is browsable, but only its public payload,
   *              and the Message button is inert.
   *   'full'   - the whole profile plus direct messages.
   * SPRINT Q1: the roster is the best conversion surface on the platform, so
   * it stays open. It is also an asset, so a competitor who signs up free in
   * thirty seconds must not be able to read company, bio, goals or socials.
   */
  network: AccessLevel
  /** Percentage off a paid LIVE event ticket. Whole percent, 0 to 100. */
  liveDiscountPct: number
}

/**
 * THE MATRIX. Everything else in this file reads from it; nothing else in the
 * app declares a tier's contents.
 */
export const ENTITLEMENTS: Readonly<Record<TierKeyName, Entitlements>> = {
  community: {
    media: 'full',
    fit: 'teaser',
    academy: 'teaser',
    mastermind: 'none',
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
} as const

/** Human phrasing for a cadence. One place, so surfaces cannot disagree. */
export const MASTERMIND_LABELS: Record<MastermindCadence, string> = {
  none: 'Not included',
  'monthly-45': 'Monthly 45-minute mastermind',
  'biweekly-90': 'Bi-weekly 90-minute mastermind',
}

/**
 * Normalize whatever the DB handed us to a tier key.
 *
 * Lowercases (rows exist as 'Pro' and 'Community'), maps the CRM's
 * 'professional' onto 'pro', and treats anything unrecognised - including
 * null - as community. FAILS CLOSED to the free tier: an unknown string must
 * never be read as an entitlement somebody did not buy.
 */
export function toTierKey(tier: string | null | undefined): TierKeyName {
  const t = (tier ?? '').trim().toLowerCase()
  if (t === 'pro' || t === 'professional') return 'pro'
  if (t === 'vip') return 'vip'
  return 'community'
}

/**
 * The entitlements a member actually holds right now.
 *
 * Runs the raw tier through effectiveTier() first, so a dead subscription
 * (unpaid / canceled / expired) collapses to community here rather than at
 * each call site. This is the ONLY function a gate needs.
 */
export function entitlementsFor(
  tier: string | null | undefined,
  tierStatus?: string | null,
): Entitlements {
  return ENTITLEMENTS[toTierKey(effectiveTier(tier, tierStatus))]
}

/** The label to render for a member's plan. Never render the raw key. */
export function tierLabel(tier: string | null | undefined): string {
  return TIER_LABELS[toTierKey(tier)]
}

export function tierShortLabel(tier: string | null | undefined): string {
  return TIER_SHORT_LABELS[toTierKey(tier)]
}

// ── Surface gates ──────────────────────────────────────────────────────────
// Each answers one product question by reading the matrix. A page asks the
// question it means ("can this member open the Fit library?") instead of
// re-deriving it from a rank comparison.

export function canAccessFit(tier: string | null | undefined, tierStatus?: string | null): boolean {
  return entitlementsFor(tier, tierStatus).fit === 'full'
}

export function canAccessAcademy(tier: string | null | undefined, tierStatus?: string | null): boolean {
  return entitlementsFor(tier, tierStatus).academy === 'full'
}

/**
 * DIRECT MESSAGES. The 99 only.
 *
 * Deliberately unchanged by SPRINT Q1: 'full' still means "can reach other
 * members", and only `pro` has it. Opening the directory did not open the
 * inbox, and the one function that guards /messages must not start meaning
 * something looser.
 */
export function canAccessNetwork(tier: string | null | undefined, tierStatus?: string | null): boolean {
  return entitlementsFor(tier, tierStatus).network === 'full'
}

/** Can this member open the directory at all? Everyone signed in can. */
export function canSeeDirectory(tier: string | null | undefined, tierStatus?: string | null): boolean {
  return entitlementsFor(tier, tierStatus).network !== 'none'
}

/**
 * Which directory payload this member may receive. The route selects columns
 * from this, so 'public' is a narrower QUERY, not a narrower render.
 */
export function directoryDetail(
  tier: string | null | undefined,
  tierStatus?: string | null,
): 'public' | 'full' {
  return canAccessNetwork(tier, tierStatus) ? 'full' : 'public'
}

export function mastermindCadence(
  tier: string | null | undefined,
  tierStatus?: string | null,
): MastermindCadence {
  return entitlementsFor(tier, tierStatus).mastermind
}

export function liveDiscountPct(
  tier: string | null | undefined,
  tierStatus?: string | null,
): number {
  return entitlementsFor(tier, tierStatus).liveDiscountPct
}

/** Cents off a LIVE ticket for this member. Rounded to a whole cent. */
export function liveDiscountedCents(
  priceCents: number,
  tier: string | null | undefined,
  tierStatus?: string | null,
): number {
  const pct = liveDiscountPct(tier, tierStatus)
  if (pct <= 0) return priceCents
  return Math.round(priceCents * (100 - pct) / 100)
}

// ── Academy teaser ─────────────────────────────────────────────────────────

/**
 * The pillar whose first lesson is playable on the free tier, and how many of
 * its lessons are. The teaser is deliberately ONE lesson: enough to show what
 * a lesson is, not enough to be the curriculum.
 */
export const ACADEMY_TEASER_COURSE_SLUG = 'foundation'
export const ACADEMY_TEASER_LESSON_COUNT = 1

/**
 * Whether a member can play a specific lesson.
 *
 * Course-level access answers it for anyone with the Academy; for everyone
 * else the only opening is the teaser lesson. `sortOrder` is the lesson's
 * position within its course, 1-based as lessons.sort_order stores it.
 *
 * FAILS CLOSED on a missing sortOrder: an unordered lesson is not the teaser.
 */
export function canPlayLesson(
  opts: {
    tier: string | null | undefined
    tierStatus?: string | null
    courseSlug: string | null | undefined
    sortOrder: number | null | undefined
  },
): boolean {
  if (canAccessAcademy(opts.tier, opts.tierStatus)) return true
  if (opts.courseSlug !== ACADEMY_TEASER_COURSE_SLUG) return false
  return typeof opts.sortOrder === 'number' && opts.sortOrder <= ACADEMY_TEASER_LESSON_COUNT
}

/**
 * The tier a member must reach to open a surface, for upgrade copy. Reads the
 * matrix rather than hardcoding, so a future re-tier moves the CTA with it.
 */
export function requiredTierFor(
  surface: 'fit' | 'academy' | 'network',
): TierKeyName {
  for (const key of TIER_KEYS) {
    if (ENTITLEMENTS[key][surface] === 'full') return key
  }
  return 'pro'
}

/**
 * Bridge to the legacy rank helper for rows that still carry their own
 * required_tier (events.required_tier, courses.required_tier). Those columns
 * are data an admin can edit per row, so they stay authoritative for their
 * own row; this wrapper just keeps the comparison in one place.
 */
export function meetsRowRequirement(
  tier: string | null | undefined,
  requiredTier: string | null | undefined,
  tierStatus?: string | null,
): boolean {
  return hasTierAccess(effectiveTier(tier, tierStatus), requiredTier)
}
