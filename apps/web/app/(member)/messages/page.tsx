import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessagesClient } from './MessagesClient'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch initial conversation list
  const { data: convRows } = await supabase
    .from('conversations')
    .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const rows = convRows ?? []

  // Get other participant IDs
  const otherIds = rows.map(c =>
    c.participant_one_id === user.id ? c.participant_two_id : c.participant_one_id
  )
  const uniqueIds = [...new Set(otherIds)]

  let profileMap: Record<string, { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null }> = {}
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url')
      .in('id', uniqueIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  // Get last messages
  const convIds = rows.map(c => c.id)
  let lastMsgMap: Record<string, { body: string; created_at: string }> = {}
  if (convIds.length > 0) {
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, body, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
    const seen = new Set<string>()
    for (const m of lastMsgs ?? []) {
      if (!seen.has(m.conversation_id)) {
        seen.add(m.conversation_id)
        lastMsgMap[m.conversation_id] = { body: m.body, created_at: m.created_at }
      }
    }
  }

  // Get unread counts
  let unreadMap: Record<string, number> = {}
  if (convIds.length > 0) {
    const { data: unreadRows } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null)
    for (const r of unreadRows ?? []) {
      unreadMap[r.conversation_id] = (unreadMap[r.conversation_id] ?? 0) + 1
    }
  }

  const conversations = rows.map(c => {
    const otherId = c.participant_one_id === user.id ? c.participant_two_id : c.participant_one_id
    const other = profileMap[otherId]
    const lastMsg = lastMsgMap[c.id]
    return {
      id: c.id,
      lastMessageAt: c.last_message_at,
      createdAt: c.created_at,
      otherParticipant: {
        id: otherId,
        displayName: other?.display_name ?? other?.full_name ?? 'Member',
        avatarUrl: other?.avatar_url ?? null,
      },
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageAt2: lastMsg?.created_at ?? null,
      unreadCount: unreadMap[c.id] ?? 0,
    }
  })

  const currentUser = {
    id: profile.id,
    displayName: profile.display_name ?? profile.full_name ?? 'Me',
    avatarUrl: profile.avatar_url ?? null,
  }

  return <MessagesClient initialConversations={conversations} currentUser={currentUser} />
}
