import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import type { CourseWithProgress, LessonWithProgress } from './types'
import { hasTierAccess } from '@/lib/tier'
import { adminClient } from '@/lib/supabase/admin'

type SB = SupabaseClient<Database>

// ── Courses ──────────────────────────────────────────────────────────

export async function fetchCoursesWithProgress(
  supabase: SB,
  userId: string,
  userTier?: 'community' | 'vip' | 'pro' | null,
): Promise<CourseWithProgress[]> {
  // When the caller didn't pre-resolve userTier (e.g. /api/courses),
  // route through fetchUserProfile so we benefit from the same RLS-bypass
  // + email fallback. Otherwise short-circuit.
  const tierPromise: Promise<string | null> = userTier === undefined
    ? fetchUserProfile(supabase, userId).then(p => p?.tier ?? null)
    : Promise.resolve(userTier ?? null)

  // Pull courses through adminClient too. The SSR client respects RLS on
  // public.courses, which has bitten us before when a session arrives at
  // an RSC stream without the cookie threaded through (e.g. prefetch
  // races). adminClient is consistent with how lessons are fetched a few
  // lines below, so the IDs we filter on are guaranteed to come from the
  // same scope.
  const [coursesResult, resolvedTier] = await Promise.all([
    adminClient
      .from('courses')
      .select('id, pillar_number, slug, title, description, required_tier, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order'),
    tierPromise,
  ])
  const profile = { tier: resolvedTier }

  // ACADEMY-FIX: courses fetch must mirror the lessons-fetch hardening
  // below. Previously a service-role failure here silently returned [] and
  // the page rendered "header + 0% + no cards" with no log line — exactly
  // the regression QA hit after SUPABASE_SERVICE_ROLE_KEY was rotated in
  // Railway. Log on error, then fall back to the SSR client so cards still
  // mount (locked/empty lessons are acceptable; an empty grid is not).
  let courses = coursesResult.data ?? []
  if (coursesResult.error) {
    console.warn(
      '[academy.fetchCoursesWithProgress] adminClient courses error:',
      coursesResult.error.message,
    )
    const fallback = await supabase
      .from('courses')
      .select('id, pillar_number, slug, title, description, required_tier, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order')
    courses = fallback.data ?? []
  } else if (courses.length === 0) {
    // Distinguish "service-role key is bad" from "DB legitimately has no
    // published courses." Probe the SSR client; if it returns rows,
    // adminClient is the broken side and we should surface that loudly.
    const fallback = await supabase
      .from('courses')
      .select('id, pillar_number, slug, title, description, required_tier, is_published, sort_order')
      .eq('is_published', true)
      .order('sort_order')
    if ((fallback.data?.length ?? 0) > 0) {
      console.warn(
        '[academy.fetchCoursesWithProgress] adminClient returned 0 but SSR returned rows — service role key likely wrong. Check SUPABASE_SERVICE_ROLE_KEY.',
      )
      courses = fallback.data ?? []
    }
  }

  if (!courses.length) return []

  const courseIds = courses.map(c => c.id)

  // Fetch lesson counts per course via adminClient (bypasses the
  // `auth.role() = 'authenticated' AND is_published = TRUE` lessons RLS).
  //
  // No is_published filter on the count: the course-level is_published
  // flag above already controls whether a course shows up in the
  // catalog. Counting only published lessons hid every course whose
  // rows had is_published=false in the live DB — the academy grid then
  // rendered "Lessons coming soon" everywhere even when lessons existed.
  // Per-lesson access is still gated on the lesson detail page (which
  // applies its own filter), so unpublished rows don't leak through.
  const lessonsResult = await adminClient
    .from('lessons')
    .select('id, course_id')
    .in('course_id', courseIds)

  // We need to distinguish "fetch failed / RLS shadow / missing service
  // key" from "course has zero lessons." The card fallback should only
  // kick in for the former — a real empty course should render "0
  // lessons" (or the bar) so the gap is visible to the team. Track that
  // signal with `lessonsFetchFailed` and surface it as a null on the
  // card so the UI can render "—" / "coming soon" only when warranted.
  let lessons = lessonsResult.data ?? []
  let lessonsFetchFailed = false

  if (lessonsResult.error) {
    console.warn(
      '[academy.fetchCoursesWithProgress] adminClient lessons error:',
      lessonsResult.error.message,
    )
    lessonsFetchFailed = true
  } else if (lessons.length === 0) {
    // Could be a genuinely empty DB. Probe the SSR client as a
    // tie-breaker; if that also returns 0 across the board, treat it as
    // a real "no lessons yet" state. If it returns rows, adminClient
    // hit a service-role config issue and we should mark the count
    // null per-course.
    const fallback = await supabase
      .from('lessons')
      .select('id, course_id')
      .in('course_id', courseIds)
    if ((fallback.data?.length ?? 0) > 0) {
      console.warn(
        '[academy.fetchCoursesWithProgress] adminClient returned 0 but SSR client returned rows. Check SUPABASE_SERVICE_ROLE_KEY.',
      )
      lessons = fallback.data ?? []
      lessonsFetchFailed = true
    }
  }

  // Fetch completed progress for this user — adminClient because
  // lesson_progress.user_id stores public.users.id, but the RLS policy
  // is `auth.uid() = user_id`. The SSR client returns [] silently for
  // any account where auth.uid() ≠ public.users.id, which made every
  // course render 0% complete on the academy grid.
  const lessonIds = (lessons ?? []).map(l => l.id)
  const { data: progress } = lessonIds.length > 0
    ? await adminClient
        .from('lesson_progress')
        .select('lesson_id, completed_at, updated_at')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const completedSet = new Set((progress ?? []).filter(p => p.completed_at).map(p => p.lesson_id))

  return courses.map(course => {
    const courseLessons = (lessons ?? []).filter(l => l.course_id === course.id)
    const completed = courseLessons.filter(l => completedSet.has(l.id)).length
    // total === null means the lesson fetch failed (RLS / missing
    // service-role key). The card layer uses null to differentiate that
    // from a genuinely empty course (total === 0).
    const total: number | null = lessonsFetchFailed && courseLessons.length === 0 ? null : courseLessons.length
    const pct = total !== null && total > 0 ? Math.round((completed / total) * 100) : 0

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
    .maybeSingle()
  return data ?? null
}

// ── Lessons ──────────────────────────────────────────────────────────

export async function fetchLessonsWithProgress(
  supabase: SB,
  pillarSlug: string,
  userId: string,
  // Widened to string: the value flows from DB tier columns (string|null) and
  // is only consumed by hasTierAccess, which already tolerates any string.
  userTier: string | null | undefined,
): Promise<LessonWithProgress[]> {
  // Get course
  const { data: course } = await supabase
    .from('courses')
    .select('id, required_tier')
    .eq('slug', pillarSlug)
    .maybeSingle()

  if (!course) return []

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id, slug, title, description, mux_playback_id, duration_seconds, sort_order, is_published, module_number')
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
  const isLocked = !hasTierAccess(userTier, course.required_tier as 'community' | 'vip' | 'pro')

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
      moduleNumber: (lesson as Record<string, unknown>).module_number as number | null ?? null,
    }
  })
}

