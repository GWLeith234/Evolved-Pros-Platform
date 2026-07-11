import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { TodaysEvolution } from '@/components/home/TodaysEvolution'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import type { GoalForCard } from '@/components/home/GoalCard'
import type { DailyPulseHabit, DailyPulseCommitment } from '@/components/home/DailyPulseCard'
import type { TimeBlock } from '@/components/home/TimeBlocks'
import {
  HomeSponsorRow,
  SPONSOR_AD_COLUMNS,
  type SponsorAd,
} from '@/components/home/HomeSponsorAd'
import {
  DEFAULT_HOME_SPONSORS,
  pickHomeSponsors,
  pickSidebarSponsor,
  ensureFlagshipSponsors,
} from '@/lib/sponsors/partners'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { hasTierAccess } from '@/lib/tier'

export const metadata: Metadata = { title: 'Home — Evolved Pros' }

async function fetchCurrentUser(supabase: ReturnType<typeof createClient>, email: string) {
  const { data } = await supabase
    .from('users')
    .select('id, display_name, full_name, tier, points, avatar_url, bio, role_title')
    .eq('email', email)
    .single()
  return data
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
  const [courses, lessonsResult, progress] = await Promise.all([
    supabase.from('courses').select('id, title, slug, sort_order, pillar_number').eq('is_published', true).order('sort_order'),
    // adminClient: bypasses the lessons RLS policy
    //   `auth.role() = 'authenticated' AND is_published = TRUE`
    // The Architecture pillar column on /home derives state from per-course
    // lesson totals; without adminClient, accounts where auth.uid() ≠
    // public.users.id (or anywhere RLS shadows the read) fell through to
    // 'locked' and the dots stayed grey. is_published=true keeps this count
    // aligned with the academy detail page (which also filters) — without it
    // home reported 4 for Foundation while the detail page showed 3.
    adminClient.from('lessons').select('id, course_id, title, slug, sort_order').eq('is_published', true),
    // adminClient: lesson_progress.user_id = public.users.id, but the RLS
    // policy gates on auth.uid(). Reading via the SSR client returns []
    // for accounts where auth.uid() ≠ public.users.id, which is what was
    // making YOUR ACADEMY render "No courses started yet" and the
    // Architecture pillars stay grey for George.
    adminClient
      .from('lesson_progress')
      .select('lesson_id, completed_at, updated_at')
      .eq('user_id', userId),
  ])

  // SSR fallback: adminClient silently returns [] when SUPABASE_SERVICE_ROLE_KEY
  // is missing in the deploy env. The SSR client still satisfies the lessons
  // RLS policy (auth.role()='authenticated' AND is_published=true) for
  // logged-in members, so we can recover lesson totals — the Architecture
  // pillars stay grey otherwise. Mirrors the fallback in lib/academy/fetchers.ts.
  let lessonRows = lessonsResult.data ?? []
  if (lessonRows.length === 0) {
    console.warn(
      '[home.fetchCourseProgress] adminClient lessons returned 0 — falling back to RLS-bound client. Check SUPABASE_SERVICE_ROLE_KEY.',
    )
    const fallback = await supabase
      .from('lessons')
      .select('id, course_id, title, slug, sort_order')
      .eq('is_published', true)
    lessonRows = fallback.data ?? []
  }
  const lessons = { data: lessonRows }

  // Lessons grouped by course, sorted so we can pick the first uncompleted.
  const lessonsByCourse: Record<string, { id: string; title: string | null; slug: string | null; sort_order: number | null }[]> = {}
  for (const l of (lessons.data ?? []) as { id: string; course_id: string; title: string | null; slug: string | null; sort_order: number | null }[]) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l)
  }
  for (const list of Object.values(lessonsByCourse)) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  const progressByLesson: Record<string, { completed_at: string | null; updated_at: string }> = {}
  for (const p of progress.data ?? []) {
    progressByLesson[p.lesson_id] = { completed_at: p.completed_at, updated_at: p.updated_at }
  }

  // Return ALL published courses with their progress. Caller filters/slices for
  // the AcademyProgressWidget (top-N active) and uses the full list to derive
  // per-pillar Architecture-column state in the WelcomeBanner.
  return (courses.data ?? []).map(c => {
    const courseLesson = lessonsByCourse[c.id] ?? []
    const total = courseLesson.length
    const completed = courseLesson.filter(l => progressByLesson[l.id]?.completed_at).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const completedAts = courseLesson
      .map(l => progressByLesson[l.id]?.completed_at)
      .filter((v): v is string => Boolean(v))
      .sort()
    const updatedAts = courseLesson
      .map(l => progressByLesson[l.id]?.updated_at)
      .filter((v): v is string => Boolean(v))
      .sort()
    const lastActivity     = updatedAts.length > 0 ? updatedAts[updatedAts.length - 1] : null
    const firstActivity    = updatedAts.length > 0 ? updatedAts[0] : null
    const lastCompletedAt  = completedAts.length > 0 ? completedAts[completedAts.length - 1] : null
    // First uncompleted lesson by sort_order — the "Next up" target for the
    // InProgressPillarHero CTA and the GoalCard's tied-to-path mirror.
    const nextLesson = courseLesson.find(l => !progressByLesson[l.id]?.completed_at) ?? null
    return {
      ...c,
      total,
      completed,
      pct,
      lastActivity,
      firstActivity,
      lastCompletedAt,
      nextLessonTitle: nextLesson?.title ?? null,
      nextLessonSlug:  nextLesson?.slug  ?? null,
    }
  })
}

