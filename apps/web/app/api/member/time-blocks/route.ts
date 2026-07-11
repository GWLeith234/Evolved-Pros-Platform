export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const SELECT = 'id, block_date, start_time, end_time, label, category, completed, sort_order'

/** GET /api/member/time-blocks?date=YYYY-MM-DD — today's blocks by default. */
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateRaw = searchParams.get('date') ?? ''
  const date = DATE_RE.test(dateRaw) ? dateRaw : new Date().toISOString().split('T')[0]

  const { data, error } = await (adminClient as any)
    .from('daily_time_blocks')
    .select(SELECT)
    .eq('user_id', user.id)
    .eq('block_date', date)
    .order('start_time', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('[GET /api/member/time-blocks]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ blocks: data ?? [] })
}

/** POST /api/member/time-blocks — create a block for a day. */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const startRaw = typeof body.start_time === 'string' ? body.start_time.trim() : ''
  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 422 })
  if (!TIME_RE.test(startRaw)) return NextResponse.json({ error: 'start_time must be HH:MM' }, { status: 422 })

  const endRaw = typeof body.end_time === 'string' ? body.end_time.trim() : ''
  const dateRaw = typeof body.block_date === 'string' ? body.block_date.trim() : ''
  const blockDate = DATE_RE.test(dateRaw) ? dateRaw : new Date().toISOString().split('T')[0]

  const { data, error } = await (adminClient as any)
    .from('daily_time_blocks')
    .insert({
      user_id: user.id,
      block_date: blockDate,
      start_time: startRaw,
      end_time: TIME_RE.test(endRaw) ? endRaw : null,
      label,
      category: typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null,
      completed: false,
    })
    .select(SELECT)
    .single()
  if (error) {
    console.error('[POST /api/member/time-blocks]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ block: data }, { status: 201 })
}
