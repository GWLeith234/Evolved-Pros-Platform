import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'

export const metadata: Metadata = { title: 'Home — Evolved Pros' }
import { WelcomeBanner } from '@/components/home/WelcomeBanner'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { UpcomingEventsWidget } from '@/components/home/UpcomingEventsWidget'
import { AcademyProgressWidget } from '@/components/home/AcademyProgressWidget'
import { ProfileCompletePrompt } from '@/components/home/ProfileCompletePrompt'
import { QuarterlyGoals, type QuarterlyGoal } from '@/components/home/QuarterlyGoals'
import { CommunityPulseTile, type PulsePost, type PulseEvent } from '@/components/home/tiles/CommunityPulseTile'
import { TopStoriesTile, type PulseStory } from '@/components/home/tiles/TopStoriesTile'
import { PodcastReelTile, type PulseEpisode } from '@/components/home/tiles/PodcastReelTile'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { hasTierAccess } from '@/lib/tier'

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
      .select('lesson_id, completed_at, lessons(id, title, sort_order, course_id, courses(title, slug))')
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
  const [courses, lessons, progress] = await Promise.all([
    supabase.from('courses').select('id, title, slug, sort_order, pillar_number').eq('is_published', true).order('sort_order'),
    supabase.from('lessons').select('id, course_id').eq('is_published', true),
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

  const lessonsByCourse: Record<string, string[]> = {}
  for (const l of lessons.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l.id)
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
    const completed = courseLesson.filter(id => progressByLesson[id]?.completed_at).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const completedAts = courseLesson
      .map(id => progressByLesson[id]?.completed_at)
      .filter((v): v is string => Boolean(v))
      .sort()
    const lastActivity = courseLesson
      .map(id => progressByLesson[id]?.updated_at)
      .filter(Boolean)
      .sort()
      .pop() ?? null
    const lastCompletedAt = completedAts.length > 0 ? completedAts[completedAts.length - 1] : null
    return { ...c, total, completed, pct, lastActivity, lastCompletedAt }
  })
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

function relativeAge(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604_800) return `${Math.floor(diff / 86400)}d`
  return `${Math.floor(diff / 604_800)}w`
}

function dayLabelFor(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.floor((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tmrw'
  if (diffDays >= 2 && diffDays <= 6) return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  if (!body) return '2 min'
  const words = body.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min`
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
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
    .select('id, body, pillar, pillar_tag, like_count, reply_count, created_at, users!posts_author_id_fkey(display_name, full_name, tier)')
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
    }> | null }

  return (rows ?? []).map(r => {
    const name = r.users?.full_name ?? r.users?.display_name ?? 'Member'
    const pillarColor = r.pillar
      ? pillarColorFromTag(String(r.pillar))
      : pillarColorFromTag(r.pillar_tag)
    return {
      id: r.id,
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
    durationLabel: formatDuration(r.duration_seconds),
    isNew: r.published_at ? new Date(r.published_at).getTime() > sevenDaysAgo : false,
    accent: TILE_PILLAR_ROTATION[i % TILE_PILLAR_ROTATION.length],
  }))
  const latestNumber = eps[0]?.episodeNumber ?? null
  return { episodes: eps, latestNumber }
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

  const [
    stats,
    activity,
    events,
    courseProgress,
    unreadCount,
    quotesResult,
    badgeData,
    // HOME-4UP-TILES fetchers
    pulsePosts,
    pinnedLiveEvent,
    topStories,
    latestEpisodesResult,
    quarterlyGoalsResult,
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
    fetchUnreadCount(supabase, profile.id),
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
  ])

  const quarterlyGoals = (quarterlyGoalsResult.data ?? []) as QuarterlyGoal[]

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

  return (
    <div className="p-6 space-y-5">
      <WelcomeBanner
        displayName={displayName}
        tier={profile.tier}
        avatarUrl={profile.avatar_url}
        quote={quote}
        scoreboard={{
          unreadPostCount: unreadCount,
          upcomingEventCount,
          podcastCount: 0,
          storyCount: 0,
        }}
        pillars={pillars}
      />

      {/* HOME tiles — Community Pulse / Top Stories / Latest Drops.
          (Was a 4-up grid that left the 4th column empty because the
          planned Daily Pulse tile never landed.) */}
      <div
        className="home-4up-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
        }}
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

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-5 items-start">
        <ActivityFeed
          notifications={activity.notifications}
          completions={activity.completions}
          posts={activity.posts}
        />
        <div className="space-y-5 lg:self-start">
          <UpcomingEventsWidget events={events} userId={profile.id} />
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-5 items-start">
            <AcademyProgressWidget courses={activeCourses} />
            <QuarterlyGoals goals={quarterlyGoals} editHref="#" />
          </div>
          {/* CommitmentTracker widget — weekly commitments from the Academy.
              weekStart is a hint; the component derives the user's local
              Monday on mount (server is UTC and would otherwise hand a
              stale week to TZ-behind users on Sunday evening). */}
          <CommitmentTracker weekStart={getCurrentMonday()} />
        </div>
      </div>
    </div>
  )
}
