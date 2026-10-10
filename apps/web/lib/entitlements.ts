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
 *                                  Free         VIP $149      The 99 $599
 *   Media/Podcast/Community/LIVE   full         full          full
 *   Fit                            teaser       full          full
 *   Academy - all six pillars      teaser       full          full
 *   EvPros Today brief             3 headlines  full          full
 *   Mastermind                     none         none          twice a month
 *   Network directory + messages   public       full          full
 *   LIVE event discount            config       config        config
 *   Seats                          unlimited    unlimited     99
 *
 * Academy teaser = the overview of all six pillars, plus Foundation lesson 1
 * playable. Fit teaser = the marketing surface, no library. Network teaser =
 * the directory with a PUBLIC payload and no direct messages. VIP and The 99
 * both get the full profile and direct messages.
 *
 * Mastermind is The 99 only: twice a month with George. No dates. VIP does
 * not include a mastermind.
 * LIVE ticket percents are PLACEHOLDER values in lib/live/discountConfig.ts.
 * Checkout applies them. George changes the env vars, not this file.
 *
 * Importable by a client component, a server route, and a unit test.
 * LIVE percents come from lib/live/discountConfig.ts (PLACEHOLDER env).
 */

import { discountedTicketCents, liveDiscountPercent } from '@/lib/live/discountConfig'
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

export type MastermindCadence = 'none' | 'twice-month'

/** EvPros Today. `headlines` is the free three-line brief. */
export type EvprosTodayLevel = 'headlines' | 'full'

export interface Entitlements {
  /** Media, the Podcast, the Community feed and LIVE marketing. */
  media: AccessLevel
  /** Event discovery and registration. */
  events: AccessLevel
  /** Habits and Own the Day. */
  habits: AccessLevel
  /** Pillar Assessment scores, all six. */
  assessmentScores: AccessLevel
  /** The Fit library. `teaser` is the marketing page with no programming. */
  fit: AccessLevel
  /** The Academy curriculum, all six pillars. */
  academy: AccessLevel
  /**
   * Mastermind cadence, or none.
   * The 99 is `twice-month`: "Twice a month with George". No dates.
   * VIP is `none`.
   */
  mastermind: MastermindCadence
  /**
   * The member network.
   *   'teaser' - the directory is browsable, but only its public payload,
   *              and the Message button is inert.
   *   'full'   - the whole profile plus direct messages.
   * The roster stays open. A free account must not read company, bio, goals
   * or socials. VIP and The 99 both hold `full`.
   */
  network: AccessLevel
  /**
   * Percentage off a paid LIVE event ticket. Whole percent, 0 to 100.
   * PLACEHOLDER. The number is liveDiscountPercent() in
   * lib/live/discountConfig.ts, not a second copy of the rate.
   */
  liveDiscountPct: number
  /** EvPros Today brief depth. */
  evprosToday: EvprosTodayLevel
  /** Concurrent paid seats. null = unlimited. Comps are not seats. */
  seatCap: number | null
}

/**
 * THE MATRIX. Everything else in this file reads from it; nothing else in the
 * app declares a tier's contents.
 */
export const ENTITLEMENTS: Readonly<Record<TierKeyName, Entitlements>> = {
  community: {
    media: 'full',
    events: 'full',
    habits: 'full',
    assessmentScores: 'full',
    fit: 'teaser',
    academy: 'teaser',
    mastermind: 'none',
    network: 'teaser',
    liveDiscountPct: liveDiscountPercent('community'),
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
    mastermind: 'none',
    network: 'full',
    liveDiscountPct: liveDiscountPercent('vip'),
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
    liveDiscountPct: liveDiscountPercent('pro'),
    evprosToday: 'full',
    seatCap: 99,
  },
} as const

/** Human phrasing for a cadence. One place, so surfaces cannot disagree. */
export const MASTERMIND_LABELS: Record<MastermindCadence, string> = {
  none: 'Not included',
  'twice-month': 'Twice a month with George',
}

export const EVPROS_TODAY_LABELS: Record<EvprosTodayLevel, string> = {
  headlines: '3 headlines',
  full: 'Full, personalized',
}

/**
 * Card and table phrasing for a cadence.
 * The 99 label is locked: twice a month with George, with no date.
 * `none` reads as "Not included".
 */
