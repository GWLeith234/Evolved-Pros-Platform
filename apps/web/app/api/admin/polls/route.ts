export const dynamic = 'force-dynamic'

import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  // Try with poll_options join first; fall back to polls-only if join fails
  let data = null
  const { data: withOptions, error } = await adminClient
    .from('polls')
    .select('*, poll_options(id, option_text, vote_count, sort_order)')
    .order('created_at', { ascending: false })

  if (error) {
    // Join may fail if poll_options FK isn't set up yet — fetch polls only
    const { data: pollsOnly, error: fallbackErr } = await adminClient
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })
    if (fallbackErr) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    data = (pollsOnly ?? []).map((p: Record<string, unknown>) => ({ ...p, poll_options: [] }))
  } else {
    data = withOptions
  }
  return NextResponse.json({ polls: data })
}

export async function POST(request: Request) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const question = String(body.question ?? '')
  const context = String(body.context ?? 'community')
  const options = Array.isArray(body.options) ? (body.options as string[]).filter(o => o.trim()) : []
  const closesAt = typeof body.closes_at === 'string' ? body.closes_at : null
  const status = String(body.status ?? 'active')

  if (!question) return NextResponse.json({ error: 'Question required' }, { status: 422 })
  if (options.length < 2) return NextResponse.json({ error: 'At least 2 options required' }, { status: 422 })

  const { data: poll, error: pollErr } = await adminClient
    .from('polls')
    .insert({ question, context, status, closes_at: closesAt, created_by: (check as { userId: string }).userId })
    .select()
    .single()

  if (pollErr || !poll) return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })

  const optionRows = options.map((text, i) => ({ poll_id: poll.id, option_text: text.trim(), sort_order: i }))
  await adminClient.from('poll_options').insert(optionRows)

  return NextResponse.json({ poll }, { status: 201 })
}
