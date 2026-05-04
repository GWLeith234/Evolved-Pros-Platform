import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { UnifiedCommunityPage } from '@/components/community/UnifiedCommunityPage'

export const metadata: Metadata = { title: 'Community — Evolved Pros' }
import {
  fetchChannels,
  fetchAllPosts,
  fetchPinnedAnnouncement,
  fetchLeaderboard,
  fetchActiveMembers,
  fetchCommunityAds,
  fetchLatestPodcastEpisode,
} from '@/lib/community/fetchers'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export default async function CommunityPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const [channels, postsResult, pinnedPost, leaderboard, activeMembers, ads, episode, coursesRes, eventRes] = await Promise.all([
    fetchChannels(supabase),
    fetchAllPosts(supabase, { userId: profile.id }),
    fetchPinnedAnnouncement(supabase),
    fetchLeaderboard(supabase, profile.id),
    fetchActiveMembers(supabase),
    fetchCommunityAds(),
    fetchLatestPodcastEpisode(),
    // Academy progress: courses with lesson counts
    supabase
      .from('courses')
      .select('id, pillar_number, title')
      .order('pillar_number'),
    // Next upcoming event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('events')
      .select('title, starts_at')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(1)
      .maybeSingle(),
  ])

  const generalChannel = channels.find(c => c.slug === 'general')
  if (!generalChannel) redirect('/home')

  const isAdmin = profile?.role === 'admin'
  const userPoints = profile?.points ?? 0

  // Compute pillarProgress from courses + lesson_progress
  let pillarProgress: { pillar: string; label: string; pct: number } | null = null
  const courses = (coursesRes.data ?? []) as { id: string; pillar_number: number; title: string }[]
  if (courses.length > 0 && profile) {
    // current_pillar stores 'p1'..'p6' (or null). Normalize to a 1-6 int
    // for matching against courses.pillar_number / PILLAR_CONFIG keys.
    const rawPillar = profile.current_pillar
    const parsedPillar = typeof rawPillar === 'string' ? parseInt(rawPillar.replace(/^p/, ''), 10) : NaN
    const currentPillar: number = Number.isFinite(parsedPillar) && parsedPillar >= 1 && parsedPillar <= 6 ? parsedPillar : 1
    const pillarCourses = courses.filter(c => c.pillar_number === currentPillar)
    if (pillarCourses.length > 0) {
      const courseIds = pillarCourses.map(c => c.id)
      const [lessonsRes, progressRes] = await Promise.all([
        supabase.from('lessons').select('id, course_id').in('course_id', courseIds),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id).eq('completed', true),
      ])
      const totalLessons = (lessonsRes.data ?? []).length
      const completedIds = new Set((progressRes.data ?? []).map(p => p.lesson_id))
      const pillarLessonIds = new Set((lessonsRes.data ?? []).map(l => l.id))
      const completedInPillar = [...completedIds].filter(id => pillarLessonIds.has(id)).length
      const pct = totalLessons > 0 ? Math.round((completedInPillar / totalLessons) * 100) : 0
      const pillarConfig = PILLAR_CONFIG[currentPillar]
      pillarProgress = {
        pillar: `p${currentPillar}`,
        label: pillarConfig?.label ?? `Pillar ${currentPillar}`,
        pct,
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventData = (eventRes.data as any) ?? null
  const nextEvent = eventData ? {
    title: eventData.title,
    startsAt: eventData.starts_at,
  } : null

  // Derive userRank and nextRankEntry from leaderboard
  const meEntry = leaderboard.find(e => e.isCurrentUser)
  const userRank = meEntry?.rank ?? null
  const myPoints = meEntry?.points ?? userPoints
  // Find the person just ahead (smallest points > myPoints among leaderboard)
  const ahead = leaderboard
    .filter(e => !e.isCurrentUser && e.points > myPoints)
    .sort((a, b) => a.points - b.points)[0] ?? null
  const nextRankEntry = ahead ? { displayName: ahead.displayName, points: ahead.points } : null

  const episodeSummary = episode ? {
    title: episode.title,
    guestName: episode.guest_name ?? null,
    durationSeconds: episode.duration_seconds ?? null,
  } : null

  return (
    <UnifiedCommunityPage
      posts={postsResult.posts}
      nextCursor={postsResult.nextCursor}
      hasMore={postsResult.hasMore}
      pinnedPost={pinnedPost}
      ads={ads}
      currentUser={{
        id: profile.id,
        displayName: profile?.display_name ?? profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        tier: profile?.tier ?? null,
        isAdmin,
      }}
      defaultChannelId={generalChannel.id}
      dashboardProps={{
        pillarProgress,
        episode: episodeSummary,
        nextEvent,
        userRank,
        nextRankEntry,
        userPoints: myPoints,
      }}
    />
  )
}
