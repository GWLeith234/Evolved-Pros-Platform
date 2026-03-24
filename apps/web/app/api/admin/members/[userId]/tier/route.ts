import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

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
  const validTiers    = ['community', 'pro', null]
  const validStatuses = ['active', 'trial', 'cancelled', 'expired']

  if (tier !== undefined && !validTiers.includes(tier as string | null)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 422 })
  }
  if (tierStatus !== undefined && !validStatuses.includes(tierStatus as string)) {
    return NextResponse.json({ error: 'Invalid tierStatus' }, { status: 422 })
  }

  const supabase = createClient()
  const update: Record<string, unknown> = {}
  if (tier !== undefined)       update.tier        = tier
  if (tierStatus !== undefined) update.tier_status = tierStatus

  const { error } = await supabase
    .from('users')
    .update(update)
    .eq('id', params.userId)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
