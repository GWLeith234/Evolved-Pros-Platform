import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { notifyNewDm } from '@/lib/notifications/create'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversationId = params.id
  const userId = profile.id
  const { searchParams } = new URL(request.url)
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )
  const beforeCreatedAt = searchParams.get('beforeCreatedAt')
  const beforeId = searchParams.get('beforeId')

  const { data: conversation } = await adminClient
    .from('conversations')
    .select('id, participant_one_id, participant_two_id')
    .eq('id', conversationId)
    .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Newest-first page, then reverse for chronological display.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (adminClient as any)
    .from('messages')
    .select('id, conversation_id, sender_id, body, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (beforeCreatedAt && beforeId) {
    // Cursor: (created_at, id) strictly older than the bound.
    query = query.or(
      `created_at.lt.${beforeCreatedAt},and(created_at.eq.${beforeCreatedAt},id.lt.${beforeId})`,
    )
  }

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })

  const pageDesc = (rows ?? []) as Array<{
    id: string
    conversation_id: string
    sender_id: string
    body: string
    read_at: string | null
    created_at: string
  }>
  const hasMore = pageDesc.length > limit
  const slice = hasMore ? pageDesc.slice(0, limit) : pageDesc
  const messages = [...slice].reverse()

  const oldest = messages[0]
  const nextCursor = hasMore && oldest
    ? { createdAt: oldest.created_at, id: oldest.id }
    : null

  // Mark unread from the other party as read (only on the latest page / no cursor).
  if (!beforeCreatedAt) {
    const unreadIds = messages
      .filter(m => m.sender_id !== userId && !m.read_at)
      .map(m => m.id)
    if (unreadIds.length > 0) {
      void adminClient
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)
        .then(({ error: markError }) => {
          if (markError) console.warn('[messages] mark read failed:', markError.message)
        })
    }
  }

  return NextResponse.json({ messages, nextCursor, hasMore })
}

/** Mark a single inbound message as read — used by realtime instead of full GET. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { messageId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const messageId = typeof body.messageId === 'string' ? body.messageId : null
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 422 })

  const { data: conversation } = await adminClient
    .from('conversations')
    .select('id')
    .eq('id', params.id)
    .or(`participant_one_id.eq.${profile.id},participant_two_id.eq.${profile.id}`)
    .maybeSingle()
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const { error } = await adminClient
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('conversation_id', params.id)
    .neq('sender_id', profile.id)

  if (error) return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversationId = params.id
  const senderId = profile.id

  const { data: conversation } = await adminClient
    .from('conversations')
    .select('id, participant_one_id, participant_two_id, last_message_at')
    .eq('id', conversationId)
    .or(`participant_one_id.eq.${senderId},participant_two_id.eq.${senderId}`)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  let body: { body?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messageBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (!messageBody) return NextResponse.json({ error: 'body is required' }, { status: 422 })
  if (messageBody.length > 2000) return NextResponse.json({ error: 'Message too long' }, { status: 422 })

  const { data: message, error } = await adminClient
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: messageBody,
    } as never)
    .select('id, conversation_id, sender_id, body, read_at, created_at')
    .single()

  if (error || !message) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  void adminClient
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
    .then(({ error: updateErr }) => {
      if (updateErr) console.warn('[messages] update last_message_at failed:', updateErr.message)
    })

  const recipientId = conversation.participant_one_id === senderId
    ? conversation.participant_two_id
    : conversation.participant_one_id

  const lastAt = conversation.last_message_at
  const shouldNotify = !lastAt || (Date.now() - new Date(lastAt).getTime() > 3_600_000)

  if (shouldNotify) {
    const senderName = profile.display_name ?? profile.full_name ?? 'A member'
    notifyNewDm({ recipientId, senderName, conversationId }).catch(err => {
      console.warn('[messages] notifyNewDm failed:', err)
    })
  }

  return NextResponse.json(message, { status: 201 })
}
