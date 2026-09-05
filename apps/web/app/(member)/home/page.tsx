import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import { type GoalForCard } from '@/components/home/GoalCard'
import { HomeBannerBand, type HomeWinChip } from '@/components/home/HomeBannerBand'
import { HomeAccountabilityBand } from '@/components/home/HomeAccountabilityBand'
import { HomeFuelBand, academyFuelFromProgress } from '@/components/home/HomeFuelBand'
import { HomeEpisodeCard } from '@/components/home/HomeEpisodeCard'
import { type PulsePost, type PulseEvent } from '@/components/home/tiles/CommunityPulseTile'
import { HomeContentAdGrid } from '@/components/home/HomeContentAdGrid'
import { type DailyPulseHabit, type DailyPulseCommitment } from '@/components/home/DailyPulseCard'
import { type SponsorAd } from '@/components/home/HomeSponsorAd'
import {
  isAcademyAd,
  pickHomePageAds,
  type HomePageAds,
} from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { formatRelative, formatDate } from '@/lib/format'
import { parseYouTubeId } from '@/lib/podcast/public'
import {
  computeCheckInStreak,
  homeEpisodeStill,
  isEventHappeningNow,
  isVisibleWin,
  pickFuelLiveEvent,
} from '@/lib/home/bands'
import { pickUpcomingLockedEvent, withoutConquerLocal } from '@/lib/events/nextEvent'

import { enqueueSessionNudges } from '@/lib/notifications/nudges'

export const metadata: Metadata = { title: 'Home - Evolved Pros' }

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
    adminClient.from('lessons').select('id, course_id, title, slug, sort_order, duration_seconds').eq('is_published', true),
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
      .select('id, course_id, title, slug, sort_order, duration_seconds')
      .eq('is_published', true)
    lessonRows = fallback.data ?? []
  }
  const lessons = { data: lessonRows }

  // Lessons grouped by course, sorted so we can pick the first uncompleted.
  const lessonsByCourse: Record<string, { id: string; title: string | null; slug: string | null; sort_order: number | null; duration_seconds: number | null }[]> = {}
  for (const l of (lessons.data ?? []) as { id: string; course_id: string; title: string | null; slug: string | null; sort_order: number | null; duration_seconds: number | null }[]) {
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

  // Return ALL published courses with their progress. Caller uses the full
  // list to derive per-pillar Architecture-column state in the WelcomeBanner
  // and the Path Forward in-progress / climbing pillars.
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
      nextLessonDurationSeconds: nextLesson?.duration_seconds ?? null,
    }
  })
}

