import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CommunityLayout } from '@/components/community/CommunityLayout'
import {
  fetchChannels,
  fetchPosts,
  fetchPinnedPost,
  fetchLeaderboard,
  fetchActiveMembers,
  fetchCurrentUserProfile,
} from '@/lib/community/fetchers'

export default async function ChannelPage({
  params,
}: {
  params: { channelSlug: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, channels, postsResult, pinnedPost, leaderboard, activeMembers] = await Promise.all([
    fetchCurrentUserProfile(supabase, user.id),
    fetchChannels(supabase),
    fetchPosts(supabase, { channelSlug: params.channelSlug, userId: user.id }),
    fetchPinnedPost(supabase, params.channelSlug),
    fetchLeaderboard(supabase, user.id),
    fetchActiveMembers(supabase),
  ])

  const channel = channels.find(c => c.slug === params.channelSlug)
  if (!channel) notFound()

  return (
    <CommunityLayout
      channels={channels}
      currentChannelSlug={params.channelSlug}
      currentChannelId={channel.id}
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
