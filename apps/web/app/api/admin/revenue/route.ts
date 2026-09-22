/**
 * GET /api/admin/revenue — real MRR, read from Stripe (SPRINT K).
 *
 * This used to return hardcoded zeros behind TODO(VENDASTA-4), pointing at
 * billing_events as the eventual source. billing_events turned out to be an
 * idempotency ledger (event id, type, timestamp — no amounts), so it could
 * never have answered this. Stripe is the source now.
 *
 * `available: false` is NOT zero revenue — it means Stripe could not be
 * reached. The client must render those two states differently.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { getRevenueSnapshot } from '@/lib/stripe/revenue'
import { centsToDollars } from '@/lib/stripe/mrr'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const snap = await getRevenueSnapshot()

  return NextResponse.json({
    available: snap.available,
    currentMrr: centsToDollars(snap.mrrCents),
    currentMrrCents: snap.mrrCents,
    // Paying subscribers per tier — Stripe subscriptions, never roster tiers.
    proCount: snap.paidByTier.professional,
    vipCount: snap.paidByTier.vip,
    communityCount: snap.communityCount,
    proMrr: centsToDollars(snap.mrrByTier.professional),
    vipMrr: centsToDollars(snap.mrrByTier.vip),
    communityMrr: 0,
    /** Paid-tier access that nobody is billed for: comps, guests, grants. */
    compedCount: snap.compedCount,
    paidCount: snap.paidCount,
    // Month-over-month history needs a stored series; Stripe's API does not
    // hand one over. Deliberately empty rather than reconstructed from
    // today's subscriptions, which would draw a flat line that looks like data.
    churnThisMonth: 0,
    months: [],
  })
}
