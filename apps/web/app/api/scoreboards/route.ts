export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 422 })

  const { data: scoreboard, error } = await supabase
    .from('scoreboards')
    .select('id, user_id, course_id, wig_statement, lag_label, lag_current, lag_target, lag_unit, lead_1_label, lead_1_weekly_target, lead_2_label, lead_2_weekly_target, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/scoreboards]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!scoreboard) return NextResponse.json({ scoreboard: null, updates: [] })

  const { data: updates, error: updErr } = await supabase
    .from('scoreboard_updates')
    .select('id, scoreboard_id, lag_value, lead_1_count, lead_2_count, update_date, created_at')
    .eq('scoreboard_id', (scoreboard as Record<string, unknown>).id as string)
    .order('update_date', { ascending: false })
    .limit(4)

  if (updErr) console.error('[GET /api/scoreboards] updates error:', updErr)

  return NextResponse.json({ scoreboard, updates: updates ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId     = typeof body.course_id     === 'string' ? body.course_id.trim()     : null
  const wigStatement = typeof body.wig_statement === 'string' ? body.wig_statement.trim() : null

  if (!courseId)     return NextResponse.json({ error: 'course_id is required' },      { status: 422 })
  if (!wigStatement) return NextResponse.json({ error: 'wig_statement is required' },  { status: 422 })

  const { data, error } = await supabase
    .from('scoreboards')
    .insert({
      user_id:              user.id,
      course_id:            courseId,
      wig_statement:        wigStatement,
      lag_label:            typeof body.lag_label            === 'string' ? body.lag_label            : '',
      lag_current:          Number(body.lag_current  ?? 0),
      lag_target:           Number(body.lag_target   ?? 0),
      lag_unit:             typeof body.lag_unit             === 'string' ? body.lag_unit             : '',
      lead_1_label:         typeof body.lead_1_label         === 'string' ? body.lead_1_label         : '',
      lead_1_weekly_target: Number(body.lead_1_weekly_target ?? 0),
      lead_2_label:         typeof body.lead_2_label         === 'string' ? body.lead_2_label         : '',
      lead_2_weekly_target: Number(body.lead_2_weekly_target ?? 0),
    })
    .select('id, user_id, course_id, wig_statement, lag_label, lag_current, lag_target, lag_unit, lead_1_label, lead_1_weekly_target, lead_2_label, lead_2_weekly_target, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/scoreboards]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to create scoreboard' }, { status: 500 })
  }

  return NextResponse.json({ scoreboard: data }, { status: 201 })
}
