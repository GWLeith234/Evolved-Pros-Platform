import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import type { CourseWithProgress, LessonWithProgress } from './types'
import { hasTierAccess } from '@/lib/tier'

type SB = SupabaseClient<Database>

// ── Courses ──────────────────────────────────────────────────────────

export async function fetchCoursesWithProgress(
  supabase: SB,
  userId: string,
): Promise<CourseWithProgress[]> {
  const [{ data: courses }, { data: profile }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, pillar_number, slug, title, description, required_tier, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order'),
    supabase.from('users').select('tier').eq('id', userId).single(),
  ])

  if (!courses?.length) return []

  const courseIds = courses.map(c => c.id)

  // Fetch lesson counts per course
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id, updated_at')
    .in('course_id', courseIds)
    .eq('is_published', true)

  // Fetch completed progress for this user
  const lessonIds = (lessons ?? []).map(l => l.id)
  const { data: progress } = lessonIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('lesson_id, completed_at, updated_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const completedSet = new Set((progress ?? []).filter(p => p.completed_at).map(p => p.lesson_id))

  return courses.map(course => {
    const courseLessons = (lessons ?? []).filter(l => l.course_id === course.id)
    const total = courseLessons.length
    const completed = courseLessons.filter(l => completedSet.has(l.id)).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    // Find last activity from progress records for this course's lessons
    const courseLessonIds = new Set(courseLessons.map(l => l.id))
    const courseProgress = (progress ?? []).filter(p => courseLessonIds.has(p.lesson_id))
    const lastActivity = courseProgress.length > 0
      ? courseProgress.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
      : null

    return {
      id: course.id,
      pillarNumber: course.pillar_number,
      slug: course.slug,
      title: course.title,
      description: course.description,
      requiredTier: course.required_tier,
      isPublished: course.is_published,
      sortOrder: course.sort_order,
      totalLessons: total,
      completedLessons: completed,
      progressPct: pct,
      lastActivityAt: lastActivity,
      hasAccess: hasTierAccess(profile?.tier, course.required_tier),
    }
  })
}

export async function fetchCourseBySlug(
  supabase: SB,
  slug: string,
): Promise<Database['public']['Tables']['courses']['Row'] | null> {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  return data ?? null
}

// ── Lessons ──────────────────────────────────────────────────────────

export async function fetchLessonsWithProgress(
  supabase: SB,
  pillarSlug: string,
  userId: string,
  userTier: 'community' | 'pro' | null | undefined,
): Promise<LessonWithProgress[]> {
  // Get course
  const { data: course } = await supabase
    .from('courses')
    .select('id, required_tier')
    .eq('slug', pillarSlug)
    .single()

  if (!course) return []

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id, slug, title, description, mux_playback_id, duration_seconds, sort_order, is_published')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('sort_order')

  if (!lessons?.length) return []

  const lessonIds = lessons.map(l => l.id)
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed_at, watch_time_seconds')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  const progressMap = new Map((progress ?? []).map(p => [p.lesson_id, p]))
  const isLocked = !hasTierAccess(userTier, course.required_tier as 'community' | 'pro')

  return lessons.map(lesson => {
    const prog = progressMap.get(lesson.id)
    return {
      id: lesson.id,
      courseId: lesson.course_id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      muxPlaybackId: lesson.mux_playback_id,
      durationSeconds: lesson.duration_seconds,
      sortOrder: lesson.sort_order,
      isPublished: lesson.is_published,
      completedAt: prog?.completed_at ?? null,
      watchTimeSeconds: prog?.watch_time_seconds ?? 0,
      isLocked,
    }
  })
}

export async function fetchLessonBySlug(
  supabase: SB,
  pillarSlug: string,
  lessonSlug: string,
): Promise<Database['public']['Tables']['lessons']['Row'] | null> {
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', pillarSlug)
    .single()

  if (!course) return null

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .eq('slug', lessonSlug)
    .single()

  return lesson ?? null
}

export async function fetchLessonProgress(
  supabase: SB,
  userId: string,
  lessonId: string | undefined,
): Promise<Database['public']['Tables']['lesson_progress']['Row'] | null> {
  if (!lessonId) return null
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()
  return data ?? null
}

export async function fetchLessonNotes(
  supabase: SB,
  userId: string,
  lessonId: string | undefined,
): Promise<string | null> {
  if (!lessonId) return null
  const { data } = await supabase
    .from('lesson_progress')
    .select('notes')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()
  return data?.notes ?? null
}

export async function fetchUserProfile(
  supabase: SB,
  userId: string,
): Promise<Database['public']['Tables']['users']['Row'] | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  return data ?? null
}
