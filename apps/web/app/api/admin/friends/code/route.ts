export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

// PATCH /api/admin/friends/code — toggle the FRIENDSOFGEORGE comp code on/off.
// Body: { active: boolean }. When inactive, validate_promo_code() (Sprint O)
// stops returning it, so new redemptions are blocked without deleting anything.
export async function PATCH(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: { active?: unknown }
  try {
    body = (await request.json()) as { active?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'active must be a boolean.' }, { status: 422 })
  }

  const { data, error } = await (adminClient as any)
    .from('promo_codes')
    .update({ active: body.active })
    .eq('code', 'FRIENDSOFGEORGE')
    .select('active')
    .maybeSingle()
  if (error || !data) {
    return NextResponse.json({ error: 'Could not update the code.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, active: data.active })
}
