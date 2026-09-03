import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'
import { HomeContextStrip } from '@/components/home/HomeContextStrip'
import { countUserPosts } from '@/lib/community/postCount'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getGreetingQuotes, getActivePlatformAds } from '@/lib/cache/shared'

export const metadata: Metadata = { title: 'Home — Evolved Pros' }
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { TodaysEvolution, type TodaysEvolutionAction } from '@/components/home/TodaysEvolution'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import { InProgressPillarHero } from '@/components/home/InProgressPillarHero'
import { ClimbingTowardCard } from '@/components/home/ClimbingTowardCard'
import { GoalCard, type GoalForCard } from '@/components/home/GoalCard'
import { AccountabilityHub } from '@/components/home/AccountabilityHub'
import { CommunityPulseTile, type PulsePost, type PulseEvent } from '@/components/home/tiles/CommunityPulseTile'
import { TopStoriesTile, type PulseStory } from '@/components/home/tiles/TopStoriesTile'
import { PodcastReelTile, type PulseEpisode } from '@/components/home/tiles/PodcastReelTile'
import { type DailyPulseHabit, type DailyPulseCommitment } from '@/components/home/DailyPulseCard'
import {
  HomeSponsorAd,
  type SponsorAd,
} from '@/components/home/HomeSponsorAd'
import {
  pickHomeEndBigBox,
  pickHomeSponsors,
} from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { formatRelative, formatDuration as formatMinutes, formatDate } from '@/lib/format'

async function fetchUpcomingEvents(supabase: ReturnType<typeof createClient>, userId: string) {
  const [events, registrations] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, required_tier')
      .eq('is_published', true)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(2),
    // SPRINT B — event RSVPs live in event_rsvps (event_registrations is the
    // legacy table, left in place for the Admin lane's migration queue).
    supabase
      .from('event_rsvps')
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
    }
  })
}

