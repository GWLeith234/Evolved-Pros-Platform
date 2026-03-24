import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsContent } from './NotificationsContent'
import type { NotifItemData } from '@/components/notifications/NotifItem'
import type { Database } from '@evolved-pros/db'

export const dynamic = 'force-dynamic'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('notifications')
    .select('id, type, title, body, action_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const notifications: NotifItemData[] = (rows ?? []).map(n => ({
    id: n.id,
    type: n.type as NotifType,
    title: n.title,
    body: n.body,
    actionUrl: n.action_url,
    isRead: n.is_read,
    createdAt: n.created_at,
  }))

  // Compute per-type unread badge counts
  const typeCounts = notifications.reduce<Partial<Record<string, number>>>((acc, n) => {
    if (!n.isRead) {
      const key = n.type === 'community_mention' ? 'community_reply' : n.type
      acc[key] = (acc[key] ?? 0) + 1
      acc['all'] = (acc['all'] ?? 0) + 1
    }
    return acc
  }, {})

  return (
    <NotificationsContent
      initialNotifications={notifications}
      unreadCount={unreadCount ?? 0}
      typeCounts={typeCounts}
    />
  )
}
