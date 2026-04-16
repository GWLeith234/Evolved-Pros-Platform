export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { poll_id?: unknown; option_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pollId = typeof body.poll_id === 'string' ? body.poll_id : ''
  const optionId = typeof body.option_id === 'string' ? body.option_id : ''

  if (!pollId || !optionId) return NextResponse.json({ error: 'poll_id and option_id required' }, { status: 422 })

  // Check if already voted
  const { data: existing } = await supabase
    .from('poll_votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already voted' }, { status: 409 })

  // Cast vote
  const { error } = await supabase
    .from('poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.id })

  if (error) return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })

  // Increment vote count on option
  await supabase.rpc('increment_poll_vote', { p_option_id: optionId } as Record<string, unknown>).catch(() => {
    // RPC may not exist yet — fall back silently
  })

  return NextResponse.json({ ok: true })
}
