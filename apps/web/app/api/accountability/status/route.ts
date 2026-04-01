export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')

  // Find active or pending pair for this user (and optional course)
  let query = adminClient
    .from('accountability_pairs')
    .select('id, user_id, partner_id, course_id, status, paired_at, created_at')
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (courseId) query = query.eq('course_id', courseId)

  const { data: pair, error: pairErr } = await query.maybeSingle()

  if (pairErr) {
    console.error('[GET /api/accountability/status]', pairErr)
    return NextResponse.json({ error: pairErr.message }, { status: 500 })
  }

  if (!pair) {
    return NextResponse.json({ state: 'no-partner', pair: null, partner: null, myCheckins: [], partnerCheckins: [] })
  }

  // Determine state from the user's perspective
  const isSender   = pair.user_id    === user.id
  const isReceiver = pair.partner_id === user.id
  let state: string
  if (pair.status === 'active') {
    state = 'active'
  } else if (isSender) {
    state = 'pending-sent'
  } else {
    state = 'pending-received'
  }

  // Fetch partner profile
  const partnerId = isSender ? pair.partner_id : pair.user_id
  const { data: partner } = await adminClient
    .from('users')
    .select('id, display_name, full_name, avatar_url, email')
    .eq('id', partnerId)
    .single()

  // Fetch last 4 checkins for auth user
  const { data: myCheckins } = await adminClient
    .from('partner_checkins')
    .select('id, user_id, pair_id, week_start, commitment, outcome, note, created_at')
    .eq('pair_id', pair.id)
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(4)

  // Fetch partner's last 1 checkin (for read-only display)
  const { data: partnerCheckins } = await adminClient
    .from('partner_checkins')
    .select('id, user_id, pair_id, week_start, commitment, outcome, note, created_at')
    .eq('pair_id', pair.id)
    .eq('user_id', partnerId)
    .order('week_start', { ascending: false })
    .limit(1)

  return NextResponse.json({
    state,
    pair,
    partner: partner ?? null,
    myCheckins:      myCheckins      ?? [],
    partnerCheckins: partnerCheckins ?? [],
  })
}
