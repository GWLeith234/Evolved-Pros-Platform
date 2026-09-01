/**
 * SPRINT TIER-1 — the tier storefront: labels, upgrade links, and the
 * weakest-pillar selection used by the assessment results banner.
 *
 * Access decisions themselves are NOT made here. Every "can this member open
 * this?" question goes through hasTierAccess(userTier, course.required_tier)
 * in lib/tier.ts, reading the tier off the DB row — never a raw string
 * compare, never a pillar-number range.
 *
 * This module only answers the presentation questions that follow an access
 * decision: which badge does a locked card wear, and where does it link.
 */

export type Tier = 'community' | 'vip' | 'pro'

/**
 * The approved tier model, mirroring supabase/migrations/078.
 *
 * DOCUMENTATION + TEST FIXTURE ONLY. The runtime source of truth is the
 * courses.required_tier column: this constant is not consulted by any page or
 * route, so an admin re-opening a pillar in the DB takes effect immediately
 * without a deploy. It exists so the gating matrix test can assert the shipped
 * model, and so a reader can see it without opening psql.
 */
export const PILLAR_REQUIRED_TIER: Readonly<Record<number, Tier>> = {
  1: 'community', // Foundation
  2: 'vip',       // Identity          ┐ the inner game
  3: 'vip',       // Mental Toughness  ┘
  4: 'pro',       // Strategy          ┐
  5: 'pro',       // Accountability    ├ the outer game
  6: 'pro',       // Execution         ┘
}

/** Uppercase chip text for a gate. 'community' is never a gate, so null. */
export function tierBadgeLabel(requiredTier: string | null | undefined): 'VIP' | 'PRO' | null {
  const t = (requiredTier ?? '').toLowerCase()
  if (t === 'vip') return 'VIP'
  if (t === 'pro') return 'PRO'
  return null
}

/** Human sentence-case name of the plan that opens a gate. */
export function tierPlanName(requiredTier: string | null | undefined): string {
  const t = (requiredTier ?? '').toLowerCase()
  if (t === 'vip') return 'VIP'
  if (t === 'pro') return 'Professional'
  return 'Community'
}

export type UpgradeSource = 'academy' | 'events' | 'assessment'

/**
 * Canonical upgrade link. /pricing reads these params to headline the exact
 * thing the member just bumped into ("Unlock Mental Toughness with VIP") —
 * copy only; no checkout state is carried in the URL.
 *
 * Params are emitted in a fixed order (from, pillar, tier) so links are stable
 * strings and therefore assertable in tests.
 */
export function buildUpgradeHref(opts: {
  from: UpgradeSource
  tier: string | null | undefined
  /** Pillar number 1-6, when the gate is a specific pillar. */
  pillar?: number | null
}): string {
  const params = new URLSearchParams()
  params.set('from', opts.from)
  if (opts.pillar != null && opts.pillar >= 1 && opts.pillar <= 6) {
    params.set('pillar', String(opts.pillar))
  }
  const tier = (opts.tier ?? '').toLowerCase()
  if (tier === 'vip' || tier === 'pro') params.set('tier', tier)
  return `/pricing?${params.toString()}`
}

// ── Assessment ───────────────────────────────────────────────────────────

export interface PillarScore {
  pillarNumber: number
  /** 0-100. null when the member has not audited this pillar yet. */
  score: number | null
}

/**
 * The pillar to point a member at first: the lowest score they have.
 *
 * DETERMINISTIC ON TIES — the earliest pillar wins. The six pillars are an
 * ordered progression (Foundation before Identity before Mental Toughness),
 * so on a tie the earlier one is both the pedagogically correct answer and a
 * stable one: the banner must not flip between renders of the same data.
 *
 * Un-scored pillars are skipped rather than treated as zero; returns null when
 * nothing has been scored.
 */
export function selectWeakestPillar(scores: PillarScore[]): PillarScore | null {
  let weakest: PillarScore | null = null
  for (const entry of scores) {
    if (entry.score == null) continue
    if (
      weakest === null ||
      entry.score < weakest.score! ||
      (entry.score === weakest.score! && entry.pillarNumber < weakest.pillarNumber)
    ) {
      weakest = entry
    }
  }
  return weakest
}

/** Mean of the scored pillars, rounded. null when nothing is scored. */
export function overallScore(scores: PillarScore[]): number | null {
  const scored = scores.filter(s => s.score != null) as { pillarNumber: number; score: number }[]
  if (scored.length === 0) return null
  return Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length)
}
