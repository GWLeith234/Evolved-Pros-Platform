import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEventReminderEmail } from '@/lib/resend/emails/event-reminder'
import type { EventType } from '@/lib/events/types'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  // Find events starting in the next 24–25 hours
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, event_type, starts_at, ends_at, zoom_url')
    .eq('is_published', true)
    .gte('starts_at', in24h.toISOString())
    .lte('starts_at', in25h.toISOString())

  if (!events || events.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const event of events) {
    // Get all registrations for this event
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('user_id, users(email, display_name, full_name)')
      .eq('event_id', event.id)

    for (const reg of regs ?? []) {
      const u = reg.users as { email: string; display_name: string | null; full_name: string | null } | null
      if (!u?.email) continue

      try {
        await sendEventReminderEmail({
          email: u.email,
          displayName: u.display_name ?? u.full_name ?? 'Member',
          event: {
            id: event.id,
            title: event.title,
            eventType: event.event_type as EventType,
            startsAt: event.starts_at,
            endsAt: event.ends_at,
            zoomUrl: event.zoom_url,
            description: event.description,
          },
        })
        sent++
      } catch {
        // continue on individual failures
      }
    }

    // Mark reminder notifications as read/sent
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('type', 'event_reminder')
      .eq('action_url', `/events/${event.id}`)
  }

  return NextResponse.json({ sent })
}
