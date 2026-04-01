export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const partnerEmail = typeof body.partner_email === 'string' ? body.partner_email.trim().toLowerCase() : null
  const courseId     = typeof body.course_id     === 'string' ? body.course_id.trim()                   : null

  if (!partnerEmail) return NextResponse.json({ error: 'partner_email is required' }, { status: 422 })
  if (!courseId)     return NextResponse.json({ error: 'course_id is required' },     { status: 422 })
  if (partnerEmail === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 422 })
  }

  // Look up partner by email
  const { data: partner, error: lookupErr } = await adminClient
    .from('users')
    .select('id, display_name, full_name, email')
    .ilike('email', partnerEmail)
    .maybeSingle()

  if (lookupErr) {
    console.error('[POST /api/accountability/invite] lookup error:', lookupErr)
    return NextResponse.json({ error: lookupErr.message }, { status: 500 })
  }
  if (!partner) {
    return NextResponse.json({ error: 'No member found with that email address' }, { status: 404 })
  }

  // Check for existing active/pending pair between these two users
  const { data: existing } = await adminClient
    .from('accountability_pairs')
    .select('id, status')
    .or(`and(user_id.eq.${user.id},partner_id.eq.${partner.id}),and(user_id.eq.${partner.id},partner_id.eq.${user.id})`)
    .in('status', ['active', 'pending'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An active or pending pair already exists with this member' }, { status: 409 })
  }

  // Insert pair
  const { data: pair, error: pairErr } = await adminClient
    .from('accountability_pairs')
    .insert({
      user_id:    user.id,
      partner_id: partner.id,
      course_id:  courseId,
      status:     'pending',
    })
    .select('id, user_id, partner_id, course_id, status, paired_at, created_at')
    .single()

  if (pairErr || !pair) {
    console.error('[POST /api/accountability/invite] insert error:', pairErr)
    return NextResponse.json({ error: pairErr?.message ?? 'Failed to create invite' }, { status: 500 })
  }

  // Notify the partner
  const inviterName = user.user_metadata?.full_name
    ?? user.user_metadata?.display_name
    ?? user.email
    ?? 'A member'

  await adminClient.from('notifications').insert({
    user_id:    partner.id,
    type:       'accountability_invite',
    title:      'Accountability Partner Invite',
    body:       `${inviterName} wants to be your accountability partner`,
    action_url: '/academy/accountability',
    is_read:    false,
  }).then(({ error }) => {
    if (error) console.warn('[POST /api/accountability/invite] notification error:', error)
  })

  return NextResponse.json({ pair, partner }, { status: 201 })
}
