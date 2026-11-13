export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { logProviderError } from '@/lib/http/clientError'
import { pollIsOpen } from '@/lib/polls/vote'

export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // The voter is the session profile. increment_poll_vote() writes auth.uid()
  // itself. A user_id on the body is never read.
  const userId = profile.id

  let body: { poll_id?: unknown; option_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pollId = typeof body.poll_id === 'string' ? body.poll_id : ''
  const optionId = typeof body.option_id === 'string' ? body.option_id : ''

  if (!pollId || !optionId) return NextResponse.json({ error: 'poll_id and option_id required' }, { status: 422 })

  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('id, status, closes_at')
    .eq('id', pollId)
    .maybeSingle()

  if (pollError) {
    logProviderError('[POST /api/polls/vote] poll lookup failed', pollError)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  if (!pollIsOpen(poll, Date.now())) {
    return NextResponse.json({ error: 'Poll is closed' }, { status: 422 })
  }

  const { data: option, error: optionError } = await supabase
    .from('poll_options')
    .select('id, poll_id')
    .eq('id', optionId)
    .maybeSingle()

  if (optionError) {
    logProviderError('[POST /api/polls/vote] option lookup failed', optionError)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  if (!option || option.poll_id !== pollId) {
    return NextResponse.json({ error: 'option_id does not belong to this poll' }, { status: 422 })
  }

  // Look up any existing vote so a first vote, a same-option resubmit, and a
  // genuine vote change are each handled distinctly. One row per user is also
  // enforced by the unique (poll_id, user_id) upsert inside increment_poll_vote().
  const { data: existing, error: existingError } = await supabase
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    logProviderError('[POST /api/polls/vote] existing vote lookup failed', existingError)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  if (existing && existing.option_id === optionId) {
    // Same option already recorded — no-op, skip the RPC call.
    return NextResponse.json({ ok: true, optionId, status: 'unchanged' })
  }

  // First vote, or a change to a different option. increment_poll_vote() does
  // its own INSERT into poll_votes with ON CONFLICT (poll_id, user_id) DO
  // UPDATE — this is the sole write, and the upsert is what makes changing
  // your vote on a poll work correctly. The session client does not insert.
  const { error: rpcError } = await supabase.rpc('increment_poll_vote', { p_option_id: optionId })
  if (rpcError) {
    logProviderError('[POST /api/polls/vote] increment_poll_vote failed', rpcError)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, optionId, status: existing ? 'changed' : 'voted' })
}
