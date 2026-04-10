import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch conversations where user is a participant
  const { data: rows, error } = await supabase
    .from('conversations')
    .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })

  const convRows = rows ?? []

  // Collect the other participant IDs
  const otherIds = convRows.map(c =>
    c.participant_one_id === user.id ? c.participant_two_id : c.participant_one_id
  )

  // Fetch user profiles for other participants
  const uniqueIds = [...new Set(otherIds)]
  const profileMap: Record<string, { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null }> = {}

  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url')
      .in('id', uniqueIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  // Fetch last message body for each conversation
  const convIds = convRows.map(c => c.id)
  const lastMsgMap: Record<string, { body: string; created_at: string }> = {}

  if (convIds.length > 0) {
    // Get last message per conversation
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, body, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })

    // Group by conversation, keep only first (latest) per conversation
    const seen = new Set<string>()
    for (const m of lastMsgs ?? []) {
      if (!seen.has(m.conversation_id)) {
        seen.add(m.conversation_id)
        lastMsgMap[m.conversation_id] = { body: m.body, created_at: m.created_at }
      }
    }
  }

  // Fetch unread counts per conversation for current user
  const unreadMap: Record<string, number> = {}
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

  const conversations = convRows.map(c => {
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

  return NextResponse.json({ conversations })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recipientId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const recipientId = typeof body.recipientId === 'string' ? body.recipientId : null
  if (!recipientId) return NextResponse.json({ error: 'recipientId is required' }, { status: 422 })
  if (recipientId === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 422 })

  // Try both orderings since UNIQUE constraint enforces (participant_one_id, participant_two_id)
  // Check if conversation already exists in either ordering
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
    .or(
      `and(participant_one_id.eq.${user.id},participant_two_id.eq.${recipientId}),and(participant_one_id.eq.${recipientId},participant_two_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing)
  }

  // Insert new conversation with current user as participant_one
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      participant_one_id: user.id,
      participant_two_id: recipientId,
    })
    .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
    .single()

  if (error || !created) {
    // Race condition: try to fetch again
    const { data: retry } = await supabase
      .from('conversations')
      .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
      .or(
        `and(participant_one_id.eq.${user.id},participant_two_id.eq.${recipientId}),and(participant_one_id.eq.${recipientId},participant_two_id.eq.${user.id})`
      )
      .maybeSingle()

    if (retry) return NextResponse.json(retry)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }

  return NextResponse.json(created, { status: 201 })
}
