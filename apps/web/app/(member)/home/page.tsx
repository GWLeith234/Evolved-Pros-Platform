import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'

export const metadata: Metadata = { title: 'Home — Evolved Pros' }
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { HomeMetricsStrip } from '@/components/home/HomeMetricsStrip'
import { TodaysEvolution, type TodaysEvolutionAction } from '@/components/home/TodaysEvolution'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { UpcomingEventsWidget } from '@/components/home/UpcomingEventsWidget'
import { AcademyProgressWidget } from '@/components/home/AcademyProgressWidget'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import { PillarJourneyStrip, type PillarStripItem } from '@/components/home/PillarJourneyStrip'
import { InProgressPillarHero } from '@/components/home/InProgressPillarHero'
import { ClimbingTowardCard } from '@/components/home/ClimbingTowardCard'
import { GoalCard, type GoalForCard } from '@/components/home/GoalCard'
import { AccountabilityHub } from '@/components/home/AccountabilityHub'
import { ScoreboardHero } from '@/components/scoreboard/ScoreboardHero'
import { CommunityPulseTile, type PulsePost, type PulseEvent } from '@/components/home/tiles/CommunityPulseTile'
import { TopStoriesTile, type PulseStory } from '@/components/home/tiles/TopStoriesTile'
import { PodcastReelTile, type PulseEpisode } from '@/components/home/tiles/PodcastReelTile'
import { DailyPulseCard, type DailyPulseHabit, type DailyPulseCommitment } from '@/components/home/DailyPulseCard'
import {
  HomeSponsorAd,
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
import { fetchPillarProgress } from '@/lib/scoreboard/fetchPillarProgress'
import { hasTierAccess } from '@/lib/tier'
import { formatRelative, formatDuration as formatMinutes, formatDate } from '@/lib/format'

async function fetchCurrentUser(supabase: ReturnType<typeof createClient>, email: string) {
  const { data } = await supabase
    .from('users')
    .select('id, display_name, full_name, tier, points, avatar_url, bio, role_title')
    .eq('email', email)
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
    // lesson_progress.user_id stores public.users.id (the value passed in here),
    // NOT auth.uid(). The RLS policy is `auth.uid() = user_id`, which silently
    // filters every row when those two diverge. Use adminClient to bypass it.
    adminClient.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', userId).not('completed_at', 'is', null),
    supabase.from('users').select('id', { count: 'exact', head: true }).gt('points', userPoints),
  ])

  const allCourses = courses.data ?? []
  const accessible = allCourses.filter(c => hasTierAccess(userTier as 'community' | 'vip' | 'pro' | null, c.required_tier as 'community' | 'vip' | 'pro' | null))
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

async function fetchRecentActivity(userId: string) {
  // Use adminClient to bypass RLS so activity always loads regardless of policy gaps.
  // userId here is profile.id — the public users UUID confirmed by the already-fetched profile.
  const [notifications, completions, posts] = await Promise.all([
    adminClient
      .from('notifications')
      .select('id, type, title, body, action_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('lesson_progress')
      .select('lesson_id, completed_at, lessons(id, title, sort_order, course_id, courses(title, slug, pillar_number))')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    // Posts the user authored — author_id stores the auth UUID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('posts')
      .select('id, body, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])
  return {
    notifications: notifications.data ?? [],
    completions: completions.data ?? [],
    posts: (posts.data ?? []) as { id: string; body: string; created_at: string }[],
  }
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

function readTimeForBody(body: string | null): string {
  const words = body ? body.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.ceil(words / 220))
  // Read time is always ≥1 min, so formatMinutes never returns null here.
  return formatMinutes(minutes) ?? ''
}

// Episode duration: seconds → "N min", or null so the tile hides the slot
// (never a bare "—").
function episodeDurationLabel(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  return formatMinutes(Math.round(seconds / 60))
}

const TILE_PILLAR_ROTATION = [
  PILLAR_CONFIG[4].color, // strategy blue
  PILLAR_CONFIG[2].color, // identity violet
  PILLAR_CONFIG[6].color, // execution teal
  PILLAR_CONFIG[5].color, // accountability gold
  PILLAR_CONFIG[1].color, // foundation orange
  PILLAR_CONFIG[3].color, // mental toughness red
]

// HOME-4UP-TILES fetchers — adminClient reads (RLS pattern, public ISR
// rule). Each returns the tile's own prop shape so the page just plumbs.

async function fetchLatestPulsePosts(limit = 3): Promise<PulsePost[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (adminClient as any)
    .from('posts')
    .select('id, body, pillar, pillar_tag, like_count, reply_count, created_at, users!posts_author_id_fkey(display_name, full_name, tier), channels(slug)')
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit) as { data: Array<{
      id: string
      body: string
      pillar: number | null
      pillar_tag: string | null
      like_count: number
      reply_count: number
      created_at: string
      users: { display_name: string | null; full_name: string | null; tier: string | null } | null
      channels: { slug: string | null } | null
    }> | null }

  return (rows ?? []).map(r => {
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
      reactionCount: r.like_count ?? 0,
      commentCount: r.reply_count ?? 0,
    }
  })
}

async function fetchPinnedLiveEvent(userId: string | null): Promise<PulseEvent | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (adminClient as any)
    .from('events')
    .select('id, title, format, starts_at, attending_count')
    .eq('is_published', true)
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle() as { data: {
      id: string
      title: string
      format: string | null
      starts_at: string
      attending_count: number | null
    } | null }
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
  }
}

