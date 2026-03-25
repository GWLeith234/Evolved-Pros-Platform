export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import { sendEventConfirmationEmail } from '@/lib/resend/emails/event-confirmation'

export async function POST(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [eventResult, profileResult, existingReg] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, required_tier, registration_count, is_published')
      .eq('id', params.eventId)
      .single(),
    supabase
      .from('users')
      .select('tier, points, email, display_name, full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('event_id', params.eventId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const event = eventResult.data
  const profile = profileResult.data

  if (!event || !event.is_published) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
  if (new Date(event.starts_at) <= new Date()) {
    return NextResponse.json({ error: 'Event has already started' }, { status: 422 })
  }
  if (!hasTierAccess(profile?.tier, event.required_tier as 'community' | 'pro' | null)) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }
  if (existingReg.data) {
    return NextResponse.json({ error: 'Already registered' }, { status: 409 })
  }

  // Register
  const { error: regError } = await supabase
    .from('event_registrations')
    .insert({ event_id: params.eventId, user_id: user.id })

  if (regError) return NextResponse.json({ error: 'Registration failed' }, { status: 500 })

  // Increment registration_count
  await supabase
    .from('events')
    .update({ registration_count: event.registration_count + 1 })
    .eq('id', params.eventId)

  // Award 25 points
  if (profile) {
    await supabase
      .from('users')
      .update({ points: profile.points + 25 })
      .eq('id', user.id)
  }

  // Create event_reminder notification (24h before)
  const reminderAt = new Date(new Date(event.starts_at).getTime() - 24 * 60 * 60 * 1000)
  if (reminderAt > new Date()) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'event_reminder',
      title: `Reminder: ${event.title}`,
      body: `Your event "${event.title}" starts tomorrow. Don't miss it.`,
      action_url: `/events/${params.eventId}`,
      // Note: is_read stays false until the cron sends and marks it
    })
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

  return NextResponse.json({ registered: true, registrationCount: event.registration_count + 1 })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await supabase
    .from('events')
    .select('registration_count, starts_at')
    .eq('id', params.eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', params.eventId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Unregister failed' }, { status: 500 })

  const newCount = Math.max(0, event.registration_count - 1)
  await supabase
    .from('events')
    .update({ registration_count: newCount })
    .eq('id', params.eventId)

  // Remove reminder notification
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('type', 'event_reminder')
    .eq('action_url', `/events/${params.eventId}`)
    .eq('is_read', false)

  return NextResponse.json({ registered: false, registrationCount: newCount })
}
