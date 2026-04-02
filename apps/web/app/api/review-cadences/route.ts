import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('course_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('review_cadences')
    .select('id, cadence_type, schedule_json, focus_area, created_at')
    .eq('user_id', user.id)

  if (courseId) q = q.eq('course_id', courseId)

  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cadences: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    cadence_type?: string
    schedule_json?: Record<string, unknown>
    focus_area?: string
    course_id?: string | null
  }

  const { cadence_type, schedule_json = {}, focus_area = '', course_id = null } = body
  if (!cadence_type || !['weekly', 'monthly', 'quarterly'].includes(cadence_type)) {
    return NextResponse.json({ error: 'cadence_type must be weekly, monthly, or quarterly' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('review_cadences')
    .upsert(
      { user_id: user.id, course_id, cadence_type, schedule_json, focus_area },
      { onConflict: 'user_id,cadence_type' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cadence: data })
}
