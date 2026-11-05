import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { notifyCourseUnlock } from '@/lib/notifications/create'
import { canOpenLesson } from '@/lib/entitlements'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

interface ProgressBody {
  watchTimeSeconds: number
  completed?: boolean
}

export async function POST(
  req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  // Effective tier: a lapsed subscription is community here, same as the
  // lesson page and the Mux token route.
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ProgressBody
  try {
    body = await req.json() as ProgressBody
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { watchTimeSeconds, completed } = body
  if (typeof watchTimeSeconds !== 'number' || watchTimeSeconds < 0) {
    return NextResponse.json({ error: 'Invalid watchTimeSeconds' }, { status: 400 })
  }

  const userId = profile.id

  // Service role bypasses RLS, and completion pays points. The lesson id in
  // the URL is not enough: the caller has to be allowed to open that lesson.
  const { data: lesson } = await adminClient
    .from('lessons')
    .select('id, course_id, title, is_published, sort_order, course:courses(slug, pillar_number, required_tier)')
    .eq('id', params.lessonId)
    .single()

  if (!lesson || !lesson.is_published) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const courseRel = (lesson as {
    course?:
      | { required_tier?: string | null; slug?: string | null; pillar_number?: number | null }
      | { required_tier?: string | null; slug?: string | null; pillar_number?: number | null }[]
      | null
  }).course
  const courseRow = Array.isArray(courseRel) ? courseRel[0] : courseRel
  // Missing course fails closed (required tier 'pro'). Foundation lesson 1
  // stays open for the free tier via the teaser exception.
  if (!canOpenLesson({
    tier: profile.tier,
    tierStatus: profile.tier_status,
    requiredTier: courseRow?.required_tier ?? 'pro',
    courseSlug: courseRow?.slug ?? null,
    pillarNumber: courseRow?.pillar_number,
    sortOrder: lesson.sort_order,
  })) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  // Fetch existing progress
  const { data: existing } = await adminClient
    .from('lesson_progress')
    .select('completed_at, watch_time_seconds')
    .eq('user_id', userId)
    .eq('lesson_id', params.lessonId)
    .single()

  const alreadyCompleted = !!existing?.completed_at
  const completedAt = completed && !alreadyCompleted ? new Date().toISOString() : (existing?.completed_at ?? null)
  const maxWatchTime = Math.max(watchTimeSeconds, existing?.watch_time_seconds ?? 0)

  const { data: upserted } = await adminClient
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: params.lessonId,
      watch_time_seconds: maxWatchTime,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'user_id,lesson_id' })
    .select('completed_at, watch_time_seconds')
    .single()

  let pointsAwarded = 0

  // Award 50 points on completion (only once)
  if (completed && !alreadyCompleted) {
    pointsAwarded = 50
    try {
      await Promise.resolve(adminClient.rpc('increment_points', { user_id: userId, amount: 50 }))
    } catch {
      // Fallback if RPC not available
      const { data } = await adminClient.from('users').select('points').eq('id', userId).single()
      await adminClient.from('users').update({ points: (data?.points ?? 0) + 50 }).eq('id', userId)
    }

    // Check course completion
    const { data: allLessons } = await adminClient
      .from('lessons')
      .select('id')
      .eq('course_id', lesson.course_id)
      .eq('is_published', true)

    const totalLessonIds = (allLessons ?? []).map(l => l.id)

    const { data: completedProgress } = await adminClient
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .in('lesson_id', totalLessonIds)
      .not('completed_at', 'is', null)

    if (
      totalLessonIds.length > 0 &&
      (completedProgress ?? []).length >= totalLessonIds.length
    ) {
      // Course complete — award 100 bonus points
      pointsAwarded += 100
      await adminClient
        .from('users')
        .select('points')
        .eq('id', userId)
        .single()
        .then(({ data }) =>
          adminClient
            .from('users')
            .update({ points: (data?.points ?? 0) + 100 })
            .eq('id', userId)
        )

      // Notify via factory
      {
        const { data: course } = await adminClient
          .from('courses')
          .select('slug, pillar_number')
          .eq('id', lesson.course_id)
          .single()

        void notifyCourseUnlock({
          userId,
          lessonTitle:   lesson.title,
          courseSlug:    course?.slug ?? lesson.course_id,
          pillarNumber:  course?.pillar_number ?? 0,
        })
      }
    }
  }

  return NextResponse.json({
    watchTimeSeconds: upserted?.watch_time_seconds ?? maxWatchTime,
    completedAt: upserted?.completed_at ?? completedAt,
    pointsAwarded,
  })
}
