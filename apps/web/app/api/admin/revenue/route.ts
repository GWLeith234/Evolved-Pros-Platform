import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  // TODO(VENDASTA-4): wire this to billing_events. The previous source
  // (vendasta_webhooks) is deprecated and empty — do not invent revenue
  // numbers here and do not wire Stripe in this sprint.
  return NextResponse.json({
    currentMrr: 0,
    proCount: 0,
    vipCount: 0,
    communityCount: 0,
    proMrr: 0,
    vipMrr: 0,
    communityMrr: 0,
    churnThisMonth: 0,
    months: [],
  })
}
