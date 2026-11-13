export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const context = searchParams.get('context') ?? 'media'

  const { data: poll, error } = await adminClient
    .from('polls')
    .select('id, question, status, closes_at, poll_options(id, option_text, display_order)')
    .eq('context', context)
    .eq('status', 'active')
    .or(`closes_at.is.null,closes_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ poll: null, voteCounts: {}, totalVotes: 0, userVoteOptionId: null })
  }

  if (!poll) {
    return NextResponse.json({ poll: null, voteCounts: {}, totalVotes: 0, userVoteOptionId: null })
  }

  // Count votes from poll_votes table
  const { data: votes } = await adminClient
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', poll.id)

  const voteCounts: Record<string, number> = {}
  for (const v of votes ?? []) {
    if (!v.option_id) continue
    voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1
  }
  const totalVotes = votes?.length ?? 0

  // Counts above use the service-role client, so they still include every
  // row after poll_votes SELECT is limited to the caller. "Your vote" is
  // keyed on the session auth id, the same id increment_poll_vote() writes.
  // Logged-out visitors get null and the client falls back to localStorage.
  let userVoteOptionId: string | null = null
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: myVote } = await adminClient
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .maybeSingle()
    userVoteOptionId = myVote?.option_id ?? null
  }

  return NextResponse.json({ poll, voteCounts, totalVotes, userVoteOptionId })
}
