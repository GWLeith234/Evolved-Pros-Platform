export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { memberPollWrite } from '@/lib/polls/memberPoll'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = memberPollWrite(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const { poll } = parsed

  const { data, error: pollErr } = await supabase
    .from('polls')
    .insert({
      question: poll.question,
      context: poll.context,
      created_by: user.id,
      status: poll.status,
      closes_at: poll.closesAt,
    })
    .select()
    .single()

  if (pollErr || !data) return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })

  const optionRows = poll.options.map((text, i) => ({
    poll_id: data.id,
    option_text: text,
    display_order: i,
  }))

  const { error: optErr } = await supabase
    .from('poll_options')
    .insert(optionRows)

  if (optErr) return NextResponse.json({ error: 'Failed to create options' }, { status: 500 })

  return NextResponse.json({ poll: data }, { status: 201 })
}
