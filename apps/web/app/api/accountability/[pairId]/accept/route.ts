export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

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

  // Only the invited person (partner_id) can accept
  if ((pair as Record<string, unknown>).partner_id !== user.id) {
    return NextResponse.json({ error: 'Only the invited member can accept' }, { status: 403 })
  }

  if ((pair as Record<string, unknown>).status !== 'pending') {
    return NextResponse.json({ error: 'Pair is not in pending state' }, { status: 409 })
  }

  const { data: updated, error: updateErr } = await adminClient
    .from('accountability_pairs')
    .update({ status: 'active', paired_at: new Date().toISOString() })
    .eq('id', params.pairId)
    .select('id, user_id, partner_id, course_id, status, paired_at, created_at')
    .single()

  if (updateErr || !updated) {
    console.error('[PATCH /api/accountability/[pairId]/accept]', updateErr)
    return NextResponse.json({ error: updateErr?.message ?? 'Failed to accept' }, { status: 500 })
  }

  return NextResponse.json({ pair: updated })
}