// Scoreboard counts — all keyed on public.users.id (profile.id, resolved by
// email in fetchCurrentUser) and read via adminClient, because every one of
// these tables now FKs public.users(id) while RLS still gates on auth.uid().
// The Posts cell previously counted unread notifications (wrong table) and
// Podcast/Stories were hardcoded 0 — a member with 38 posts saw "Posts 0".
async function fetchScoreboardCounts(userId: string) {
  const [posts, episodes, storyComments] = await Promise.all([
    adminClient
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId),
    adminClient
      .from('user_episode_progress')
      .select('episode_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    adminClient
      .from('story_comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])
  return {
    postCount: posts.count ?? 0,
    podcastCount: episodes.count ?? 0,
    storyCount: storyComments.count ?? 0,
  }
}

function getCurrentMonday(): string {
  // On Sunday, treat the upcoming Monday (tomorrow) as belonging to the
  // member's "this week" — that matches the user's mental model of the
  // workweek and keeps server-rendered SSR aligned with the client-side
  // localMondayString() helper inside CommitmentTracker.
  const now = new Date()
  const ref = now.getDay() === 0 ? new Date(now.getTime() + 86_400_000) : now
  const day = ref.getDay()
  const diff = 1 - day
  const monday = new Date(ref)
  monday.setDate(ref.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

// HOME-DAILY-PULSE fetchers — habits and habit_completions both FK to
// auth.users(id), so reads key on user.id (auth UID), not profile.id.

async function fetchTodaysHabits(authUserId: string): Promise<DailyPulseHabit[]> {
  // Wrapped in try/catch so a transient network blip or unexpected RLS
  // change returns [] instead of bubbling up. An undefined return here
  // used to trip the Daily Pulse card's Suspense boundary (#422) and
  // remove the entire 4th tile silently.
  try {
    const today = new Date().toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0]

    const [habitsRes, completionsRes] = await Promise.all([
      adminClient
        .from('habits')
        .select('id, name, pillar, sort_order')
        .eq('user_id', authUserId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      adminClient
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', authUserId)
        .gte('completed_date', sixtyDaysAgo)
        .not('habit_id', 'is', null),
    ])

    const completedToday = new Set<string>()
    const recentCount: Record<string, number> = {}
    for (const c of completionsRes.data ?? []) {
      if (!c.habit_id) continue
      recentCount[c.habit_id] = (recentCount[c.habit_id] ?? 0) + 1
      if (c.completed_date === today) completedToday.add(c.habit_id)
    }

    return (habitsRes.data ?? []).map(h => ({
      id: h.id,
      name: h.name,
      pillar: h.pillar,
      completedToday: completedToday.has(h.id),
      recentCount: recentCount[h.id] ?? 0,
    }))
  } catch (err) {
    console.error('[home.fetchTodaysHabits] failed:', err instanceof Error ? err.message : err)
    return []
  }
}

/** weekly_commitments.user_id stores public.users.id (profile.id), not auth.uid(). */
async function fetchWeekCommitments(profileId: string, weekStart: string): Promise<DailyPulseCommitment[]> {
  try {
    const { data } = await adminClient
      .from('weekly_commitments')
      .select('id, commitment, is_completed, week_start, created_at')
      .eq('user_id', profileId)
      .eq('week_start', weekStart)
      .order('created_at', { ascending: true })
      .limit(5)
    return (data ?? []).map(c => ({
      id: c.id,
      commitment: c.commitment,
      is_completed: c.is_completed,
    }))
  } catch (err) {
    console.error('[home.fetchWeekCommitments] failed:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Server-fetch Evolution Partner ads so /home doesn't pay a client
 * waterfall + mount gate for the sponsor row and sidebar. adminClient
 * bypasses RLS so members always see active placements.
 */
async function fetchHomeSponsors(): Promise<{ home: SponsorAd[]; sidebar: SponsorAd | null }> {
  // Main row: 2 rotated partners. Sidebar: 1 different partner (no dups).
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = adminClient as any
    const { data: rows } = await sb
      .from('platform_ads')
      .select(SPONSOR_AD_COLUMNS + ', placement')
      .eq('is_active', true)
      .order('sort_order')
      .limit(12)

    const all = (rows ?? []) as Array<SponsorAd & { placement?: string | null }>
    if (all.length === 0) {
      const home = pickHomeSponsors(DEFAULT_HOME_SPONSORS)
      return {
        home,
        sidebar: pickSidebarSponsor(DEFAULT_HOME_SPONSORS, home),
      }
    }

    const homePool = all.filter(a => {
      const p = (a.placement ?? 'all').toLowerCase()
      return p === 'home' || p === 'all'
    })
    const pool = ensureFlagshipSponsors(homePool.length ? homePool : all)
    const home = pickHomeSponsors(pool)
    const sidebarPool = all.filter(a => {
      const p = (a.placement ?? 'all').toLowerCase()
      return p === 'sidebar' || p === 'all'
    })
    const sidebar =
      pickSidebarSponsor(sidebarPool.length ? sidebarPool : all, home) ??
      pickSidebarSponsor(pool, home)

    return { home, sidebar }
  } catch (err) {
    console.error('[home.fetchHomeSponsors] failed:', err instanceof Error ? err.message : err)
    const home = pickHomeSponsors(DEFAULT_HOME_SPONSORS)
    return {
      home,
      sidebar: pickSidebarSponsor(DEFAULT_HOME_SPONSORS, home),
    }
  }
}

async function fetchTodayTimeBlocks(authUserId: string): Promise<TimeBlock[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await (adminClient as any)
      .from('daily_time_blocks')
      .select('id, block_date, start_time, end_time, label, category, completed, sort_order')
      .eq('user_id', authUserId)
      .eq('block_date', today)
      .order('start_time', { ascending: true })
    return (data ?? []) as TimeBlock[]
  } catch (err) {
    console.error('[home.fetchTodayTimeBlocks]', err instanceof Error ? err.message : err)
    return []
  }
}

export default async function MemberHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchCurrentUser(supabase, user.email!)
  if (!profile) redirect('/login')

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )

  const weekStart = getCurrentMonday()

  const [
    events,
    courseProgress,
    scoreboardCounts,
    quotesResult,
    badgeData,
    quarterlyGoalsResult,
    // HOME-DAILY-PULSE fetchers
    dailyHabits,
    weekCommitments,
    timeBlocks,
    sponsors,
  ] = await Promise.all([
    fetchUpcomingEvents(supabase, profile.id),
    fetchCourseProgress(supabase, profile.id),
    fetchScoreboardCounts(profile.id),
    // Use adminClient to bypass RLS — greeting_quotes is a public table but anon key may be blocked
    adminClient.from('greeting_quotes').select('quote_text, source').order('day_number'),
    supabase.from('member_badges').select('pillar_number, awarded_at').eq('user_id', profile.id),
    supabase
      .from('quarterly_goals')
      .select('id, title, period, progress_pct, weekly_delta, pillar')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(5),
    // HOME-DAILY-PULSE — habits FK to auth.users(id); commitments FK to profile.id.
    fetchTodaysHabits(user.id),
    fetchWeekCommitments(profile.id, weekStart),
    fetchTodayTimeBlocks(user.id),
    // Sponsor ads SSR — avoids client waterfall after paint
    fetchHomeSponsors(),
  ])

  const quarterlyGoals = (quarterlyGoalsResult.data ?? []) as GoalForCard[]

  const quotes = quotesResult.data ?? []
  const quote = quotes?.length ? quotes[dayOfYear % quotes.length] : null
  const earnedBadges = badgeData.data?.map(b => b.pillar_number) ?? []
  const awardedAtByPillar = new Map(
    (badgeData.data ?? []).map(b => [b.pillar_number, b.awarded_at]),
  )

  const displayName = (profile.full_name ? profile.full_name.split(' ')[0] : null) ?? profile.display_name ?? 'Member'
  const upcomingEventCount = events.filter(e => !e.isRegistered).length

  const earnedSet = new Set(earnedBadges)

  // Index courses by pillar_number so the Architecture column can read
  // per-pillar progress directly. Earned wins over progress (a member
  // can have a manually-awarded badge before they hit 100%, and a 100%
  // course should also count as earned even when no badge row exists).
  const courseByPillar = new Map<number, typeof courseProgress[number]>()
  for (const c of courseProgress) {
    if (c.pillar_number != null) courseByPillar.set(c.pillar_number, c)
  }

  const pillars = ([1, 2, 3, 4, 5, 6] as const).map(n => {
    const name = PILLAR_CONFIG[n].label
    const cp = courseByPillar.get(n)
    const isEarnedFromCompletion = cp ? cp.total > 0 && cp.pct === 100 : false

    if (earnedSet.has(n) || isEarnedFromCompletion) {
      // earnedAt: prefer the badge-awarded timestamp; otherwise fall back to
      // the most recent lesson completed_at within the course. This is what
      // the WelcomeBanner JustEarned pill gates on (fires when < 7 days old).
      const earnedAt = awardedAtByPillar.get(n) ?? cp?.lastCompletedAt ?? null
      return { number: n, name, state: 'earned' as const, earnedAt }
    }
    if (cp && cp.completed > 0) {
      return { number: n, name, state: 'in-progress' as const, progressPct: cp.pct }
    }
    return { number: n, name, state: 'locked' as const }
  })


  const goalsForCards: GoalForCard[] = quarterlyGoals.map(g => ({
    id: g.id,
    title: g.title,
    period: g.period,
    progress_pct: g.progress_pct,
    weekly_delta: g.weekly_delta,
    pillar: g.pillar,
  }))

  return (
    <div className="ep-page-gutter px-6 pb-6 space-y-5">
      <EpisodeBanner />
      <WelcomeBanner
        displayName={displayName}
        tier={profile.tier}
        avatarUrl={profile.avatar_url}
        quote={quote}
        scoreboard={{
          postCount: scoreboardCounts.postCount,
          upcomingEventCount,
          podcastCount: scoreboardCounts.podcastCount,
          storyCount: scoreboardCounts.storyCount,
        }}
        pillars={pillars}
      />

      <ProfileCompletePrompt
        hasAvatar={Boolean(profile.avatar_url)}
        hasBio={Boolean(profile.bio)}
        hasTitle={Boolean(profile.role_title)}
        hasName={Boolean(profile.display_name || profile.full_name)}
      />

      {/* Primary daily dashboard: lead measures + lag measures + time blocking. */}
      <TodaysEvolution
        displayName={displayName}
        habits={dailyHabits}
        commitments={weekCommitments}
        goals={goalsForCards}
        timeBlocks={timeBlocks}
      />

      {/* Exactly two rotating Evolution Partner cards. */}
      <HomeSponsorRow ads={sponsors.home} />
    </div>
  )
}
