export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')

  let query = supabase
    .from('weekly_commitments')
    .select('id, commitment, is_completed, completed_at, week_start')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (weekStart) query = query.eq('week_start', weekStart)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/commitments]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ commitments: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const weekStart = typeof body.week_start === 'string' ? body.week_start.trim() : null
  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const rawCommitments = Array.isArray(body.commitments) ? body.commitments : []
  const commitmentTexts: string[] = rawCommitments
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .slice(0, 3)
    .map(c => c.trim())

  if (!weekStart) return NextResponse.json({ error: 'week_start is required' }, { status: 422 })
  if (!commitmentTexts.length) return NextResponse.json({ error: 'At least one commitment is required' }, { status: 422 })

  const rows = commitmentTexts.map(commitment => ({
    user_id: user.id,
    week_start: weekStart,
    commitment,
    course_id: courseId,
    is_completed: false,
  }))

  const { data, error } = await supabase
    .from('weekly_commitments')
    .insert(rows)
    .select('id, commitment, is_completed, completed_at, week_start')

  if (error || !data) {
    console.error('[POST /api/commitments]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save commitments' }, { status: 500 })
  }

  return NextResponse.json({ commitments: data }, { status: 201 })
}
