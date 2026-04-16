export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const context = searchParams.get('context') ?? 'media'

  const { data: poll, error } = await adminClient
    .from('polls')
    .select('id, question, status, closes_at, poll_options(id, option_text, vote_count, sort_order)')
    .eq('context', context)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[polls/active] error:', JSON.stringify(error))
    return NextResponse.json({ poll: null })
  }

  return NextResponse.json({ poll: poll ?? null })
}