async function fetchWeeklyWins(userId: string): Promise<HomeWinChip[]> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  try {
    // Query wins directly so a busy week of updates cannot hide them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (adminClient as any)
      .from('posts')
      .select('id, body, kind, post_type, status, created_at, channels(slug)')
      .eq('author_id', userId)
      .or('kind.eq.win,post_type.eq.win')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(8) as { data: Array<{
        id: string
        body: string | null
        kind: string | null
        post_type: string | null
        status: string | null
        created_at: string
        channels: { slug: string | null } | null
      }> | null }

    return (rows ?? [])
      .filter(isVisibleWin)
      .slice(0, 3)
      .map(r => ({
        id: r.id,
        label: (r.body ?? '').replace(/\s+/g, ' ').trim() || 'Win logged',
        href: r.channels?.slug
          ? `/community/${r.channels.slug}?post=${r.id}`
          : '/community',
      }))
  } catch (err) {
    console.error('[home.fetchWeeklyWins] failed:', err instanceof Error ? err.message : err)
    return []
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

// HOME-4UP-TILES helpers ────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// Compact relative age for tight tile rows (no " ago"). The activity feed uses
// the same ladder with `withAgo` so 42 days reads `6w` in both places.
function relativeAge(iso: string): string {
  return formatRelative(iso)
}

function dayLabelFor(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.floor((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tmrw'
  if (diffDays >= 2 && diffDays <= 6) return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  // Calendar stamp for events more than a week out — uppercase month ("JUL 15"),
  // never title-case "Jul 15".
  return formatDate(iso, 'stamp')
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function pillarColorFromTag(tag: string | null): string | null {
  if (!tag) return null
  // pillar can be 'p1'..'p6' (legacy) or '1'..'6' or a name
  if (tag.startsWith('p')) {
    const n = parseInt(tag.slice(1), 10)
    return n in PILLAR_CONFIG ? PILLAR_CONFIG[n as 1 | 2 | 3 | 4 | 5 | 6].color : null
  }
  const n = parseInt(tag, 10)
  if (!Number.isNaN(n) && n in PILLAR_CONFIG) return PILLAR_CONFIG[n as 1 | 2 | 3 | 4 | 5 | 6].color
  // Match by label (case-insensitive)
  const lower = tag.toLowerCase()
  for (const k of [1, 2, 3, 4, 5, 6] as const) {
    if (PILLAR_CONFIG[k].label.toLowerCase() === lower) return PILLAR_CONFIG[k].color
  }
  return null
}

// HOME fetchers — adminClient reads (RLS pattern). Each returns the
// band's own prop shape so the page just plumbs.

async function fetchLatestPulsePosts(limit = 3): Promise<PulsePost[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (adminClient as any)
    .from('posts')
    .select('id, body, pillar, pillar_tag, created_at, users!posts_author_id_fkey(display_name, full_name, tier), channels(slug)')
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit) as { data: Array<{
      id: string
      body: string
      pillar: number | null
      pillar_tag: string | null
      created_at: string
      users: { display_name: string | null; full_name: string | null; tier: string | null } | null
      channels: { slug: string | null } | null
    }> | null }

  const posts = rows ?? []
  const ids = posts.map(p => p.id)

  // SPRINT D — the denormalized posts.like_count / reply_count columns are dead
  // (the old post_likes counter is no longer maintained, so every post read 0).
  // Count live rows from post_reactions + replies — the SAME tables Community
  // reads — so Home pulse counts match Community exactly.
  const reactionsByPost = new Map<string, number>()
  const repliesByPost = new Map<string, number>()
  if (ids.length) {
    const [reactionRows, replyRows] = await Promise.all([
      (adminClient as any).from('post_reactions').select('post_id').in('post_id', ids),
      (adminClient as any).from('replies').select('post_id').in('post_id', ids),
    ])
    for (const row of (reactionRows.data ?? []) as { post_id: string }[]) {
      reactionsByPost.set(row.post_id, (reactionsByPost.get(row.post_id) ?? 0) + 1)
    }
    for (const row of (replyRows.data ?? []) as { post_id: string }[]) {
      repliesByPost.set(row.post_id, (repliesByPost.get(row.post_id) ?? 0) + 1)
    }
  }

  return posts.map(r => {
    const name = r.users?.full_name ?? r.users?.display_name ?? 'Member'
    const pillarColor = r.pillar
      ? pillarColorFromTag(String(r.pillar))
      : pillarColorFromTag(r.pillar_tag)
    // Same post permalink the notification system emits
    // (lib/notifications/create.ts): /community/{channelSlug}?post={id}.
    const href = r.channels?.slug
      ? `/community/${r.channels.slug}?post=${r.id}`
      : '/community'
    return {
      id: r.id,
      href,
      authorName: name,
      initials: getInitials(name),
      tier: r.users?.tier ?? null,
      pillarColor,
      age: relativeAge(r.created_at),
      preview: (r.body ?? '').replace(/\s+/g, ' ').trim().slice(0, 200),
      reactionCount: reactionsByPost.get(r.id) ?? 0,
      commentCount: repliesByPost.get(r.id) ?? 0,
    }
  })
}

type FuelLiveRow = {
  id: string
  title: string
  format: string | null
  event_type: string | null
  starts_at: string
  ends_at: string | null
  attending_count: number | null
}

async function fetchPinnedLiveEvent(userId: string | null): Promise<(PulseEvent & {
  endsAt: string | null
  eventType: string | null
  startsAt: string
}) | null> {
  const nowIso = new Date().toISOString()
  const eventSelect = 'id, title, format, event_type, starts_at, ends_at, attending_count'
  // Recent started rows + upcoming. pickUpcomingLockedEvent prefers the
  // CoS/George locks (book / Masterminds) and drops Conquer Local. Live vs
  // stale is then decided in pickFuelLiveEvent so a missing ends_at cannot
  // pin an old workshop.
  const [startedRes, upcomingRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('events')
      .select(eventSelect)
      .eq('is_published', true)
      .lte('starts_at', nowIso)
      .order('starts_at', { ascending: false })
      .limit(8) as Promise<{ data: FuelLiveRow[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('events')
      .select(eventSelect)
      .eq('is_published', true)
      .gt('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(20) as Promise<{ data: FuelLiveRow[] | null }>,
  ])

  const nextLocked = pickUpcomingLockedEvent(withoutConquerLocal(upcomingRes.data ?? []))
  const row = pickFuelLiveEvent(withoutConquerLocal(startedRes.data ?? []), nextLocked)
  if (!row) return null

  let initiallyRsvpd = false
  if (userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rsvp } = await (adminClient as any)
      .from('event_rsvps')
      .select('user_id')
      .eq('event_id', row.id)
      .eq('user_id', userId)
      .maybeSingle()
    initiallyRsvpd = Boolean(rsvp)
  }

  return {
    id: row.id,
    title: row.title,
    dayLabel: dayLabelFor(row.starts_at),
    timeLabel: formatTimeLabel(row.starts_at),
    attendingCount: row.attending_count ?? 0,
    initiallyRsvpd,
    endsAt: row.ends_at,
    eventType: row.event_type ?? row.format,
    startsAt: row.starts_at,
  }
}

type HomeEpisodeRow = {
  id: string
  slug: string
  title: string
  episodeNumber: number | null
  guestName: string | null
  guestImageUrl: string | null
}

async function fetchLatestEpisodes(limit = 3): Promise<{ episodes: HomeEpisodeRow[]; latestNumber: number | null }> {
  const { data: rows } = await adminClient
    .from('episodes')
    .select('id, slug, title, episode_number, guest_name, guest_title, guest_company, guest_image_url, thumbnail_url, youtube_url, duration_seconds, is_published, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  const eps = (rows ?? []).map(r => ({
    id: r.id,
    slug: r.slug,
    episodeNumber: r.episode_number,
    title: r.title,
    guestName: r.guest_name,
    guestImageUrl: homeEpisodeStill({
      guest_image_url: r.guest_image_url,
      thumbnail_url: r.thumbnail_url,
      youtube_id: parseYouTubeId(r.youtube_url),
      slug: r.slug,
      episode_number: r.episode_number,
      guest_name: r.guest_name,
    }),
  }))
  const latestNumber = eps[0]?.episodeNumber ?? null
  return { episodes: eps, latestNumber }
}

// HOME-DAILY-PULSE fetchers — habits and habit_completions FK their user_id to
// public.users.id, so reads key on profile.id (resolved by email), NOT the raw
// auth UID. auth.uid() === public.users.id is not guaranteed for accounts
// provisioned by billing webhooks.

async function fetchTodaysHabits(profileId: string): Promise<{
  habits: DailyPulseHabit[]
  streakDays: number
  checkedInToday: boolean
}> {
  const empty = { habits: [] as DailyPulseHabit[], streakDays: 0, checkedInToday: false }
  try {
    const today = new Date().toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0]

    const [habitsRes, completionsRes] = await Promise.all([
      adminClient
        .from('habits')
        .select('id, name, pillar, sort_order')
        .eq('user_id', profileId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      adminClient
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', profileId)
        .gte('completed_date', sixtyDaysAgo)
        .not('habit_id', 'is', null),
    ])

    const completedToday = new Set<string>()
    const recentCount: Record<string, number> = {}
    const completedDates: string[] = []
    for (const c of completionsRes.data ?? []) {
      if (!c.habit_id) continue
      recentCount[c.habit_id] = (recentCount[c.habit_id] ?? 0) + 1
      if (c.completed_date === today) completedToday.add(c.habit_id)
      if (c.completed_date) completedDates.push(c.completed_date)
    }

    const streak = computeCheckInStreak(completedDates, today)
    return {
      habits: (habitsRes.data ?? []).map(h => ({
        id: h.id,
        name: h.name,
        pillar: h.pillar,
        completedToday: completedToday.has(h.id),
        recentCount: recentCount[h.id] ?? 0,
      })),
      streakDays: streak.days,
      checkedInToday: streak.checkedInToday,
    }
  } catch (err) {
    console.error('[home.fetchTodaysHabits] failed:', err instanceof Error ? err.message : err)
    return empty
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
async function fetchHomeSponsors(): Promise<HomePageAds> {
  const empty: HomePageAds = { mid: [], tileRow: null, episodeRow: null, storyRow: null, endBox: null }
  try {
    const all = (await getActivePlatformAds()) as Array<SponsorAd & { placement?: string | null }>
    if (all.length === 0) return empty

    const homePool = all.filter(a => adMatchesSurface(a, 'home'))
    const pool = homePool.length ? homePool : all
    return pickHomePageAds(pool)
  } catch (err) {
    console.error('[home.fetchHomeSponsors] failed:', err instanceof Error ? err.message : err)
    return empty
  }
}

export default async function MemberHomePage() {
  // PERF: shares React.cache() with member layout — one auth+profile per request.
  const profile = await resolveCurrentUser()
  if (!profile) redirect('/login')

  const weekStart = getCurrentMonday()
  const supabase = createClient()

  const [
    courseProgress,
    badgeData,
    pulsePosts,
    pinnedLiveEvent,
    latestEpisodesResult,
    quarterlyGoalsResult,
    habitsResult,
    weekCommitments,
    weeklyWins,
    sponsors,
  ] = await Promise.all([
    fetchCourseProgress(supabase, profile.id),
    supabase.from('member_badges').select('pillar_number, awarded_at').eq('user_id', profile.id),
    fetchLatestPulsePosts(1),
    fetchPinnedLiveEvent(profile.id),
    fetchLatestEpisodes(2),
    supabase
      .from('quarterly_goals')
      .select('id, title, period, progress_pct, weekly_delta, pillar')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(5),
    fetchTodaysHabits(profile.id),
    fetchWeekCommitments(profile.id, weekStart),
    fetchWeeklyWins(profile.id),
    fetchHomeSponsors(),
  ])

  const quarterlyGoals = (quarterlyGoalsResult.data ?? []) as GoalForCard[]
  const dailyHabits = habitsResult.habits
  const earnedBadges = badgeData.data?.map(b => b.pillar_number) ?? []
  const awardedAtByPillar = new Map(
    (badgeData.data ?? []).map(b => [b.pillar_number, b.awarded_at]),
  )
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

  // ── Path Forward + Long Game (HOME-2) ───────────────────────────────
  // Derive the in-progress and "climbing toward" pillars from the same
  // pillar state the WelcomeBanner uses, then attach the per-course
  // metadata each card needs (slug, lesson counts, next lesson, etc).
  const PILLAR_NUM_TO_SLUG: Record<number, string> = {
    1: 'foundation',
    2: 'identity',
    3: 'mental-toughness',
    4: 'strategic-approach',
    5: 'accountability',
    6: 'execution',
  }

  const inProgressEntry = pillars.find(p => p.state === 'in-progress')
  const inProgressCourse = inProgressEntry ? courseByPillar.get(inProgressEntry.number) : null
  const inProgressData = inProgressEntry && inProgressCourse
    ? {
        number: inProgressEntry.number,
        name:   inProgressEntry.name,
        progressPct:      inProgressCourse.pct,
        completedLessons: inProgressCourse.completed,
        totalLessons:     inProgressCourse.total,
        courseSlug:       inProgressCourse.slug ?? PILLAR_NUM_TO_SLUG[inProgressEntry.number],
        nextLessonTitle:  inProgressCourse.nextLessonTitle,
        nextLessonSlug:   inProgressCourse.nextLessonSlug,
        // DAY N OF 21 — earliest progress on this course's lessons. The
        // schema has updated_at (touched-at proxy); good enough for a
        // motivational counter, capped at the 21-day program cadence.
        dayOfTwentyOne: inProgressCourse.firstActivity
          ? Math.min(21, Math.max(1,
              Math.ceil((Date.now() - new Date(inProgressCourse.firstActivity).getTime()) / 86_400_000),
            ))
          : null,
      }
    : null

  const goalsForCards: GoalForCard[] = quarterlyGoals.map(g => ({
    id: g.id,
    title: g.title,
    period: g.period,
    progress_pct: g.progress_pct,
    weekly_delta: g.weekly_delta,
    pillar: g.pillar,
  }))
  const wig = goalsForCards[0] ?? null

  const fuelAcademy = inProgressData
    ? academyFuelFromProgress({
        nextLessonTitle: inProgressData.nextLessonTitle,
        pillarName: inProgressData.name,
        courseSlug: inProgressData.courseSlug,
        nextLessonSlug: inProgressData.nextLessonSlug,
        completedLessons: inProgressData.completedLessons,
        totalLessons: inProgressData.totalLessons,
        progressPct: inProgressData.progressPct,
        nextLessonDurationSeconds: inProgressCourse?.nextLessonDurationSeconds ?? null,
      })
    : null

  const fuelThread = pulsePosts[0]
    ? {
        title: pulsePosts[0].preview || 'Join the conversation',
        href: pulsePosts[0].href,
        authorName: pulsePosts[0].authorName,
        replyLabel:
          pulsePosts[0].commentCount === 1
            ? '1 reply'
            : `${pulsePosts[0].commentCount} replies`,
        age: pulsePosts[0].age,
      }
    : null

  const fuelLive = pinnedLiveEvent
    ? {
        title: pinnedLiveEvent.title,
        href: `/events/${pinnedLiveEvent.id}`,
        whenLabel: `${pinnedLiveEvent.dayLabel} · ${pinnedLiveEvent.timeLabel}`,
        isLive: isEventHappeningNow(pinnedLiveEvent.startsAt, pinnedLiveEvent.endsAt),
      }
    : null

  const foldAd = [sponsors.mid[0], sponsors.tileRow, sponsors.episodeRow, sponsors.mid[1]]
    .filter((ad): ad is SponsorAd => Boolean(ad))
    .find(ad => !isAcademyAd(ad)) ?? null

  // On-open: reuse Home's already-fetched session to enqueue WIG / evening
  // daily nudges into the existing notifications table. Fire-and-forget so
  // the RSC is not blocked on the insert. NotifBell in TopNav stays the UI.
  void enqueueSessionNudges(profile.id)

  return (
    <>
      <div className="ep-page-gutter ep-surface-mobile ep-stack pb-6">
        <HomeBannerBand
          wig={wig}
          pillars={pillars}
          streakDays={habitsResult.streakDays}
          checkedInToday={habitsResult.checkedInToday}
          wins={weeklyWins}
        />

        <HomeAccountabilityBand
          habits={dailyHabits}
          commitments={weekCommitments}
        />

        <HomeFuelBand
          academy={fuelAcademy}
          thread={fuelThread}
          live={fuelLive}
        />

        {latestEpisodesResult.episodes.length > 0 ? (
          <HomeContentAdGrid
            title="Latest episodes"
            href="/podcast"
            linkLabel="All episodes"
            ad={foldAd && !isAcademyAd(foldAd) ? foldAd : null}
          >
            {latestEpisodesResult.episodes.map(ep => (
              <HomeEpisodeCard
                key={ep.id}
                href={`/podcast/${ep.slug}`}
                title={ep.title}
                guestName={ep.guestName}
                episodeNumber={ep.episodeNumber}
                guestImageUrl={ep.guestImageUrl}
              />
            ))}
          </HomeContentAdGrid>
        ) : null}

        <ProfileCompletePrompt
          hasAvatar={Boolean(profile.avatar_url)}
          hasBio={Boolean(profile.bio)}
          hasTitle={Boolean(profile.role_title)}
          hasName={Boolean(profile.display_name || profile.full_name)}
        />
      </div>
      <PublicFooter />
    </>
  )
}
