import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UnifiedCommunityPage } from '@/components/community/UnifiedCommunityPage'
import {
  fetchChannels,
  fetchAllPosts,
  fetchPinnedAnnouncement,
  fetchLeaderboard,
  fetchActiveMembers,
  fetchCurrentUserProfile,
  fetchCommunityAds,
  fetchLatestPodcastEpisode,
} from '@/lib/community/fetchers'

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, channels, postsResult, pinnedPost, leaderboard, activeMembers, ads, episode] = await Promise.all([
    fetchCurrentUserProfile(supabase, user.id),
    fetchChannels(supabase),
    fetchAllPosts(supabase, { userId: user.id }),
    fetchPinnedAnnouncement(supabase),
    fetchLeaderboard(supabase, user.id),
    fetchActiveMembers(supabase),
    fetchCommunityAds(),
    fetchLatestPodcastEpisode(),
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
      leaderboard={leaderboard}
      activeMembers={activeMembers}
      ads={ads}
      episode={episode}
      currentUser={{
        id: user.id,
        displayName: profile?.display_name ?? profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        tier: profile?.tier ?? null,
        isAdmin,
      }}
      defaultChannelId={generalChannel.id}
    />
  )
}
