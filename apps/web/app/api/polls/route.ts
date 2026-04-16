export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { question?: unknown; options?: unknown; context?: unknown; closes_at?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const options = Array.isArray(body.options) ? body.options.filter((o): o is string => typeof o === 'string' && o.trim().length > 0).map(o => o.trim()) : []
  const context = typeof body.context === 'string' ? body.context : 'community'
  const closesAt = typeof body.closes_at === 'string' ? body.closes_at : null

  if (!question || question.length > 200) return NextResponse.json({ error: 'Question is required (max 200 chars)' }, { status: 422 })
  if (options.length < 2 || options.length > 6) return NextResponse.json({ error: '2-6 options required' }, { status: 422 })

  // Create poll
  const { data: poll, error: pollErr } = await supabase
    .from('polls')
    .insert({
      question,
      context,
      created_by: user.id,
      status: 'active',
      closes_at: closesAt,
    })
    .select()
    .single()

  if (pollErr || !poll) return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })

  // Create options
  const optionRows = options.map((text, i) => ({
    poll_id: poll.id,
    option_text: text,
    sort_order: i,
  }))

  const { error: optErr } = await supabase
    .from('poll_options')
    .insert(optionRows)

  if (optErr) return NextResponse.json({ error: 'Failed to create options' }, { status: 500 })

  return NextResponse.json({ poll }, { status: 201 })
}
