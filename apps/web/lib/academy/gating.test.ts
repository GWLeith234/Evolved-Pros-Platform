import { describe, it, expect } from 'vitest'
import { hasTierAccess } from '@/lib/tier'
import {
  PILLAR_REQUIRED_TIER,
  buildUpgradeHref,
  overallScore,
  selectWeakestPillar,
  tierBadgeLabel,
  tierPlanName,
  type PillarScore,
  type Tier,
} from '@/lib/academy/gating'

// ── The gating matrix ────────────────────────────────────────────────────
//
// SPRINT TIER-1. Every viewer tier (including a logged-out / tier-less
// visitor) crossed with every pillar's required_tier. This is the shipped
// product model: free gets Foundation, VIP gets the inner game, Pro gets all
// six. A change to lib/tier.ts or to the 078 seed that breaks the model breaks
// this table first.

const VIEWER_TIERS = ['community', 'vip', 'pro', null] as const

const EXPECTED: Record<string, Record<number, boolean>> = {
  //          P1     P2     P3     P4     P5     P6
  community: { 1: true,  2: false, 3: false, 4: false, 5: false, 6: false },
  vip:       { 1: true,  2: true,  3: true,  4: false, 5: false, 6: false },
  pro:       { 1: true,  2: true,  3: true,  4: true,  5: true,  6: true  },
  null:      { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
}

describe('academy gating matrix — hasTierAccess(userTier, course.required_tier)', () => {
  for (const viewer of VIEWER_TIERS) {
    const key = viewer ?? 'null'
    for (const pillar of [1, 2, 3, 4, 5, 6]) {
      const required = PILLAR_REQUIRED_TIER[pillar]
      const expected = EXPECTED[key][pillar]
      it(`${key} viewer ${expected ? 'opens' : 'is gated from'} pillar ${pillar} (${required})`, () => {
        expect(hasTierAccess(viewer, required)).toBe(expected)
      })
    }
  }

  it('shipped model is 1 community / 2 vip / 3 pro', () => {
    const values = Object.values(PILLAR_REQUIRED_TIER)
    expect(values.filter(t => t === 'community')).toHaveLength(1)
    expect(values.filter(t => t === 'vip')).toHaveLength(2)
    expect(values.filter(t => t === 'pro')).toHaveLength(3)
  })

  it('documents that an unrecognised required_tier ranks 0 and so reads as open', () => {
    // hasTierAccess ranks an unknown tier string at 0, so a typo'd
    // required_tier would open a course to every signed-in member. The guard
    // against that is the CHECK constraint in migration 078 (which rejects
    // anything outside community|vip|pro at write time), NOT this function.
    // Pinned here so a future change to lib/tier.ts is a deliberate one.
    expect(hasTierAccess('community', 'enterprise')).toBe(true)
    // A tier-less viewer is still denied — that check runs first.
    expect(hasTierAccess(null, 'enterprise')).toBe(false)
  })

  it('tier comparison is case-insensitive on both sides', () => {
    expect(hasTierAccess('VIP', 'vip')).toBe(true)
    expect(hasTierAccess('vip', 'PRO')).toBe(false)
  })
})

// ── Locked-card link construction ────────────────────────────────────────

describe('buildUpgradeHref', () => {
  it('builds the academy locked-card link with pillar + tier', () => {
    expect(buildUpgradeHref({ from: 'academy', tier: 'vip', pillar: 3 }))
      .toBe('/pricing?from=academy&pillar=3&tier=vip')
    expect(buildUpgradeHref({ from: 'academy', tier: 'pro', pillar: 6 }))
      .toBe('/pricing?from=academy&pillar=6&tier=pro')
  })

  it('builds the events chip link without a pillar', () => {
    expect(buildUpgradeHref({ from: 'events', tier: 'pro' }))
      .toBe('/pricing?from=events&tier=pro')
  })

  it('builds the assessment banner link', () => {
    expect(buildUpgradeHref({ from: 'assessment', tier: 'vip', pillar: 2 }))
      .toBe('/pricing?from=assessment&pillar=2&tier=vip')
  })

  it('normalises tier casing and drops non-gating tiers', () => {
    expect(buildUpgradeHref({ from: 'academy', tier: 'VIP', pillar: 2 }))
      .toBe('/pricing?from=academy&pillar=2&tier=vip')
    expect(buildUpgradeHref({ from: 'academy', tier: 'community', pillar: 1 }))
      .toBe('/pricing?from=academy&pillar=1')
    expect(buildUpgradeHref({ from: 'events', tier: null }))
      .toBe('/pricing?from=events')
  })

  it('drops out-of-range pillar numbers', () => {
    expect(buildUpgradeHref({ from: 'academy', tier: 'pro', pillar: 0 }))
      .toBe('/pricing?from=academy&tier=pro')
    expect(buildUpgradeHref({ from: 'academy', tier: 'pro', pillar: 7 }))
      .toBe('/pricing?from=academy&tier=pro')
  })
})

describe('locked-card links for the shipped six pillars', () => {
  // The exact hrefs CourseCard / AcademyMobileProgress / PillarLockPanel emit
  // for a community-tier viewer looking at the grid: 1 open, 2 VIP, 3 PRO.
  const lockedForFreeTier = [2, 3, 4, 5, 6]

  it('every gated pillar links to its own pricing context', () => {
    const links = lockedForFreeTier.map(n =>
      buildUpgradeHref({ from: 'academy', tier: PILLAR_REQUIRED_TIER[n], pillar: n }),
    )
    expect(links).toEqual([
      '/pricing?from=academy&pillar=2&tier=vip',
      '/pricing?from=academy&pillar=3&tier=vip',
      '/pricing?from=academy&pillar=4&tier=pro',
      '/pricing?from=academy&pillar=5&tier=pro',
      '/pricing?from=academy&pillar=6&tier=pro',
    ])
  })

  it('pillar 1 is open to the free tier, so it never renders a locked link', () => {
    expect(hasTierAccess('community', PILLAR_REQUIRED_TIER[1])).toBe(true)
  })

  it('badges the grid 2×VIP / 3×PRO for a free member', () => {
    const badges = lockedForFreeTier.map(n => tierBadgeLabel(PILLAR_REQUIRED_TIER[n]))
    expect(badges.filter(b => b === 'VIP')).toHaveLength(2)
    expect(badges.filter(b => b === 'PRO')).toHaveLength(3)
  })

  it('badges the grid 3×PRO for a VIP member', () => {
    const lockedForVip = [1, 2, 3, 4, 5, 6].filter(
      n => !hasTierAccess('vip', PILLAR_REQUIRED_TIER[n]),
    )
    expect(lockedForVip).toEqual([4, 5, 6])
    expect(lockedForVip.map(n => tierBadgeLabel(PILLAR_REQUIRED_TIER[n])))
      .toEqual(['PRO', 'PRO', 'PRO'])
  })

  it('locks nothing for a Pro member', () => {
    const locked = [1, 2, 3, 4, 5, 6].filter(n => !hasTierAccess('pro', PILLAR_REQUIRED_TIER[n]))
    expect(locked).toEqual([])
  })
})

describe('tier labels', () => {
  it('labels the two gates and nothing else', () => {
    expect(tierBadgeLabel('vip')).toBe('VIP')
    expect(tierBadgeLabel('pro')).toBe('PRO')
    expect(tierBadgeLabel('community')).toBeNull()
    expect(tierBadgeLabel(null)).toBeNull()
  })

  it('names the plan that opens a gate', () => {
    expect(tierPlanName('vip')).toBe('VIP')
    expect(tierPlanName('pro')).toBe('Professional')
    expect(tierPlanName('community')).toBe('Community')
  })
})

// ── Weakest-pillar selection ─────────────────────────────────────────────

const scores = (...vals: (number | null)[]): PillarScore[] =>
  vals.map((score, i) => ({ pillarNumber: i + 1, score }))

describe('selectWeakestPillar', () => {
  it('picks the single lowest score', () => {
    expect(selectWeakestPillar(scores(80, 72, 40, 91, 65, 77)))
      .toEqual({ pillarNumber: 3, score: 40 })
  })

  it('picks the EARLIEST pillar on a tie — deterministic', () => {
    expect(selectWeakestPillar(scores(80, 40, 55, 40, 65, 40)))
      .toEqual({ pillarNumber: 2, score: 40 })
  })

  it('is stable when every pillar ties', () => {
    expect(selectWeakestPillar(scores(60, 60, 60, 60, 60, 60)))
      .toEqual({ pillarNumber: 1, score: 60 })
  })

  it('does not depend on input order', () => {
    const reversed = [...scores(80, 40, 55, 40, 65, 40)].reverse()
    expect(selectWeakestPillar(reversed)).toEqual({ pillarNumber: 2, score: 40 })
  })

  it('skips un-scored pillars rather than treating them as zero', () => {
    expect(selectWeakestPillar(scores(null, 70, null, 55, null, null)))
      .toEqual({ pillarNumber: 4, score: 55 })
  })

  it('handles a genuine zero score', () => {
    expect(selectWeakestPillar(scores(0, 70, 80, 55, 60, 90)))
      .toEqual({ pillarNumber: 1, score: 0 })
  })

  it('returns null when nothing is scored', () => {
    expect(selectWeakestPillar(scores(null, null, null, null, null, null))).toBeNull()
    expect(selectWeakestPillar([])).toBeNull()
  })
})

describe('overallScore', () => {
  it('averages the scored pillars', () => {
    expect(overallScore(scores(60, 70, 80, 90, 50, 40))).toBe(65)
  })

  it('ignores un-scored pillars in the denominator', () => {
    expect(overallScore(scores(60, 80, null, null, null, null))).toBe(70)
  })

  it('returns null when nothing is scored', () => {
    expect(overallScore(scores(null, null, null, null, null, null))).toBeNull()
  })
})

// Type-level guard: PILLAR_REQUIRED_TIER must only ever hold real tiers.
const _typecheck: Tier[] = Object.values(PILLAR_REQUIRED_TIER)
void _typecheck
