import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityLayout } from '@/components/community/CommunityLayout'
import {
  fetchChannels,
  fetchPosts,
  fetchPinnedPost,
  fetchLeaderboard,
  fetchActiveMembers,
  fetchCurrentUserProfile,
} from '@/lib/community/fetchers'

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, channels, postsResult, pinnedPost, leaderboard, activeMembers] = await Promise.all([
    fetchCurrentUserProfile(supabase, user.id),
    fetchChannels(supabase),
    fetchPosts(supabase, { channelSlug: 'general', userId: user.id }),
    fetchPinnedPost(supabase, 'general'),
    fetchLeaderboard(supabase, user.id),
    fetchActiveMembers(supabase),
  ])

  const generalChannel = channels.find(c => c.slug === 'general')
  if (!generalChannel) redirect('/home')

  return (
    <CommunityLayout
      channels={channels}
      currentChannelSlug="general"
      currentChannelId={generalChannel.id}
      posts={postsResult.posts}
      nextCursor={postsResult.nextCursor}
      hasMore={postsResult.hasMore}
      pinnedPost={pinnedPost}
      leaderboard={leaderboard}
      activeMembers={activeMembers}
      currentUser={{
        id: user.id,
        displayName: profile?.display_name ?? profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
      unreadCounts={{}}
    />
  )
}
