export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

const TIME_RE = /^\d{2}:\d{2}$/
const SELECT = 'id, block_date, start_time, end_time, label, category, completed, sort_order'

async function requireOwner(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: row } = await (adminClient as any)
    .from('daily_time_blocks')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { user }
}

/** PATCH /api/member/time-blocks/[id] — toggle completed or edit fields. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireOwner(params.id)
  if (guard.error) return guard.error

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.completed === 'boolean') patch.completed = body.completed
  if (typeof body.label === 'string' && body.label.trim()) patch.label = body.label.trim()
  if (typeof body.start_time === 'string' && TIME_RE.test(body.start_time.trim())) patch.start_time = body.start_time.trim()
  if (typeof body.end_time === 'string') patch.end_time = TIME_RE.test(body.end_time.trim()) ? body.end_time.trim() : null
  if (typeof body.category === 'string') patch.category = body.category.trim() || null

  const { data, error } = await (adminClient as any)
    .from('daily_time_blocks')
    .update(patch)
    .eq('id', params.id)
    .select(SELECT)
    .single()
  if (error) {
    console.error('[PATCH /api/member/time-blocks/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ block: data })
}

/** DELETE /api/member/time-blocks/[id] */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireOwner(params.id)
  if (guard.error) return guard.error

  const { error } = await (adminClient as any)
    .from('daily_time_blocks')
    .delete()
    .eq('id', params.id)
  if (error) {
    console.error('[DELETE /api/member/time-blocks/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
