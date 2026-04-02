import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'
import { HabitWidget } from '@/components/home/HabitWidget'
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { StatRow } from '@/components/home/StatRow'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { UpcomingEventsWidget } from '@/components/home/UpcomingEventsWidget'
import { AcademyProgressWidget } from '@/components/home/AcademyProgressWidget'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import { BadgeRow } from '@/components/home/BadgeRow'

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

function getCurrentMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

export default async function MemberHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchCurrentUser(supabase, user.id)
  if (!profile) redirect('/login')

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )

  const today = new Date().toISOString().split('T')[0]

  const [stats, activity, events, courseProgress, unreadCount, quotesResult, badgeData, scoreboardResult, habitsResult, habitCompletionsResult] = await Promise.all([
    fetchDashboardStats(supabase, user.id, profile.tier, profile.points),
    fetchRecentActivity(supabase, user.id),
    fetchUpcomingEvents(supabase, user.id),
    fetchCourseProgress(supabase, user.id),
    fetchUnreadCount(supabase, user.id),
    // Use adminClient to bypass RLS — greeting_quotes is a public table but anon key may be blocked
    adminClient.from('greeting_quotes').select('quote_text, source').order('day_number'),
    supabase.from('member_badges').select('pillar_number').eq('user_id', user.id),
    supabase
      .from('scoreboards')
      .select('id, wig_statement, lead_1_label, lead_1_weekly_target, lead_2_label, lead_2_weekly_target')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Habit stack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_stacks')
      .select('id, name, time_of_day, sort_order')
      .eq('user_id', user.id)
      .order('sort_order')
      .limit(7),
    // Today's habit completions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_date', today),
  ])

  const quotes = quotesResult.data ?? []
  const quote = quotes?.length ? quotes[dayOfYear % quotes.length] : null
  const earnedBadges = badgeData.data?.map(b => b.pillar_number) ?? []
  const activeScoreboard = scoreboardResult.data as {
    id: string
    wig_statement: string
    lead_1_label: string
    lead_1_weekly_target: number
    lead_2_label: string
    lead_2_weekly_target: number
  } | null

  const homeHabits = (habitsResult.data ?? []) as { id: string; name: string; time_of_day: string }[]
  const homeCompletedIds = ((habitCompletionsResult.data ?? []) as { habit_id: string }[]).map(c => c.habit_id)

  const displayName = (profile.full_name ? profile.full_name.split(' ')[0] : null) ?? profile.display_name ?? 'Member'
  const upcomingEventCount = events.filter(e => !e.isRegistered).length

  return (
    <div className="p-6 space-y-5">
      <WelcomeBanner
        displayName={displayName}
        tier={profile.tier}
        avatarUrl={profile.avatar_url}
        quote={quote}
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

      <BadgeRow earnedBadges={earnedBadges} />

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-5">
        <ActivityFeed
          notifications={activity.notifications}
          completions={activity.completions}
        />
        <div className="space-y-5">
          <UpcomingEventsWidget events={events} userId={user.id} />
          <AcademyProgressWidget courses={courseProgress} />
          {/* Habit stack widget */}
          <HabitWidget initialHabits={homeHabits} initialCompletions={homeCompletedIds} />
          {/* CommitmentTracker widget — weekly commitments from the Academy */}
          <CommitmentTracker weekStart={getCurrentMonday()} />
          {/* Scoreboard widget */}
          {activeScoreboard ? (
            <div style={{ backgroundColor: '#111926', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '2px', backgroundColor: '#C9A84C' }} />
              <div style={{ padding: '16px 18px' }}>
                <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C9A84C', margin: '0 0 8px' }}>
                  Scoreboard
                </p>
                <p style={{ color: '#faf9f7', fontSize: '13px', fontWeight: 600, lineHeight: 1.45, margin: '0 0 12px', fontStyle: 'italic' }}>
                  &ldquo;{activeScoreboard.wig_statement.length > 90
                    ? activeScoreboard.wig_statement.slice(0, 90) + '…'
                    : activeScoreboard.wig_statement}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: activeScoreboard.lead_1_label, target: activeScoreboard.lead_1_weekly_target },
                    { label: activeScoreboard.lead_2_label, target: activeScoreboard.lead_2_weekly_target },
                  ].filter(m => m.label).map((m, i) => (
                    <div key={i} style={{ flex: 1, backgroundColor: '#0A0F18', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '4px', padding: '8px 10px' }}>
                      <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '10px', margin: '0 0 2px', lineHeight: 1.3 }}>{m.label}</p>
                      <p style={{ color: '#C9A84C', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', margin: 0 }}>
                        target: {m.target}/wk
                      </p>
                    </div>
                  ))}
                </div>
                <a
                  href="/academy/accountability"
                  style={{ display: 'inline-block', marginTop: '12px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', textDecoration: 'none' }}
                >
                  Update scoreboard →
                </a>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#111926', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '16px 18px' }}>
              <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', margin: '0 0 6px' }}>
                Scoreboard
              </p>
              <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.5 }}>
                Track your WIG and lead measures weekly.
              </p>
              <a
                href="/academy/accountability"
                style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none' }}
              >
                Set up your Scoreboard →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