// Scoreboard counts — all keyed on public.users.id (profile.id, resolved by
// email in fetchCurrentUser) and read via adminClient, because every one of
// these tables now FKs public.users(id) while RLS still gates on auth.uid().
// The Posts cell previously counted unread notifications (wrong table) and
// Podcast/Stories were hardcoded 0 — a member with 38 posts saw "Posts 0".
async function fetchScoreboardCounts(userId: string) {
  const [postCount, episodes, storyComments] = await Promise.all([
    // Post count goes through the shared countUserPosts helper — the exact rule
    // the Profile uses (excludes `rejected`), so Home's inline count and the
    // Profile count land on the same number for a given user.
    countUserPosts(adminClient, userId),
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
    postCount,
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
// auth UID. auth.uid() === public.users.id is not guaranteed for accounts
// provisioned by billing webhooks.

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
async function fetchHomeSponsors(): Promise<{ home: SponsorAd[]; end: SponsorAd | null }> {
  // Mid-scroll: 2 rotated partners (placement George locked). End: one Zone E.
  try {
    const all = (await getActivePlatformAds()) as Array<SponsorAd & { placement?: string | null }>
    if (all.length === 0) {
      return { home: [], end: null }
    }

    const homePool = all.filter(a => adMatchesSurface(a, 'home'))
    const pool = homePool.length ? homePool : all
    const home = pickHomeSponsors(pool)
    return { home, end: pickHomeEndBigBox(pool, home) }
  } catch (err) {
    console.error('[home.fetchHomeSponsors] failed:', err instanceof Error ? err.message : err)
    return { home: [], end: null }
  }
}

export default async function MemberHomePage() {
  // PERF: shares React.cache() with member layout — one auth+profile per request.
  const profile = await resolveCurrentUser()
  if (!profile) redirect('/login')

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )

  const weekStart = getCurrentMonday()
  const supabase = createClient()

  const [
    events,
    courseProgress,
    scoreboardCounts,
    quotes,
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
  ] = await Promise.all([
    // MR-HOME-1: member_badges / lesson-derived queries store rows under
    // public.users.id, NOT auth.uid(). Pass profile.id so they return data for
    // accounts where auth.uid() ≠ public.users.id.
    fetchUpcomingEvents(supabase, profile.id),
    fetchCourseProgress(supabase, profile.id),
    fetchScoreboardCounts(profile.id),
    getGreetingQuotes(),
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
  ])

  const quarterlyGoals = (quarterlyGoalsResult.data ?? []) as GoalForCard[]

  const quote = quotes?.length ? quotes[dayOfYear % quotes.length] : null
  const earnedBadges = badgeData.data?.map(b => b.pillar_number) ?? []
  const awardedAtByPillar = new Map(
    (badgeData.data ?? []).map(b => [b.pillar_number, b.awarded_at]),
  )

  const displayName = (profile.full_name ? profile.full_name.split(' ')[0] : null) ?? profile.display_name ?? 'Member'
  const upcomingEventCount = events.filter(e => !e.isRegistered).length

  // SPRINT A — single Home context strip (event + episode) from data already
  // fetched above; no new queries.
  const nextEvent = events[0] ?? null
  const latestEp = latestEpisodesResult.episodes[0] ?? null
  const homeContextEvent = nextEvent
    ? {
        title: nextEvent.title,
        dateLabel: new Date(nextEvent.starts_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        href: `/events/${nextEvent.id}`,
      }
    : null
  const homeContextEpisode = latestEp
    ? { title: latestEp.title, href: `/podcast/${latestEp.slug}` }
    : null
  const homeContextSignature = `${nextEvent?.id ?? 'none'}:${latestEp?.id ?? 'none'}`

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
  // Academy CTA state: a member mid-course continues; a member who has
  // finished at least one pillar (and has nothing in progress) reviews rather
  // than "starting" — only a member with no progress at all sees Start.
  const anyPillarEarned = pillars.some(p => p.state === 'earned')
  const courseHref = inProgressData
    ? (inProgressData.nextLessonSlug
        ? `/academy/${inProgressData.courseSlug}/${inProgressData.nextLessonSlug}`
        : `/academy/${inProgressData.courseSlug}`)
    : anyPillarEarned
      ? '/academy'
      : '/academy/foundation'
  const courseLabel = inProgressData
    ? `Continue ${inProgressData.name}`
    : anyPillarEarned
      ? 'Review Academy'
      : 'Start Foundation'
  // SPRINT M: one engagement nudge only. The Learn / Accountability / Daily
  // Pulse cards each restated a metric already shown in the Accountability Hub
  // (habits, commitments, course progress), so they were dropped.
  const todaysActions: TodaysEvolutionAction[] = [
    {
      id: 'community',
      eyebrow: 'Community',
      title: 'Show up in the feed',
      description: 'Post a win, ask a hard question, or vote on today’s poll.',
      href: '/community',
      cta: 'Open feed',
      accent: '#A78BFA',
      primary: true,
    },
  ]

  return (
    <div className="ep-page-gutter ep-surface-mobile pb-6 space-y-4 sm:space-y-5">
      <HomeContextStrip
        event={homeContextEvent}
        episode={homeContextEpisode}
        signature={homeContextSignature}
      />
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
        academyHref={inProgressContinueHref ?? courseHref}
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
        courseLabel={courseLabel}
        // Single source of truth on Home: the standalone CommitmentTracker owns
        // weekly commitments and the GoalCard grid owns goals. The hub keeps the
        // rings, KPI summary, and today's checkable habits only.
        showCommitmentsList={false}
        showGoalsList={false}
      />

      {sponsors.home[0] ? <HomeSponsorAd ad={sponsors.home[0]} /> : null}

      {/* BELOW THE FOLD — commitments + goals only. SPRINT M removed the
          duplicate KPI/scoreboard strip and the pillar-overview: the daily
          metrics (pulse %, streak, habits/commits/goals) live only in the hub
          above, and the six-pillar list only in "The Architecture" hero. */}

      {/* Weekly commitments + editor */}
      <CommitmentTracker weekStart={getCurrentMonday()} />

      {/* The Long Game — quarterly goals (the single goals module) */}
      <section aria-label="Quarterly goals" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            The Long Game
          </p>
          <a
            href="/leaderboard"
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

      {sponsors.home[1] ? <HomeSponsorAd ad={sponsors.home[1]} /> : null}

      {/* ——— The rest: one-click nudge, community & media ——— */}

      {/* Today's Evolution — a single engagement nudge (SPRINT M: the metric
          cards were dropped; habit/commit/goal progress lives in the hub). */}
      <TodaysEvolution actions={todaysActions} />

      {/* HOME tiles — Community Pulse / Top Stories / Latest Drops. The Daily
          Pulse tile was removed: AccountabilityHub up top is the single daily
          driver (rings + habit toggles), so the tile was a duplicate habit +
          commitment mark-complete surface. (.home-4up-grid class kept as the
          shared CSS hook; now a 3-up row.) */}
      <div
        className="home-4up-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        style={{ width: '100%', maxWidth: 1440, margin: '0 auto' }}
      >
        <CommunityPulseTile posts={pulsePosts} pinnedEvent={pinnedLiveEvent} />
        <TopStoriesTile stories={topStories} />
        <PodcastReelTile episodes={latestEpisodesResult.episodes} latestEpisodeNumber={latestEpisodesResult.latestNumber} />
      </div>

      <ProfileCompletePrompt
        hasAvatar={Boolean(profile.avatar_url)}
        hasBio={Boolean(profile.bio)}
        hasTitle={Boolean(profile.role_title)}
        hasName={Boolean(profile.display_name || profile.full_name)}
      />

      {/* SPRINT J — Section divider: "The Path Forward". */}
      <div className="ep-section-eyebrow pt-3">
        <span className="ep-section-eyebrow__rule" aria-hidden />
        <span className="ep-section-eyebrow__label">The Path Forward</span>
        <span className="ep-section-eyebrow__grow" aria-hidden />
      </div>

      {/* Path Forward — the "continue learning" actions. SPRINT M: the
          PillarJourneyStrip ("N of 6 pillars earned") was removed — the six
          pillars already render once in "The Architecture" hero. */}
      <div className="space-y-4">
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
      </div>

      {sponsors.end ? <HomeSponsorAd ad={sponsors.end} /> : null}

    </div>
  )
}
