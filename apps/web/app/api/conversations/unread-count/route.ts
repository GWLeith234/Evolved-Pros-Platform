import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all conversations where user is a participant
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)

  const convIds = (conversations ?? []).map(c => c.id)

  if (convIds.length === 0) {
    return NextResponse.json({ count: 0 })
  }

  // Count unread messages where current user is NOT the sender and read_at is null
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .neq('sender_id', user.id)
    .is('read_at', null)

  if (error) return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })

  return NextResponse.json({ count: count ?? 0 })
}
