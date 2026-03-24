import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { courseId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: course }, { data: profile }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, required_tier')
      .eq('id', params.courseId)
      .single(),
    supabase.from('users').select('tier').eq('id', user.id).single(),
  ])

  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id, slug, title, description, mux_playback_id, duration_seconds, sort_order, is_published')
    .eq('course_id', params.courseId)
    .eq('is_published', true)
    .order('sort_order')

  if (!lessons?.length) return NextResponse.json({ lessons: [] })

  const lessonIds = lessons.map(l => l.id)
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed_at, watch_time_seconds')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds)

  const progressMap = new Map((progress ?? []).map(p => [p.lesson_id, p]))
  const isLocked = !hasTierAccess(profile?.tier, course.required_tier as 'community' | 'pro')

  const result = lessons.map(l => {
    const prog = progressMap.get(l.id)
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      muxPlaybackId: l.mux_playback_id,
      durationSeconds: l.duration_seconds,
      sortOrder: l.sort_order,
      isPublished: l.is_published,
      completedAt: prog?.completed_at ?? null,
      watchTimeSeconds: prog?.watch_time_seconds ?? 0,
      isLocked,
    }
  })

  return NextResponse.json({ lessons: result })
}
