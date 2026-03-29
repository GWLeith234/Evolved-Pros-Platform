'use client'

import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  function handleMobileChannelClick(slug: string) {
    if (slug === 'general') {
      router.push('/community')
    } else {
      router.push(`/community/${slug}`)
    }
  }

  return (
    <div className="flex flex-1 min-h-0" style={{ height: '100%' }}>
      {/* Channel sidebar — hidden below lg to give feed adequate width */}
      <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: '200px' }}>
        <ChannelSidebar
          channels={channels}
          currentSlug={currentChannelSlug}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Main feed column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#faf9f7]">
        {/* Mobile channel pills — hidden on desktop */}
        <div
          className="md:hidden overflow-x-auto flex gap-2 px-4 py-2 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#112535' }}
        >
          {channels.map(ch => {
            const active = ch.slug === currentChannelSlug
            return (
              <button
                key={ch.slug}
                onClick={() => handleMobileChannelClick(ch.slug)}
                className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide"
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  backgroundColor: active ? 'rgba(104,162,185,0.2)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${active ? 'rgba(104,162,185,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {ch.name}
              </button>
            )
          })}
        </div>

        {/* Feed (includes FeedCompose at the top on both mobile and desktop) */}
        <div className="flex-1 overflow-y-auto">
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
      </div>

      {/* Right rail — hidden below lg to give feed adequate width */}
      <div className="hidden lg:flex flex-col flex-shrink-0 overflow-y-auto" style={{ width: '260px' }}>
        <LeaderboardRail
          leaderboard={leaderboard}
          activeMembers={activeMembers}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  )
}
