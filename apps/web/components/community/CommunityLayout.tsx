'use client'

import { ChannelSidebar } from './ChannelSidebar'
import { CommunityFeed } from './CommunityFeed'
import { LeaderboardRail } from './LeaderboardRail'
import type { Channel, Post, LeaderboardEntry, MemberSummary } from '@/lib/community/types'

interface CommunityLayoutProps {
  channels: Channel[]
  currentChannelSlug: string
  currentChannelId: string
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
  pinnedPost: { label: string; body: string } | null
  leaderboard: LeaderboardEntry[]
  activeMembers: MemberSummary[]
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  }
  unreadCounts: Record<string, number>
}

export function CommunityLayout({
  channels,
  currentChannelSlug,
  currentChannelId,
  posts,
  nextCursor,
  hasMore,
  pinnedPost,
  leaderboard,
  activeMembers,
  currentUser,
  unreadCounts,
}: CommunityLayoutProps) {
  return (
    <div
      className="flex flex-1 min-h-0"
      style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', height: '100%' }}
    >
      <ChannelSidebar
        channels={channels}
        currentSlug={currentChannelSlug}
        unreadCounts={unreadCounts}
      />

      <div className="overflow-hidden bg-[#faf9f7]">
        <CommunityFeed
          channelId={currentChannelId}
          channelSlug={currentChannelSlug}
          initialPosts={posts}
          initialNextCursor={nextCursor}
          initialHasMore={hasMore}
          pinnedPost={pinnedPost}
          currentUser={currentUser}
        />
      </div>

      <LeaderboardRail
        leaderboard={leaderboard}
        activeMembers={activeMembers}
        currentUserId={currentUser.id}
      />
    </div>
  )
}
