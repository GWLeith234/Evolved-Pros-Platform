export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

function getCurrentMonday(): string {
  const now  = new Date()
  const day  = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon  = new Date(now)
  mon.setDate(now.getDate() + diff)
  return mon.toISOString().split('T')[0]
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pairId = searchParams.get('pair_id')
  if (!pairId) return NextResponse.json({ error: 'pair_id required' }, { status: 422 })

  // Verify membership
  const { data: pair } = await adminClient
    .from('accountability_pairs')
    .select('id, user_id, partner_id')
    .eq('id', pairId)
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .maybeSingle()

  if (!pair) return NextResponse.json({ error: 'Pair not found or access denied' }, { status: 404 })

  const { data: checkins, error } = await adminClient
    .from('partner_checkins')
    .select('id, user_id, pair_id, week_start, commitment, outcome, note, created_at')
    .eq('pair_id', pairId)
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(8)

  if (error) {
    console.error('[GET /api/partner-checkins]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ checkins: checkins ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pairId     = typeof body.pair_id    === 'string' ? body.pair_id.trim()    : null
  const commitment = typeof body.commitment === 'string' ? body.commitment.trim() : null
  const outcome    = typeof body.outcome    === 'string' ? body.outcome            : null
  const note       = typeof body.note       === 'string' ? body.note.trim()       : null
  const weekStart  = typeof body.week_start === 'string' ? body.week_start        : getCurrentMonday()

  if (!pairId) return NextResponse.json({ error: 'pair_id is required' }, { status: 422 })
  if (outcome && !['kept', 'partial', 'missed'].includes(outcome)) {
    return NextResponse.json({ error: 'outcome must be kept, partial, or missed' }, { status: 422 })
  }

  // Verify membership in pair
  const { data: pair } = await adminClient
    .from('accountability_pairs')
    .select('id')
    .eq('id', pairId)
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq('status', 'active')
    .maybeSingle()

  if (!pair) return NextResponse.json({ error: 'Pair not found or not active' }, { status: 404 })

  const { data, error } = await adminClient
    .from('partner_checkins')
    .upsert(
      {
        user_id:    user.id,
        pair_id:    pairId,
        week_start: weekStart,
        commitment,
        outcome,
        note,
      },
      { onConflict: 'user_id,week_start' },
    )
    .select('id, user_id, pair_id, week_start, commitment, outcome, note, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/partner-checkins]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save check-in' }, { status: 500 })
  }

  return NextResponse.json({ checkin: data }, { status: 201 })
}
