import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { logAdminAction } from '@/lib/admin/audit'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tier, tierStatus } = body
  const validTiers    = ['community', 'vip', 'pro', null]
  const validStatuses = ['active', 'trial', 'cancelled', 'expired']

  if (tier !== undefined && !validTiers.includes(tier as string | null)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 422 })
  }
  if (tierStatus !== undefined && !validStatuses.includes(tierStatus as string)) {
    return NextResponse.json({ error: 'Invalid tierStatus' }, { status: 422 })
  }

  // RLS-FIX: use adminClient for both the audit-log read and the write.
  // The role-gate already happened in requireAdminApi() above.
  const { data: before } = await adminClient
    .from('users')
    .select('tier, tier_status')
    .eq('id', params.userId)
    .single()

  const update: Record<string, unknown> = {}
  if (tier !== undefined)       update.tier        = tier
  if (tierStatus !== undefined) update.tier_status = tierStatus

  const { error } = await adminClient
    .from('users')
    .update(update)
    .eq('id', params.userId)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  // Audit log
  logAdminAction({
    adminId:      check.userId,
    action:       tierStatus === 'cancelled' ? 'suspend_member' : 'update_tier',
    targetUserId: params.userId,
    details: {
      before: { tier: before?.tier, tierStatus: before?.tier_status },
      after:  { tier: tier ?? before?.tier, tierStatus: tierStatus ?? before?.tier_status },
    },
  })

  return NextResponse.json({ ok: true })
}
