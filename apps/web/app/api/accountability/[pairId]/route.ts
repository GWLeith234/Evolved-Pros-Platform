export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// PATCH: cancel (inviter) or decline (partner) — sets status=inactive
export async function PATCH(
  _request: Request,
  { params }: { params: { pairId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pair, error: fetchErr } = await adminClient
    .from('accountability_pairs')
    .select('id, user_id, partner_id, status')
    .eq('id', params.pairId)
    .single()

  if (fetchErr || !pair) return NextResponse.json({ error: 'Pair not found' }, { status: 404 })

  const p = pair as Record<string, unknown>
  // Both the inviter and the partner may cancel/end the relationship
  if (p.user_id !== user.id && p.partner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: updated, error: updateErr } = await adminClient
    .from('accountability_pairs')
    .update({ status: 'inactive' })
    .eq('id', params.pairId)
    .select('id, status')
    .single()

  if (updateErr || !updated) {
    console.error('[PATCH /api/accountability/[pairId]]', updateErr)
    return NextResponse.json({ error: updateErr?.message ?? 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ pair: updated })
}
