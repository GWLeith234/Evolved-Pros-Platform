import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@evolved-pros/db'

export const dynamic = 'force-dynamic'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type') as NotifType | null
  const readFilter = searchParams.get('read')
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  // Unread count (always computed regardless of filters)
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  // Build query — unread first, then by created_at DESC
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, action_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (typeFilter) {
    // community filter covers both reply + mention
    if (typeFilter === 'community_reply') {
      query = query.in('type', ['community_reply', 'community_mention'])
    } else {
      query = query.eq('type', typeFilter)
    }
  }
  if (readFilter === 'true') query = query.eq('is_read', true)
  if (readFilter === 'false') query = query.eq('is_read', false)
  if (cursor) query = query.lt('created_at', cursor)

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const allRows = rows ?? []
  const hasMore = allRows.length > limit
  const page = allRows.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].created_at : null

  const notifications = page.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    actionUrl: n.action_url,
    isRead: n.is_read,
    createdAt: n.created_at,
  }))

  return NextResponse.json({ notifications, unreadCount: unreadCount ?? 0, nextCursor, hasMore })
}
