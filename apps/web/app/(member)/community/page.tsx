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
  fetchCommunityAds,
  fetchWeeklyLeaderboard,
} from '@/lib/community/fetchers'

export default async function CommunityPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const [channels, postsResult, pinnedPost, weeklyLeaderboard, ads] = await Promise.all([
    fetchChannels(supabase),
    fetchAllPosts(supabase, { userId: profile.id }),
    fetchPinnedAnnouncement(supabase),
    fetchWeeklyLeaderboard(supabase, profile.id),
    fetchCommunityAds(),
  ])

  const generalChannel = channels.find(c => c.slug === 'general')
  if (!generalChannel) redirect('/home')

  const isAdmin = profile?.role === 'admin'

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
      weeklyLeaderboard={weeklyLeaderboard}
    />
  )
}
