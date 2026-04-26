export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const scores = body.scores && typeof body.scores === 'object' ? body.scores : null
  const totalScore = typeof body.total_score === 'number' ? body.total_score : null

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (!scores) return NextResponse.json({ error: 'scores is required' }, { status: 422 })

  // RLS-FIX: pillar_audits.user_id FKs public.users(id); resolve by email.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  const userId = profile?.id ?? user.id

  const { data, error } = await adminClient
    .from('pillar_audits')
    .insert({
      user_id: userId,
      course_id: courseId,
      score: totalScore,
      notes: JSON.stringify(scores),
    } as never)
    .select('id, course_id, score, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/pillar-audit]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save audit' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
