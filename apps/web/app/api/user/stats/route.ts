import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { hasTierAccess } from '@/lib/tier'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      .eq('user_id', profile.id)
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
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null)
      .lt('completed_at', oneWeekAgo),
  ])

  const communityMemberCount = memberCountResult.count ?? 0
  const newMembersThisWeek = newMembersResult.count ?? 0

  // Pillars unlocked: courses the user can access based on tier.
  //
  // SPRINT TIER-1: this was a hand-rolled rule — "pro sees everything, else
  // only community courses" — which silently reported VIP members as having
  // ONE pillar unlocked instead of three. Tier questions go through
  // hasTierAccess against the course's own required_tier, same as every gate.
  const allCourses = coursesResult.data ?? []
  const accessibleCourses = allCourses.filter(c => hasTierAccess(profile.tier, c.required_tier))
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
