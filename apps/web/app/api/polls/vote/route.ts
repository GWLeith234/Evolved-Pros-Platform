export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { poll_id?: unknown; option_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pollId = typeof body.poll_id === 'string' ? body.poll_id : ''
  const optionId = typeof body.option_id === 'string' ? body.option_id : ''

  if (!pollId || !optionId) return NextResponse.json({ error: 'poll_id and option_id required' }, { status: 422 })

  // Look up any existing vote so a first vote, a same-option resubmit, and a
  // genuine vote change are each handled distinctly.
  const { data: existing } = await supabase
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing && existing.option_id === optionId) {
    // Same option already recorded — no-op, skip the RPC call.
    return NextResponse.json({ ok: true, optionId, status: 'unchanged' })
  }

  // First vote, or a change to a different option. increment_poll_vote() does
  // its own INSERT into poll_votes with ON CONFLICT (poll_id, user_id) DO
  // UPDATE — this is the sole write, and the upsert is what makes changing
  // your vote on a poll work correctly.
  const { error: rpcError } = await supabase.rpc('increment_poll_vote', { p_option_id: optionId })
  if (rpcError) {
    console.error('[POST /api/polls/vote] increment_poll_vote failed', { pollId, optionId, rpcError })
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, optionId, status: existing ? 'changed' : 'voted' })
}
