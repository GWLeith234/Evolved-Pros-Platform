export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_PATCH_FIELDS = [
  'wig_statement', 'lag_label', 'lag_current', 'lag_target', 'lag_unit',
  'lead_1_label', 'lead_1_weekly_target', 'lead_2_label', 'lead_2_weekly_target',
]

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: scoreboard, error } = await supabase
    .from('scoreboards')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: updates } = await supabase
    .from('scoreboard_updates')
    .select('id, scoreboard_id, lag_value, lead_1_count, lead_2_count, update_date, created_at')
    .eq('scoreboard_id', params.id)
    .order('update_date', { ascending: false })
    .limit(4)

  return NextResponse.json({ scoreboard, updates: updates ?? [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('scoreboards')
    .update(patch)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id, user_id, course_id, wig_statement, lag_label, lag_current, lag_target, lag_unit, lead_1_label, lead_1_weekly_target, lead_2_label, lead_2_weekly_target, created_at, updated_at')
    .single()

  if (error || !data) {
    console.error('[PATCH /api/scoreboards/[id]]', error)
    return NextResponse.json({ error: error?.message ?? 'Not found or not authorised' }, { status: 500 })
  }

  return NextResponse.json({ scoreboard: data })
}