export async function fetchCourseByPillarNumber(
  supabase: SB,
  pillarNumber: number,
) {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('pillar_number', pillarNumber)
    .eq('is_published', true)
    .maybeSingle()
  return data ?? null
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
    .maybeSingle()

  if (!course) return null

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .eq('slug', lessonSlug)
    .maybeSingle()

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
    .maybeSingle()
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
    .maybeSingle()
  return data?.notes ?? null
}

export interface WIGRow {
  id: string
  user_id: string
  course_id: string
  domain: string
  content: Record<string, unknown>
  status: string | null
  updated_at: string
  created_at: string
}

export async function fetchWIGByDomain(
  supabase: SB,
  userId: string,
  domain: string,
): Promise<WIGRow | null> {
  const { data } = await supabase
    .from('strategic_plans')
    .select('id, user_id, course_id, domain, content, status, updated_at, created_at')
    .eq('user_id', userId)
    .eq('domain', domain)
    .maybeSingle()
  return (data as WIGRow | null) ?? null
}

/**
 * Resolves the public.users row for the currently-authenticated caller.
 *
 * Bypasses RLS via the service-role adminClient so reads always succeed.
 * Tries `.eq('id', userId)` first, then falls back to `.eq('email', user.email)`
 * via supabase.auth.getUser() when the id-lookup misses — this is the
 * documented auth.uid() ≠ public.users.id footgun (lib/admin/helpers.ts:18-22)
 * that was silently 403'ing admins (B1/B2) and locking every Academy course
 * on PRO accounts (this sprint).
 */
export async function fetchUserProfile(
  supabase: SB,
  userId: string,
): Promise<Database['public']['Tables']['users']['Row'] | null> {
  const { data: byId } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (byId) return byId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: byEmail } = await adminClient
    .from('users')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()
  return byEmail ?? null
}
