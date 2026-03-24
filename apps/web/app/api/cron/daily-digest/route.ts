import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendDigestEmail } from '@/lib/resend/emails/digest'
import type { DigestNotification } from '@/lib/resend/emails/DigestEmail'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find users with community_reply set to 'digest'
  const { data: users } = await adminClient
    .from('users')
    .select('id, email, display_name, full_name, notification_preferences')
    .not('notification_preferences', 'is', null)

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const digestUsers = users.filter(u => {
    const prefs = u.notification_preferences as Record<string, string> | null
    return prefs?.community_reply === 'digest' || prefs?.community_mention === 'digest'
  })

  if (digestUsers.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Cutoff: last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  let sent = 0

  for (const user of digestUsers) {
    if (!user.email) continue

    const { data: notifications } = await adminClient
      .from('notifications')
      .select('id, type, title, body, action_url, created_at')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (!notifications || notifications.length === 0) continue

    const digestNotifs: DigestNotification[] = notifications.map(n => ({
      id:        n.id,
      type:      n.type,
      title:     n.title,
      body:      n.body,
      actionUrl: n.action_url,
      createdAt: n.created_at,
    }))

    const displayName = user.display_name ?? user.full_name ?? 'Member'

    try {
      await sendDigestEmail({
        email:         user.email,
        displayName,
        notifications: digestNotifs,
        date:          today,
      })

      // Mark these notifications as read (emailed)
      await adminClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', digestNotifs.map(n => n.id))

      sent++
    } catch {
      // continue on individual user failures
    }
  }

  return NextResponse.json({ sent })
}