export function mastermindDisplay(cadence: MastermindCadence): string {
  return MASTERMIND_LABELS[cadence]
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
 * DIRECT MESSAGES. VIP and The Evolved Pros 99.
 *
 * `full` means the whole profile plus the inbox. Community stays on the
 * public directory payload. The conversations routes call this function.
 */
export function canAccessNetwork(tier: string | null | undefined, tierStatus?: string | null): boolean {
  return entitlementsFor(tier, tierStatus).network === 'full'
}

/** Full EvPros Today brief. Headlines alone do not count. */
export function canAccessEvprosTodayBrief(
  tier: string | null | undefined,
  tierStatus?: string | null,
): boolean {
  return entitlementsFor(tier, tierStatus).evprosToday === 'full'
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
  if (tier == null || tier === '') return 0
  return liveDiscountPercent(effectiveTier(tier, tierStatus))
}

/** Cents for a LIVE ticket after this member's PLACEHOLDER percent. */
export function liveDiscountedCents(
  priceCents: number,
  tier: string | null | undefined,
  tierStatus?: string | null,
): number {
  return discountedTicketCents(priceCents, liveDiscountPct(tier, tierStatus))
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
    /** courses.pillar_number. Pillar 1 is Foundation even if its slug differs. */
    pillarNumber?: number | null
    sortOrder: number | null | undefined
  },
): boolean {
  if (canAccessAcademy(opts.tier, opts.tierStatus)) return true
  const teaserCourse =
    opts.pillarNumber === 1 || opts.courseSlug === ACADEMY_TEASER_COURSE_SLUG
  if (!teaserCourse) return false
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

/**
 * Whether this member may open this lesson.
 *
 * The course row still wins when the viewer already clears it. The free-tier
 * teaser is the only exception below that row, and only for someone who does
 * not already have the Academy: a VIP who fails a pro-gated row stays out.
 *
 * Migration 095 set every pillar, including Foundation, to vip. The lesson
 * page and the Mux signer kept checking that column alone, so Foundation
 * lesson 1 was specified here and never reachable.
 */
export function canOpenLesson(opts: {
  tier: string | null | undefined
  tierStatus?: string | null
  requiredTier: string | null | undefined
  courseSlug: string | null | undefined
  pillarNumber?: number | null
  sortOrder: number | null | undefined
}): boolean {
  if (meetsRowRequirement(opts.tier, opts.requiredTier, opts.tierStatus)) return true
  if (canAccessAcademy(opts.tier, opts.tierStatus)) return false
  return canPlayLesson(opts)
}

// ── Pricing surfaces ───────────────────────────────────────────────────────
// Cards and the comparison table both read these rows. A hand-kept yes/no
// array on the page cannot drift from the matrix.

export interface PricingComparisonRow {
  label: string
  cells: Record<TierKeyName, string>
}

function levelPhrase(level: AccessLevel, full: string, teaser: string): string {
  if (level === 'full') return full
  if (level === 'teaser') return teaser
  return 'Not included'
}

function row(
  label: string,
  pick: (tier: TierKeyName) => string,
): PricingComparisonRow {
  return {
    label,
    cells: {
      community: pick('community'),
      vip: pick('vip'),
      pro: pick('pro'),
    },
  }
}

/**
 * Comparison rows for /pricing. Values come from ENTITLEMENTS.
 * `monthlyDollars` is whole dollars per tier (0 for Community).
 */
export function pricingComparisonRows(
  monthlyDollars: Record<TierKeyName, number>,
): PricingComparisonRow[] {
  return [
    row('Price', tier => {
      const dollars = monthlyDollars[tier]
      return dollars === 0 ? 'Free' : `$${dollars.toLocaleString('en-US')}/mo`
    }),
    row('Community feed, Media, Podcast', tier =>
      levelPhrase(ENTITLEMENTS[tier].media, 'Yes', 'Preview')),
    row('Events and registration', tier =>
      levelPhrase(ENTITLEMENTS[tier].events, 'Yes', 'Preview')),
    row('Habits / Own the Day', tier =>
      levelPhrase(ENTITLEMENTS[tier].habits, 'Yes', 'Preview')),
    row('Pillar Assessment scores', tier =>
      levelPhrase(ENTITLEMENTS[tier].assessmentScores, 'Yes', 'Preview')),
    row('Academy', tier =>
      levelPhrase(ENTITLEMENTS[tier].academy, 'All 6 pillars', 'Preview + 1 lesson')),
    row('Assessment breakdown + pillar plan', tier =>
      ENTITLEMENTS[tier].academy === 'full' ? 'Yes' : 'Not included'),
    row('Fit library', tier =>
      levelPhrase(ENTITLEMENTS[tier].fit, 'Yes', 'Preview')),
    row('Member directory', tier =>
      levelPhrase(
        ENTITLEMENTS[tier].network,
        'Full profiles + messages',
        'Public profiles',
      )),
    row('EvPros Today brief', tier => EVPROS_TODAY_LABELS[ENTITLEMENTS[tier].evprosToday]),
    row('Mastermind', tier => mastermindDisplay(ENTITLEMENTS[tier].mastermind)),
    row('LIVE event discount', tier => {
      const pct = liveDiscountPercent(tier)
      return pct > 0 ? `${pct}% off` : 'None'
    }),
    row('Seats', tier => {
      const cap = ENTITLEMENTS[tier].seatCap
      return cap === null ? 'Unlimited' : String(cap)
    }),
  ]
}

const LOCKED_CELL = new Set(['Not included', 'None'])

/** Feature lines for one pricing card, same cells as the comparison table. */
export function tierCardLines(
  tier: TierKeyName,
  monthlyDollars: Record<TierKeyName, number>,
): Array<{ text: string; locked: boolean }> {
  return pricingComparisonRows(monthlyDollars)
    .filter(entry => entry.label !== 'Price')
    .map(entry => ({
      text: `${entry.label}: ${entry.cells[tier]}`,
      locked: LOCKED_CELL.has(entry.cells[tier]),
    }))
}

/**
 * The 99 card callout. Built from the matrix so the seat count and the
 * mastermind sentence cannot diverge from the table. No dates.
 */
export function proRoomCallout(): string {
  const line = mastermindDisplay(ENTITLEMENTS.pro.mastermind)
  const seats = ENTITLEMENTS.pro.seatCap ?? 99
  return `${line}, capped at ${seats} seats. The room is the product.`
}
