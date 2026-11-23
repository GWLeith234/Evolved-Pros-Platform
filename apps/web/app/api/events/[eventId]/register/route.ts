export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import { sendEventConfirmationEmail } from '@/lib/resend/emails/event-confirmation'

// Count is the number of event_rsvps rows, written under a row lock.
// Call this only after an insert or delete returned a row. The floor is 0.
async function syncRegistrationCount(eventId: string): Promise<number | null> {
  const { data, error } = await adminClient.rpc('set_event_registration_count', {
    p_event_id: eventId,
  })
  if (error || typeof data !== 'number' || !Number.isFinite(data)) return null
  return Math.max(0, data)
}

export async function POST(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS-FIX: resolve public.users.id by email — event_registrations.user_id
  // and notifications.user_id both FK public.users(id).
  const { data: profile } = await adminClient
    .from('users')
    .select('id, tier, points, email, display_name, full_name')
    .eq('email', user.email)
    .single()
  const userId = profile?.id ?? user.id

  const [eventResult, existingReg] = await Promise.all([
    adminClient
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, required_tier, registration_count, is_published')
      .eq('id', params.eventId)
      .single(),
    adminClient
      .from('event_rsvps')
      .select('event_id')
      .eq('event_id', params.eventId)
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const event = eventResult.data

  if (!event || !event.is_published) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
  if (new Date(event.starts_at) <= new Date()) {
    return NextResponse.json({ error: 'Event has already started' }, { status: 422 })
  }
  if (!hasTierAccess(profile?.tier, event.required_tier as 'community' | 'vip' | 'pro' | null)) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }
  if (existingReg.data) {
    return NextResponse.json({ error: 'Already registered' }, { status: 409 })
  }

  // A conflict returns an error and no row. Do not touch the shared count
  // unless this insert created the RSVP.
  const { data: inserted, error: regError } = await adminClient
    .from('event_rsvps')
    .insert({ event_id: params.eventId, user_id: userId })
    .select('event_id')

  if (regError?.code === '23505') {
    return NextResponse.json({ error: 'Already registered' }, { status: 409 })
  }
  if (regError || !inserted?.length) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }

  const registrationCount = await syncRegistrationCount(params.eventId)
  if (registrationCount === null) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }

  // Award 25 points
  if (profile) {
    await adminClient
      .from('users')
      .update({ points: profile.points + 25 })
      .eq('id', userId)
  }

  // Create event_reminder notification (24h before)
  const reminderAt = new Date(new Date(event.starts_at).getTime() - 24 * 60 * 60 * 1000)
  if (reminderAt > new Date()) {
    await adminClient.from('notifications').insert({
      user_id: userId,
      type: 'event_reminder',
      title: `Reminder: ${event.title}`,
      body: `Your event "${event.title}" starts tomorrow. Don't miss it.`,
      action_url: `/events/${params.eventId}`,
      // Note: is_read stays false until the cron sends and marks it
    } as never)
  }

  // Send confirmation email (fire-and-forget)
  if (profile?.email) {
    sendEventConfirmationEmail({
      email: profile.email,
      displayName: profile.display_name ?? profile.full_name ?? 'Member',
      event: {
        id: event.id,
        title: event.title,
        eventType: event.event_type as 'live' | 'virtual' | 'inperson',
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        zoomUrl: event.zoom_url,
        description: event.description,
      },
    }).catch(() => { /* non-fatal */ })
  }

  return NextResponse.json({ registered: true, registrationCount })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS-FIX: resolve public.users.id for FK filters.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  const userId = profile?.id ?? user.id

  const { data: event } = await adminClient
    .from('events')
    .select('registration_count, starts_at')
    .eq('id', params.eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Service role bypasses RLS. A delete that matches nobody else's row
  // also matches zero rows when this member was never registered. Only a
  // returned row proves the RSVP was theirs, so the shared counter moves
  // only then. Repeating DELETE must not walk registration_count to zero.
  const { data: removed, error } = await adminClient
    .from('event_rsvps')
    .delete()
    .eq('event_id', params.eventId)
    .eq('user_id', userId)
    .select('event_id')

  if (error) return NextResponse.json({ error: 'Unregister failed' }, { status: 500 })

  if (!removed || removed.length === 0) {
    return NextResponse.json({
      registered: false,
      registrationCount: event.registration_count,
    })
  }

  const registrationCount = await syncRegistrationCount(params.eventId)
  if (registrationCount === null) {
    return NextResponse.json({ error: 'Unregister failed' }, { status: 500 })
  }

  // Remove this member's unread reminder. Not another member's.
  await adminClient
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('type', 'event_reminder')
    .eq('action_url', `/events/${params.eventId}`)
    .eq('is_read', false)

  return NextResponse.json({ registered: false, registrationCount })
}
