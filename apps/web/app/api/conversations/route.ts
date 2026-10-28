import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { canAccessNetwork } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

/** public.users.id. Filter syntax (commas, parentheses) is not an id. */
const MEMBER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CONVERSATION_COLUMNS =
  'id, participant_one_id, participant_two_id, last_message_at, created_at'

/**
 * Both orderings of a pair. Equality filters stay parameterized — the
 * service role bypasses RLS, so a string .or() built from request input
 * would be the only thing standing between two members' threads.
 */
async function findConversation(senderId: string, otherId: string) {
  const { data: forward } = await adminClient
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('participant_one_id', senderId)
    .eq('participant_two_id', otherId)
    .maybeSingle()
  if (forward) return forward

  const { data: reverse } = await adminClient
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('participant_one_id', otherId)
    .eq('participant_two_id', senderId)
    .maybeSingle()
  return reverse
}

/**
 * SPRINT Q1 - the authoritative DM gate.
 *
 * /messages renders an upgrade state, but this route is directly reachable,
 * so the server has to refuse independently. Gating only the page would let
 * anybody with curl open a conversation with any member.
 */
async function refuseWithoutNetwork(): Promise<Response | null> {
  const profile = await resolveCurrentUser(createClient())
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canAccessNetwork(profile.tier, (profile as unknown as { tier_status?: string | null }).tier_status)) {
    return NextResponse.json(
      { error: 'Direct messages are part of The Evolved Pros 99.' },
      { status: 403 },
    )
  }
  return null
}

export async function GET() {
  const refused = await refuseWithoutNetwork()
  if (refused) return refused

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
    const { data: profiles } = await adminClient
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
  // Opening a conversation is the write this gate exists for.
  const refused = await refuseWithoutNetwork()
  if (refused) return refused

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { recipientId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''
  if (!recipientId) return NextResponse.json({ error: 'recipientId is required' }, { status: 422 })
  // Commas and parentheses are PostgREST filter syntax. Reject them before
  // this id is used on the service-role client, which bypasses RLS.
  if (!MEMBER_ID.test(recipientId)) {
    return NextResponse.json({ error: 'recipientId must be a member id' }, { status: 422 })
  }

  // RLS-FIX: conversations.participant_one_id / participant_two_id both FK
  // public.users(id). Resolve current user's public.users.id by email.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  const senderId = profile?.id ?? user.id

  const { data: recipient } = await adminClient
    .from('users')
    .select('id')
    .eq('id', recipientId)
    .maybeSingle()
  if (!recipient) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (recipient.id === senderId) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 422 })
  const otherId = recipient.id

  const existing = await findConversation(senderId, otherId)
  if (existing) return NextResponse.json(existing)

  // Insert new conversation with current user as participant_one
  const { data: created, error } = await adminClient
    .from('conversations')
    .insert({
      participant_one_id: senderId,
      participant_two_id: otherId,
    } as never)
    .select(CONVERSATION_COLUMNS)
    .single()

  if (error || !created) {
    const retry = await findConversation(senderId, otherId)
    if (retry) return NextResponse.json(retry)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }

  return NextResponse.json(created, { status: 201 })
}
