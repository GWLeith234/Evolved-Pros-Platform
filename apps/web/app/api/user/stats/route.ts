import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user profile for tier and points
  const { data: profile } = await supabase
    .from('users')
    .select('tier, points')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Run all stat queries in parallel
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    memberCountResult,
    newMembersResult,
    coursesResult,
    progressResult,
    rankResult,
    lastWeekProgressResult,
  ] = await Promise.all([
    // Total active members
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tier_status', 'active'),

    // New members this week
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tier_status', 'active')
      .gte('created_at', oneWeekAgo),

    // Accessible courses for this user's tier
    supabase
      .from('courses')
      .select('id, required_tier')
      .eq('is_published', true),

    // User's lesson progress (completed lessons)
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),

    // Current leaderboard rank: count users with more points
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points', profile.points),

    // Last week's academy progress (completions before one week ago)
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .lt('completed_at', oneWeekAgo),
  ])

  const communityMemberCount = memberCountResult.count ?? 0
  const newMembersThisWeek = newMembersResult.count ?? 0

  // Pillars unlocked: courses the user can access based on tier
  const allCourses = coursesResult.data ?? []
  const userTier = profile.tier ?? 'vip'
  const accessibleCourses = allCourses.filter(c => {
    if (userTier === 'pro') return true
    return c.required_tier === 'community'
  })
  const pillarsUnlocked = accessibleCourses.length
  const pillarsTotal = allCourses.length

  // Academy progress: avg completion across all accessible courses
  // We need total published lessons per course
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, course_id')
    .eq('is_published', true)

  const lessonsByCourse: Record<string, string[]> = {}
  for (const lesson of allLessons ?? []) {
    if (!lessonsByCourse[lesson.course_id]) lessonsByCourse[lesson.course_id] = []
    lessonsByCourse[lesson.course_id].push(lesson.id)
  }

  const completedLessons = new Set((progressResult.data ?? []).map(p => p.lesson_id))
  const pastCompletedLessons = new Set((lastWeekProgressResult.data ?? []).map(p => p.lesson_id))

  let totalCompletionPct = 0
  let courseCount = 0
  let pastTotalCompletionPct = 0

  for (const course of accessibleCourses) {
    const total = lessonsByCourse[course.id]?.length ?? 0
    if (total === 0) continue
    const completed = (lessonsByCourse[course.id] ?? []).filter(id => completedLessons.has(id)).length
    const pastCompleted = (lessonsByCourse[course.id] ?? []).filter(id => pastCompletedLessons.has(id)).length
    totalCompletionPct += completed / total
    pastTotalCompletionPct += pastCompleted / total
    courseCount++
  }

  const academyProgressPct = courseCount > 0 ? Math.round((totalCompletionPct / courseCount) * 100) : 0
  const pastProgressPct = courseCount > 0 ? Math.round((pastTotalCompletionPct / courseCount) * 100) : 0
  const academyProgressGain = academyProgressPct - pastProgressPct

  const leaderboardRank = (rankResult.count ?? 0) + 1
  // Leaderboard position gain: for simplicity, compare to last week (0 if no history)
  const leaderboardPositionGain = 0

  return NextResponse.json({
    communityMemberCount,
    newMembersThisWeek,
    pillarsUnlocked,
    pillarsTotal,
    academyProgressPct,
    academyProgressGain,
    leaderboardRank,
    leaderboardPositionGain,
  })
}
