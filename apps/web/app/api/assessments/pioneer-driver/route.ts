export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type AssessmentType = 'PIONEER' | 'DRIVER' | 'CONNECTOR' | 'ARCHITECT'
const VALID_TYPES: AssessmentType[] = ['PIONEER', 'DRIVER', 'CONNECTOR', 'ARCHITECT']

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('assessments')
    .select('id, user_id, assessment_type, type_result, scores_json, created_at')
    .eq('user_id', user.id)
    .eq('assessment_type', 'pioneer-driver')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/assessments/pioneer-driver]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assessment: data ?? null })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const typeResult = typeof body.type_result === 'string' ? body.type_result.toUpperCase() : null
  const scoresJson = body.scores_json ?? null

  if (!typeResult || !VALID_TYPES.includes(typeResult as AssessmentType)) {
    return NextResponse.json({ error: 'type_result must be one of PIONEER, DRIVER, CONNECTOR, ARCHITECT' }, { status: 422 })
  }

  // Use admin client to bypass RLS for both insert and user update
  const admin = createAdminClient()

  const { data: assessment, error: insertError } = await admin
    .from('assessments')
    .insert({
      user_id: user.id,
      assessment_type: 'pioneer-driver',
      type_result: typeResult,
      scores_json: scoresJson,
    })
    .select('id, user_id, assessment_type, type_result, scores_json, created_at')
    .single()

  if (insertError || !assessment) {
    console.error('[POST /api/assessments/pioneer-driver] insert', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Failed to save assessment' }, { status: 500 })
  }

  // Update pioneer_driver_type on user profile
  const { error: updateError } = await admin
    .from('users')
    .update({ pioneer_driver_type: typeResult })
    .eq('id', user.id)

  if (updateError) {
    console.error('[POST /api/assessments/pioneer-driver] user update', updateError)
    // Non-fatal — assessment was saved, just log
  }

  return NextResponse.json({ assessment }, { status: 201 })
}
