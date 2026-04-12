import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { logAdminAction } from '@/lib/admin/audit'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type NotifType = 'system_general' | 'event_reminder' | 'course_unlock' | 'system_billing' | 'community_reply' | 'community_mention'
type Audience = 'all' | 'vip' | 'pro'

export async function POST(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, message, audience, type, actionUrl } = body

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 422 })
  }
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 500) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 422 })
  }
  const validAudiences: Audience[] = ['all', 'vip', 'pro']
  if (!validAudiences.includes(audience as Audience)) {
    return NextResponse.json({ error: 'Invalid audience' }, { status: 422 })
  }

  const validTypes: NotifType[] = ['system_general', 'event_reminder', 'course_unlock', 'system_billing', 'community_reply', 'community_mention']
  if (!validTypes.includes(type as NotifType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 422 })
  }

  const supabase = createClient()
  let query = supabase
    .from('users')
    .select('id')
    .in('tier_status', ['active', 'trial'])
    .neq('role', 'admin')

  if (audience === 'vip') query = query.eq('tier', 'vip')
  if (audience === 'pro')       query = query.eq('tier', 'pro')

  const { data: targetUsers } = await query

  if (!targetUsers || targetUsers.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const notifications = targetUsers.map(u => ({
    user_id:    u.id,
    type:       type as NotifType,
    title:      title.trim(),
    body:       message.trim(),
    action_url: typeof actionUrl === 'string' && actionUrl.trim() ? actionUrl.trim() : null,
    is_read:    false,
  }))

  const { error } = await adminClient.from('notifications').insert(notifications)
  if (error) return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })

  logAdminAction({
    adminId: check.userId,
    action:  'broadcast',
    details: { audience, type, title: title.trim(), recipientCount: targetUsers.length },
  })

  return NextResponse.json({ sent: targetUsers.length })
}
