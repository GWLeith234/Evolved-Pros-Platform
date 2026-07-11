import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { UnifiedCommunityPageClient } from './UnifiedCommunityPageClient'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'
import { DEFAULT_HOME_SPONSORS } from '@/lib/sponsors/partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import type { RailAcademyContinue, RailPodcastEpisode } from '@/components/community/CommunityRightRail'

export const metadata: Metadata = { title: 'Community — Evolved Pros' }
import {
  fetchChannels,
  fetchAllPosts,
  fetchPinnedAnnouncement,
  fetchCommunityAds,
  fetchWeeklyLeaderboard,
} from '@/lib/community/fetchers'

async function fetchLatestPodcastEpisode(): Promise<RailPodcastEpisode | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('episodes')
      .select('id, title, slug, guest_name, episode_number')
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    if (!data) return null
    return {
      id: data.id,
      title: data.title,
      slug: data.slug ?? null,
      guest_name: data.guest_name ?? null,
      episode_number: data.episode_number ?? null,
    }
  } catch {
    return null
  }
}

async function fetchAcademyContinue(userId: string): Promise<RailAcademyContinue> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = adminClient as any
    const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
      sb.from('courses').select('id, title, slug, sort_order').eq('is_published', true).order('sort_order'),
      sb.from('lessons').select('id, course_id, slug').eq('is_published', true),
      sb
        .from('lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),
    ])
    const completed = new Set(
      ((progress ?? []) as { lesson_id: string }[]).map(p => p.lesson_id),
    )
    const lessonsByCourse: Record<string, { id: string; slug: string | null }[]> = {}
    for (const l of (lessons ?? []) as { id: string; course_id: string; slug: string | null }[]) {
      if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
      lessonsByCourse[l.course_id].push(l)
    }

    let best: RailAcademyContinue = null
    for (const c of (courses ?? []) as { id: string; title: string; slug: string }[]) {
      const list = lessonsByCourse[c.id] ?? []
      if (list.length === 0) continue
      const done = list.filter(l => completed.has(l.id)).length
      if (done === 0) continue
      const pct = Math.round((done / list.length) * 100)
      if (pct >= 100) continue
      const next = list.find(l => !completed.has(l.id))
      const href = next?.slug
        ? `/academy/${c.slug}/${next.slug}`
        : `/academy/${c.slug}`
      // Prefer the most progressed incomplete course
      if (!best || pct > (best.progressPct ?? 0)) {
        best = {
          courseTitle: c.title,
          courseSlug: c.slug,
          progressPct: pct,
          href,
        }
      }
    }
    return best
  } catch {
    return null
  }
}

function railSponsorsFromAds(
  communityAds: { id: string; image_url: string | null; headline: string | null; tool_name: string | null; cta_text: string | null; link_url: string | null; click_url: string | null; sponsor_name: string | null; body_copy?: string | null }[],
): SponsorAd[] {
  const fromDb: SponsorAd[] = communityAds.slice(0, 4).map(a => ({
    id: a.id,
    image_url: a.image_url,
    click_url: a.click_url,
    link_url: a.link_url,
    headline: a.headline,
    tool_name: a.tool_name,
    sponsor_name: a.sponsor_name,
    cta_text: a.cta_text,
    endorsement_quote: a.body_copy ?? null,
  }))
  // Prefer flagship Evolution Partners when community ads are sparse
  if (fromDb.length === 0) return DEFAULT_HOME_SPONSORS
  return [...fromDb, ...DEFAULT_HOME_SPONSORS.filter(s => !fromDb.some(d => d.id === s.id))].slice(0, 4)
}

export default async function CommunityPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const [channels, postsResult, pinnedPost, weeklyLeaderboard, ads, latestEpisode, academyContinue] =
    await Promise.all([
      fetchChannels(supabase),
      fetchAllPosts(supabase, { userId: profile.id }),
      fetchPinnedAnnouncement(supabase),
      fetchWeeklyLeaderboard(supabase, profile.id),
      fetchCommunityAds(),
      fetchLatestPodcastEpisode(),
      fetchAcademyContinue(profile.id),
    ])

  const generalChannel = channels.find(c => c.slug === 'general')
  if (!generalChannel) redirect('/home')

  const isAdmin = profile?.role === 'admin'
  const railSponsors = railSponsorsFromAds(ads)

  return (
    <>
      <EpisodeBanner />
      <UnifiedCommunityPageClient
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
        weeklyLeaderboard={weeklyLeaderboard}
        latestEpisode={latestEpisode}
        academyContinue={academyContinue}
        railSponsors={railSponsors}
      />
    </>
  )
}
