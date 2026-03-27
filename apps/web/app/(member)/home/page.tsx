import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { StatRow } from '@/components/home/StatRow'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { UpcomingEventsWidget } from '@/components/home/UpcomingEventsWidget'
import { AcademyProgressWidget } from '@/components/home/AcademyProgressWidget'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'

async function fetchCurrentUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, display_name, full_name, tier, points, avatar_url, bio, role_title')
    .eq('id', userId)
    .single()
  return data
}

async function fetchDashboardStats(supabase: ReturnType<typeof createClient>, userId: string, userTier: string | null, userPoints: number) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [memberCount, newMembers, courses, allLessons, completions, rankCount] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('tier_status', 'active'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('tier_status', 'active').gte('created_at', oneWeekAgo),
    supabase.from('courses').select('id, required_tier').eq('is_published', true),
    supabase.from('lessons').select('id, course_id').eq('is_published', true),
    supabase.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', userId).not('completed_at', 'is', null),
    supabase.from('users').select('id', { count: 'exact', head: true }).gt('points', userPoints),
  ])

  const allCourses = courses.data ?? []
  const accessible = allCourses.filter(c => userTier === 'pro' || c.required_tier === 'community')
  const pillarsUnlocked = accessible.length
  const pillarsTotal = allCourses.length

  const lessonsByCourse: Record<string, string[]> = {}
  for (const l of allLessons.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l.id)
  }
  const completed = new Set((completions.data ?? []).map(p => p.lesson_id))
  let totalPct = 0, count = 0
  for (const c of accessible) {
    const total = lessonsByCourse[c.id]?.length ?? 0
    if (total === 0) continue
    const done = (lessonsByCourse[c.id] ?? []).filter(id => completed.has(id)).length
    totalPct += done / total
    count++
  }
  const academyProgressPct = count > 0 ? Math.round((totalPct / count) * 100) : 0
  const leaderboardRank = (rankCount.count ?? 0) + 1

  return {
    communityMemberCount: memberCount.count ?? 0,
    newMembersThisWeek: newMembers.count ?? 0,
    pillarsUnlocked,
    pillarsTotal,
    academyProgressPct,
    leaderboardRank,
  }
}

async function fetchRecentActivity(supabase: ReturnType<typeof createClient>, userId: string) {
  const [notifications, completions] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, title, body, action_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, lessons(id, title, sort_order, course_id, courses(title, slug))')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])
  return { notifications: notifications.data ?? [], completions: completions.data ?? [] }
}

async function fetchUpcomingEvents(supabase: ReturnType<typeof createClient>, userId: string) {
  const [events, registrations] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, required_tier')
      .eq('is_published', true)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(2),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', userId),
  ])
  const registeredIds = new Set((registrations.data ?? []).map(r => r.event_id))
  return (events.data ?? []).map(e => ({ ...e, isRegistered: registeredIds.has(e.id) }))
}

async function fetchCourseProgress(supabase: ReturnType<typeof createClient>, userId: string) {
  const [courses, lessons, progress] = await Promise.all([
    supabase.from('courses').select('id, title, slug, sort_order').eq('is_published', true).order('sort_order'),
    supabase.from('lessons').select('id, course_id').eq('is_published', true),
    supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at, updated_at')
      .eq('user_id', userId),
  ])

  const lessonsByCourse: Record<string, string[]> = {}
  for (const l of lessons.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l.id)
  }

  const progressByLesson: Record<string, { completed_at: string | null; updated_at: string }> = {}
  for (const p of progress.data ?? []) {
    progressByLesson[p.lesson_id] = { completed_at: p.completed_at, updated_at: p.updated_at }
  }

  const results = (courses.data ?? []).map(c => {
    const courseLesson = lessonsByCourse[c.id] ?? []
    const total = courseLesson.length
    const completed = courseLesson.filter(id => progressByLesson[id]?.completed_at).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const lastActivity = courseLesson
      .map(id => progressByLesson[id]?.updated_at)
      .filter(Boolean)
      .sort()
      .pop() ?? null
    return { ...c, total, completed, pct, lastActivity }
  })

  // Return top 3 by last activity
  return results
    .filter(c => c.lastActivity !== null || c.pct > 0)
    .sort((a, b) => {
      if (!a.lastActivity) return 1
      if (!b.lastActivity) return -1
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    })
    .slice(0, 3)
}

async function fetchUnreadCount(supabase: ReturnType<typeof createClient>, userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count ?? 0
}

export default async function MemberHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchCurrentUser(supabase, user.id)
  if (!profile) redirect('/login')

  const [stats, activity, events, courseProgress, unreadCount] = await Promise.all([
    fetchDashboardStats(supabase, user.id, profile.tier, profile.points),
    fetchRecentActivity(supabase, user.id),
    fetchUpcomingEvents(supabase, user.id),
    fetchCourseProgress(supabase, user.id),
    fetchUnreadCount(supabase, user.id),
  ])

  const displayName = profile.display_name ?? (profile.full_name ? profile.full_name.split(' ')[0] : null) ?? 'Member'
  const upcomingEventCount = events.filter(e => !e.isRegistered).length

  return (
    <div className="p-6 space-y-5">
      <WelcomeBanner
        displayName={displayName}
        tier={profile.tier}
        unreadPostCount={unreadCount}
        upcomingEventCount={upcomingEventCount}
      />

      <ProfileCompletePrompt
        hasAvatar={Boolean(profile.avatar_url)}
        hasBio={Boolean(profile.bio)}
        hasTitle={Boolean(profile.role_title)}
        hasName={Boolean(profile.display_name || profile.full_name)}
      />

      <StatRow stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-5">
        <ActivityFeed
          notifications={activity.notifications}
          completions={activity.completions}
        />
        <div className="space-y-5">
          <UpcomingEventsWidget events={events} userId={user.id} />
          <AcademyProgressWidget courses={courseProgress} />
        </div>
      </div>
    </div>
  )
}
