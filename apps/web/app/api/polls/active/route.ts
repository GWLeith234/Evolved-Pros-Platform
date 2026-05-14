export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
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
    return NextResponse.json({ poll: null, voteCounts: {}, totalVotes: 0 })
  }

  if (!poll) {
    return NextResponse.json({ poll: null, voteCounts: {}, totalVotes: 0 })
  }

  // Count votes from poll_votes table
  const { data: votes } = await adminClient
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', poll.id)

  const voteCounts: Record<string, number> = {}
  for (const v of votes ?? []) {
    voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1
  }
  const totalVotes = votes?.length ?? 0

  return NextResponse.json({ poll, voteCounts, totalVotes })
}
