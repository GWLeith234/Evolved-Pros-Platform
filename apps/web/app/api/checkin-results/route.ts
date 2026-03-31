export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const moduleNumber = typeof body.module_number === 'number' ? body.module_number : null
  const checkinType = typeof body.checkin_type === 'string' ? body.checkin_type.trim() : null
  const score = typeof body.score === 'number' ? body.score : null
  const maxScore = typeof body.max_score === 'number' ? body.max_score : null
  const resultJson = body.result_json ?? null

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (!checkinType) return NextResponse.json({ error: 'checkin_type is required' }, { status: 422 })
  if (score === null) return NextResponse.json({ error: 'score is required' }, { status: 422 })
  if (maxScore === null) return NextResponse.json({ error: 'max_score is required' }, { status: 422 })

  const { data, error } = await supabase
    .from('checkin_results')
    .insert({
      user_id: user.id,
      course_id: courseId,
      module_number: moduleNumber,
      checkin_type: checkinType,
      score,
      max_score: maxScore,
      result_json: resultJson,
    })
    .select('id, course_id, module_number, checkin_type, score, max_score, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/checkin-results]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save check-in result' }, { status: 500 })
  }

  return NextResponse.json({ result: data }, { status: 201 })
}
