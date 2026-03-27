import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyNewDm } from '@/lib/notifications/create'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversationId = params.id

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_one_id, participant_two_id')
    .eq('id', conversationId)
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Fetch messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })

  // Mark unread messages from other user as read (fire and forget, non-blocking)
  const unreadIds = (messages ?? [])
    .filter(m => m.sender_id !== user.id && !m.read_at)
    .map(m => m.id)

  if (unreadIds.length > 0) {
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .then(({ error: markError }) => {
        if (markError) console.warn('[messages] mark read failed:', markError.message)
      })
  }

  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversationId = params.id

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_one_id, participant_two_id, last_message_at')
    .eq('id', conversationId)
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
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

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: messageBody,
    })
    .select('id, conversation_id, sender_id, body, read_at, created_at')
    .single()

  if (error || !message) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  // Update conversation last_message_at
  supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
    .then(({ error: updateErr }) => {
      if (updateErr) console.warn('[messages] update last_message_at failed:', updateErr.message)
    })

  // Notify recipient if first message OR if last message was > 1 hour ago
  const recipientId = conversation.participant_one_id === user.id
    ? conversation.participant_two_id
    : conversation.participant_one_id

  const lastAt = conversation.last_message_at
  const shouldNotify = !lastAt || (Date.now() - new Date(lastAt).getTime() > 3_600_000)

  if (shouldNotify) {
    // Get sender name for notification
    supabase
      .from('users')
      .select('display_name, full_name')
      .eq('id', user.id)
      .single()
      .then(({ data: sender }) => {
        const senderName = sender?.display_name ?? sender?.full_name ?? 'A member'
        notifyNewDm({ recipientId, senderName, conversationId }).catch(err => {
          console.warn('[messages] notifyNewDm failed:', err)
        })
      })
  }

  return NextResponse.json(message, { status: 201 })
}
