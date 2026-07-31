import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { notifyCourseUnlock } from '@/lib/notifications/create'
import { PILLAR_NAMES } from '@/lib/academy/types'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // public.users.id equals auth.uid() (every row has public.users.id =
  // auth.users.id, and the RLS policies on public.users key on auth.uid() = id).
  // So this lookup and the `?? user.id` fallback resolve to the same uuid; the
  // fallback simply covers a not-yet-provisioned public.users row.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  const userId = profile?.id ?? user.id

  // Verify lesson exists and fetch course id + title
  const { data: lesson } = await adminClient
    .from('lessons')
    .select('id, course_id, title, is_published')
    .eq('id', params.lessonId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

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
      await Promise.resolve(supabase.rpc('increment_points', { user_id: userId, amount: 50 }))
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

        // Fire Vendasta CRM signal (fire-and-forget — never block the response)
        const pNum = course?.pillar_number ?? 0
        if (pNum >= 1 && pNum <= 6) {
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/vendasta/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              eventType: 'pillar_complete',
              payload: { pillarNumber: pNum, pillarName: PILLAR_NAMES[pNum] ?? `Pillar ${pNum}` },
            }),
          }).catch(err => console.error('[Vendasta Signal] fire-and-forget failed:', err))
        }
      }
    }
  }

  return NextResponse.json({
    watchTimeSeconds: upserted?.watch_time_seconds ?? maxWatchTime,
    completedAt: upserted?.completed_at ?? completedAt,
    pointsAwarded,
  })
}