async function fetchTopStories(limit = 3): Promise<PulseStory[]> {
  const { data: rows } = await adminClient
    .from('media_stories')
    .select('id, slug, title, body, pillar, views, is_featured, published_at')
    .eq('is_published', true)
    .order('views', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  return (rows ?? []).map(r => {
    const pillarColor = pillarColorFromTag(r.pillar)
    return {
      id: r.id,
      slug: r.slug,
      pillar: r.pillar ?? null,
      category: r.pillar ?? 'Story',
      categoryColor: pillarColor,
      title: r.title,
      readTime: readTimeForBody(r.body),
      isHot: Boolean(r.is_featured) || (r.views ?? 0) >= 500,
    }
  })
}

async function fetchLatestEpisodes(limit = 3): Promise<{ episodes: PulseEpisode[]; latestNumber: number | null }> {
  const { data: rows } = await adminClient
    .from('episodes')
    .select('id, slug, title, episode_number, guest_name, guest_title, guest_company, duration_seconds, is_published, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  const sevenDaysAgo = Date.now() - 7 * 86_400_000
  const eps = (rows ?? []).map((r, i) => ({
    id: r.id,
    slug: r.slug,
    episodeNumber: r.episode_number,
    title: r.title,
    guestName: r.guest_name,
    guestTitle: r.guest_title,
    guestCompany: r.guest_company,
    durationLabel: episodeDurationLabel(r.duration_seconds),
    isNew: r.published_at ? new Date(r.published_at).getTime() > sevenDaysAgo : false,
    accent: TILE_PILLAR_ROTATION[i % TILE_PILLAR_ROTATION.length],
  }))
  const latestNumber = eps[0]?.episodeNumber ?? null
  return { episodes: eps, latestNumber }
}

// HOME-DAILY-PULSE fetchers — habits and habit_completions FK their user_id to
// public.users.id, so reads key on profile.id (resolved by email), NOT the raw
// auth UID. auth.uid() === public.users.id is not guaranteed for future
// Vendasta-provisioned signups.

async function fetchTodaysHabits(profileId: string): Promise<DailyPulseHabit[]> {
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
    stats,
    activity,
    events,
    courseProgress,
    scoreboardCounts,
    quotesResult,
    badgeData,
    // HOME-4UP-TILES fetchers
    pulsePosts,
    pinnedLiveEvent,
    topStories,
    latestEpisodesResult,
    quarterlyGoalsResult,
    // HOME-DAILY-PULSE fetchers
    dailyHabits,
    weekCommitments,
    sponsors,
    pillarProgress,
  ] = await Promise.all([
    // MR-HOME-1: lesson_progress / member_badges store rows under
    // public.users.id, NOT auth.uid(). Pass profile.id (resolved via
    // email in fetchCurrentUser) so the queries actually return data
    // for accounts where auth.uid() ≠ public.users.id. Same root cause
    // as B1 / B2 / UI-3.
    fetchDashboardStats(supabase, profile.id, profile.tier, profile.points),
    fetchRecentActivity(profile.id),
    fetchUpcomingEvents(supabase, profile.id),
    fetchCourseProgress(supabase, profile.id),
    fetchScoreboardCounts(profile.id),
    // Use adminClient to bypass RLS — greeting_quotes is a public table but anon key may be blocked
    adminClient.from('greeting_quotes').select('quote_text, source').order('day_number'),
    supabase.from('member_badges').select('pillar_number, awarded_at').eq('user_id', profile.id),
    fetchLatestPulsePosts(3),
    fetchPinnedLiveEvent(profile.id),
    fetchTopStories(3),
    fetchLatestEpisodes(3),
    supabase
      .from('quarterly_goals')
      .select('id, title, period, progress_pct, weekly_delta, pillar')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(5),
    // HOME-DAILY-PULSE — habits, habit_completions, and weekly_commitments all
    // FK their user_id to public.users.id, so key on profile.id (email-resolved).
    fetchTodaysHabits(profile.id),
    fetchWeekCommitments(profile.id, weekStart),
    // Sponsor ads SSR — avoids client waterfall after paint
    fetchHomeSponsors(),
    // SPRINT-1 GOALS-ON-HOME — pillar progress for the Enhanced Scoreboard,
    // keyed on the email-resolved profile.id (same fetcher /scoreboard uses).
    fetchPillarProgress(profile.id),
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

  // Top-N active courses for the AcademyProgressWidget. "Active" = the
  // member touched at least one lesson (lastActivity present) or made
  // any completion progress (pct > 0). Sorted by recency.
  const activeCourses = [...courseProgress]
    .filter(c => c.lastActivity !== null || c.pct > 0)
    .sort((a, b) => {
      if (!a.lastActivity) return 1
      if (!b.lastActivity) return -1
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    })
    .slice(0, 3)

  // ── Path Forward + Long Game (HOME-2) ───────────────────────────────
  // Derive the in-progress and "climbing toward" pillars from the same
  // pillar state the WelcomeBanner uses, then attach the per-course
  // metadata each card needs (slug, lesson counts, next lesson, etc).
  const PILLAR_NUM_TO_SLUG: Record<number, string> = {
    1: 'foundation',
    2: 'identity',
    3: 'mental-toughness',
    4: 'strategy',
    5: 'accountability',
    6: 'execution',
  }

  const stripPillars: PillarStripItem[] = pillars.map(p => ({
    number: p.number,
    name: p.name,
    state: p.state,
    progressPct: p.state === 'in-progress' ? p.progressPct : undefined,
  }))

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

  const climbingEntry = pillars.find(p => p.state === 'locked')
  const climbingCourse = climbingEntry ? courseByPillar.get(climbingEntry.number) : null
  const climbingData = climbingEntry
    ? {
        number: climbingEntry.number,
        name:   climbingEntry.name,
        totalLessons: climbingCourse?.total ?? 0,
        courseSlug:   climbingCourse?.slug ?? PILLAR_NUM_TO_SLUG[climbingEntry.number],
      }
    : null

  // The accountability mirror: a goal whose pillar slug matches the
  // in-progress pillar gets a "↳ TIED TO PATH FORWARD" footer linking
  // to the same lesson the InProgressPillarHero CTA points at.
  const inProgressPillarSlug = inProgressData?.courseSlug ?? null
  const inProgressContinueHref = inProgressData
    ? (inProgressData.nextLessonSlug
        ? `/academy/${inProgressData.courseSlug}/${inProgressData.nextLessonSlug}`
        : `/academy/${inProgressData.courseSlug}`)
    : null
  const goalsForCards: GoalForCard[] = quarterlyGoals.map(g => ({
    id: g.id,
    title: g.title,
    period: g.period,
    progress_pct: g.progress_pct,
    weekly_delta: g.weekly_delta,
    pillar: g.pillar,
  }))

  // Today's Evolution — one-click DAU loop (course, accountability, community)
  const habitsDone = dailyHabits.filter(h => h.completedToday).length
  const commitsDone = weekCommitments.filter(c => c.is_completed).length
  const courseHref = inProgressData
    ? (inProgressData.nextLessonSlug
        ? `/academy/${inProgressData.courseSlug}/${inProgressData.nextLessonSlug}`
        : `/academy/${inProgressData.courseSlug}`)
    : '/academy/foundation'
  const todaysActions: TodaysEvolutionAction[] = [
    {
      id: 'learn',
      eyebrow: 'Learn',
      title: inProgressData
        ? `Continue ${inProgressData.name}`
        : 'Start Foundation',
      description: inProgressData?.nextLessonTitle
        ? `Next: ${inProgressData.nextLessonTitle}`
        : inProgressData
          ? `${inProgressData.progressPct}% complete — keep the streak.`
          : 'Lesson 1 of the 6-pillar system. Begin now.',
      href: courseHref,
      cta: inProgressData ? 'Resume lesson' : 'Open Foundation',
      accent: '#C9302A',
      primary: true,
    },
    {
      id: 'accountability',
      eyebrow: 'Accountability',
      title: commitsDone > 0 || weekCommitments.length > 0
        ? `${commitsDone}/${Math.max(weekCommitments.length, 1)} commitments`
        : 'Set this week’s commitments',
      description: weekCommitments.length
        ? 'Check off what you said you’d do — scoreboard stays honest.'
        : 'Write 1–2 weekly commitments and hold the line.',
      href: '/home',
      cta: 'Open scoreboard',
      accent: '#C9A84C',
    },
    {
      id: 'habits',
      eyebrow: 'Daily pulse',
      title: dailyHabits.length
        ? `${habitsDone}/${dailyHabits.length} habits today`
        : 'Build your habit stack',
      description: dailyHabits.length
        ? 'Tap habits in the Accountability Hub to log today’s work.'
        : 'Three daily habits. Compound quiet excellence.',
      href: '/home#accountability-hub',
      cta: dailyHabits.length ? 'Log habits' : 'Open hub',
      accent: '#0ABFA3',
    },
    {
      id: 'community',
      eyebrow: 'Community',
      title: 'Show up in the feed',
      description: 'Post a win, ask a hard question, or vote on today’s poll.',
      href: '/community',
      cta: 'Open feed',
      accent: '#A78BFA',
    },
  ]

  return (
    <div className="ep-page-gutter ep-surface-mobile pb-6 space-y-4 sm:space-y-5">
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

      {/* ABOVE THE FOLD — the single canonical daily accountability block, and
          the first interactive thing a returning member sees: current streak,
          today's habits (n/N) + log, today's Daily Pulse ring, today's
          commitment. SPRINT 2: deduped to one instance; the daily rings live
          only here. */}
      <AccountabilityHub
        variant="compact"
        habits={dailyHabits}
        commitments={weekCommitments}
        goals={goalsForCards}
        courseHref={courseHref}
        courseLabel={inProgressData ? `Continue ${inProgressData.name}` : 'Start Foundation'}
      />

      {/* BELOW THE FOLD — accountability reinforcement in SPRINT 2 order:
          (1) KPI strip + Pace Read → (2) weekly commitments → (3) long game →
          (4) Pillar Overview. These reuse ScoreboardHero (rings suppressed here
          since the above-fold block owns them) and email-resolved data. */}

      {/* (1) Enhanced Scoreboard — KPI strip + Pace Read */}
      <section aria-label="Scoreboard summary">
        <ScoreboardHero
          habits={dailyHabits}
          commitments={weekCommitments}
          goals={goalsForCards}
          pillars={pillarProgress}
          courseHref={courseHref}
          courseLabel={inProgressData ? `Continue ${inProgressData.name}` : 'Start Foundation'}
          displayName={displayName}
          showHeader={false}
          showRings={false}
          showPillars={false}
        />
      </section>

      {/* (2) Weekly commitments + editor */}
      <CommitmentTracker weekStart={getCurrentMonday()} />

      {/* (3) The Long Game — quarterly goals */}
      <section aria-label="Quarterly goals" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            The Long Game
          </p>
          <a
            href="/home"
            className="ep-btn ep-btn--tertiary font-condensed font-bold uppercase tracking-[0.14em] text-[10px]"
            style={{ color: 'var(--brand-gold, #C9A84C)', textDecoration: 'none' }}
          >
            Scoreboard →
          </a>
        </div>
        {goalsForCards.length === 0 ? (
          <div
            className="rounded-lg p-5 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
          >
            <p className="font-condensed text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              No active goals yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goalsForCards.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                inProgressPillarSlug={inProgressPillarSlug}
                inProgressContinueHref={inProgressContinueHref}
              />
            ))}
          </div>
        )}
      </section>

      {/* (4) Pillar Overview */}
      <section aria-label="Pillar overview">
        <ScoreboardHero
          habits={dailyHabits}
          commitments={weekCommitments}
          goals={goalsForCards}
          pillars={pillarProgress}
          courseHref={courseHref}
          courseLabel={inProgressData ? `Continue ${inProgressData.name}` : 'Start Foundation'}
          displayName={displayName}
          showHeader={false}
          showKpi={false}
          showRings={false}
          showPace={false}
        />
      </section>

      {/* ——— The rest: one-click actions, personal metrics, community & media ——— */}

      {/* Today's Evolution — one-click actions */}
      <TodaysEvolution actions={todaysActions} />

      {/* Personal scoreboard metrics */}
      <HomeMetricsStrip stats={stats} />

      {/* HOME tiles — Community Pulse / Top Stories / Latest Drops / Daily Pulse */}
      <div
        className="home-4up-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
      >
        <CommunityPulseTile posts={pulsePosts} pinnedEvent={pinnedLiveEvent} />
        <TopStoriesTile stories={topStories} />
        <PodcastReelTile episodes={latestEpisodesResult.episodes} latestEpisodeNumber={latestEpisodesResult.latestNumber} />
        <DailyPulseCard habits={dailyHabits} commitments={weekCommitments} />
      </div>

      {/* Evolution Partner row — SSR-fetched platform_ads (no client waterfall). */}
      <HomeSponsorRow ads={sponsors.home} />

      <ProfileCompletePrompt
        hasAvatar={Boolean(profile.avatar_url)}
        hasBio={Boolean(profile.bio)}
        hasTitle={Boolean(profile.role_title)}
        hasName={Boolean(profile.display_name || profile.full_name)}
      />

      {/* Daily Practice — habits / commitments / activity */}
      <div id="daily-practice" className="ep-section-eyebrow pt-3">
        <span className="ep-section-eyebrow__rule" aria-hidden />
        <span className="ep-section-eyebrow__label">The Daily Practice</span>
        <span className="ep-section-eyebrow__grow" aria-hidden />
      </div>

      {/* SPRINT J — Activity (2fr) + Events sidebar (1fr) with sponsor ad
          tucked under the Events card. Was 7fr/5fr with AcademyProgressWidget
          on the right; AcademyProgressWidget moved into "The Path Forward"
          row below per the design. */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
        <ActivityFeed
          notifications={activity.notifications}
          completions={activity.completions}
          posts={activity.posts}
        />
        <div className="space-y-5 lg:self-start">
          <UpcomingEventsWidget events={events} />
          {/* Sidebar Evolution Partner — SSR-fetched, de-duped from home row. */}
          <HomeSponsorAd ad={sponsors.sidebar} />
        </div>
      </div>

      {/* SPRINT J — Section divider: "The Path Forward". */}
      <div className="ep-section-eyebrow pt-3">
        <span className="ep-section-eyebrow__rule" aria-hidden />
        <span className="ep-section-eyebrow__label">The Path Forward</span>
        <span className="ep-section-eyebrow__grow" aria-hidden />
      </div>

      {/* HOME-2 — Path Forward (left) + Long Game (right). SPRINT J: AcademyProgressWidget
          moved into the left column (after the Climbing card) to match the design's
          "Your Academy (2fr) | Goals (1fr)" lower row. Grid widened to 2fr/1fr. */}
      {/* Path Forward — single column. The Long Game / quarterly goals moved
          into the accountability cluster above the fold (SPRINT 2). */}
      <div className="space-y-4">
        <PillarJourneyStrip pillars={stripPillars} />
        {inProgressData && (
          <InProgressPillarHero
            pillar={{
              number: inProgressData.number,
              name: inProgressData.name,
              progressPct: inProgressData.progressPct,
              completedLessons: inProgressData.completedLessons,
              totalLessons: inProgressData.totalLessons,
            }}
            courseSlug={inProgressData.courseSlug}
            dayOfTwentyOne={inProgressData.dayOfTwentyOne}
            nextLessonTitle={inProgressData.nextLessonTitle}
            nextLessonSlug={inProgressData.nextLessonSlug}
          />
        )}
        {climbingData && (
          <ClimbingTowardCard
            pillar={{
              number: climbingData.number,
              name: climbingData.name,
              totalLessons: climbingData.totalLessons,
            }}
            courseSlug={climbingData.courseSlug}
          />
        )}
        <AcademyProgressWidget courses={activeCourses} />
      </div>

    </div>
  )
}
