export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : null
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!courseId) return NextResponse.json({ error: 'course_id is required' }, { status: 422 })
  if (content.length < 200) return NextResponse.json({ error: 'Capstone must be at least 200 characters' }, { status: 422 })

  // Insert capstone
  const { data: capstone, error: insertError } = await adminClient
    .from('capstones')
    .insert({
      user_id: user.id,
      course_id: courseId,
      content,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select('id, course_id, status, submitted_at')
    .single()

  if (insertError || !capstone) {
    console.error('[POST /api/capstones] insert error:', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Failed to submit capstone' }, { status: 500 })
  }

  // Resolve current course's pillar_number, then unlock the next pillar sequentially
  const { data: currentCourse, error: courseError } = await adminClient
    .from('courses')
    .select('pillar_number')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError) {
    console.error('[POST /api/capstones] course lookup error:', courseError)
    // Capstone was saved — don't fail the whole request, just skip the unlock
    return NextResponse.json({ capstone, nextCourseSlug: null })
  }

  const nextPillarNumber = ((currentCourse as Record<string, unknown>)?.pillar_number as number ?? 0) + 1

  if (nextPillarNumber < 1 || nextPillarNumber > 6) {
    // Last pillar — no next course to unlock
    return NextResponse.json({ capstone, nextCourseSlug: null })
  }

  const { data: nextCourse, error: nextError } = await adminClient
    .from('courses')
    .select('id, slug')
    .eq('pillar_number', nextPillarNumber)
    .eq('is_published', true)
    .maybeSingle()

  if (nextError || !nextCourse) {
    console.error('[POST /api/capstones] next course lookup error:', nextError)
    return NextResponse.json({ capstone, nextCourseSlug: null })
  }

  // Unlock ONLY the immediately next pillar
  const { error: unlockError } = await adminClient
    .from('courses')
    .update({ is_locked: false })
    .eq('id', (nextCourse as Record<string, unknown>).id as string)

  if (unlockError) {
    console.error('[POST /api/capstones] unlock error:', unlockError)
  }

  return NextResponse.json({
    capstone,
    nextCourseSlug: (nextCourse as Record<string, unknown>).slug as string,
  }, { status: 201 })
}
