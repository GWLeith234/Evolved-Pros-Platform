'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCardV2 } from './PostCardV2'
import { PostReplyThread } from './PostReplyThread'
import { DashboardStrip } from './DashboardStrip'
import { FeedAdUnit } from './FeedAdUnit'
import { CommunityPageHeader } from './CommunityPageHeader'
import { Composer } from './Composer'
import { FilterRail } from './FilterRail'
import type { KindFilter, Pillar, SortBy } from './FilterRail'
import type { Post, Reply, CommunityAd, WeeklyLeaderboardEntry } from '@/lib/community/types'
import type { DashboardStripProps } from './DashboardStrip'
import { WeeklyLeaderboardRail } from './WeeklyLeaderboardRail'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const PAGE_SIZE = 20

interface UnifiedCommunityPageProps {
  posts: Post[]
  nextCursor: string | null
  hasMore: boolean
  pinnedPost: { label: string; body: string } | null
  ads: CommunityAd[]
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    tier?: string | null
    isAdmin: boolean
  }
  defaultChannelId: string
  // Dashboard strip data
  dashboardProps: Omit<DashboardStripProps, never>
  weeklyLeaderboard: WeeklyLeaderboardEntry[]
}

export function UnifiedCommunityPage({
  posts: initialPosts,
  nextCursor: initialCursor,
  hasMore: initialHasMore,
  pinnedPost,
  ads,
  currentUser,
  defaultChannelId,
  dashboardProps,
  weeklyLeaderboard,
}: UnifiedCommunityPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [queuedCount, setQueuedCount] = useState(0)
  const [queued, setQueued] = useState<Post[]>([])

  // COMMUNITY-SPRINT-2: filter rail state
  const [activeKind, setActiveKind] = useState<KindFilter>('all')
  const [activePillars, setActivePillars] = useState<Pillar[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Inline reply thread — the comment icon on PostCardV2 calls
  // onCommentClick(postId) which toggles expandedPostId; PostReplyThread
  // renders directly below the matching card. Replies are lazy-loaded on
  // first expand and cached so re-opening is instant.
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [repliesByPost, setRepliesByPost] = useState<Record<string, Reply[]>>({})
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<string | null>(null)

  const handleCommentClick = useCallback((postId: string) => {
    setExpandedPostId(prev => (prev === postId ? null : postId))
  }, [])

  // Fetch replies whenever a post is expanded for the first time. Posts that
  // already have replies in the cache (or never had any per replyCount=0)
  // skip the fetch.
  useEffect(() => {
    if (!expandedPostId) return
    if (repliesByPost[expandedPostId] !== undefined) return
    const post = posts.find(p => p.id === expandedPostId)
    if (!post) return
    if (post.replyCount === 0) {
      setRepliesByPost(prev => ({ ...prev, [expandedPostId]: [] }))
      return
    }
    let cancelled = false
    setLoadingRepliesFor(expandedPostId)
    void fetch(`/api/posts/${expandedPostId}/replies`)
      .then(res => (res.ok ? res.json() as Promise<{ replies: Reply[] }> : { replies: [] as Reply[] }))
      .then(data => {
        if (cancelled) return
        setRepliesByPost(prev => ({ ...prev, [expandedPostId]: data.replies ?? [] }))
      })
      .catch(() => {
        if (cancelled) return
        setRepliesByPost(prev => ({ ...prev, [expandedPostId]: [] }))
      })
      .finally(() => {
        if (!cancelled) setLoadingRepliesFor(prev => (prev === expandedPostId ? null : prev))
      })
    return () => { cancelled = true }
  }, [expandedPostId, posts, repliesByPost])

  // Submit handler for the inline composer inside PostReplyThread. Posts the
  // reply, appends it to the local cache, and bumps the post's replyCount so
  // the icon's number reflects the new state without a refetch.
  const handleReplySubmit = useCallback(async (postId: string, body: string) => {
    const res = await fetch(`/api/posts/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(data.error ?? 'Failed to reply')
    }
    const reply = await res.json() as Reply
    setRepliesByPost(prev => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), reply],
    }))
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, replyCount: (p.replyCount ?? 0) + 1 } : p))
  }, [])

  // Realtime subscription — no channel filter (unified)
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel('community-unified-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any
          if (row.author_id === currentUser.id) return
          const newPost: Post = {
            id: row.id,
            channelId: row.channel_id,
            body: row.body,
            pillarTag: row.pillar_tag,
            postType: row.post_type ?? 'update',
            isPinned: row.is_pinned,
            likeCount: row.like_count ?? 0,
            replyCount: row.reply_count ?? 0,
            createdAt: row.created_at,
            author: { id: row.author_id, displayName: 'Member', avatarUrl: null },
            isLiked: false,
            myReaction: null,
            reactions: [],
            isBookmarked: false,
          }
          setQueuedCount(c => c + 1)
          setQueued(prev => [newPost, ...prev])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [currentUser.id])

  // LOAD MORE button — explicit, not infinite scroll (anchors the page,
  // easier on weak connections per Sprint 2 brief).
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/posts?cursor=${encodeURIComponent(cursor)}&limit=20`)
      if (!res.ok) return
      const data = await res.json() as { posts: Post[]; nextCursor: string | null; hasMore: boolean }
      setPosts(prev => {
        const ids = new Set(prev.map(p => p.id))
        return [...prev, ...data.posts.filter(p => !ids.has(p.id))]
      })
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
      setVisibleCount(c => c + PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, hasMore, loadingMore])

  function handlePostCreated(post: Post) {
    setPosts(prev => [post, ...prev])
  }

  // New Composer (Sprint 1) doesn't return the created post object —
  // re-fetch the latest row and prepend so the user sees their own post.
  const handleNewComposerPost = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?limit=1')
      if (!res.ok) return
      const data = await res.json() as { posts: Post[] }
      if (data.posts[0]) handlePostCreated(data.posts[0])
    } catch { /* swallow — realtime will catch up eventually */ }
  }, [])

  function flushQueued() {
    setPosts(prev => {
      const ids = new Set(prev.map(p => p.id))
      return [...queued.filter(p => !ids.has(p.id)), ...prev]
    })
    setQueued([])
    setQueuedCount(0)
  }

  // Reset visible count whenever filters change so the user sees the top of
  // the freshly filtered list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeKind, activePillars, sortBy])

  // COMMUNITY-SPRINT-2 client-side filter + sort. Filter logic stays
  // client-side per brief — DO NOT migrate to server in this sprint.
  const filtered = useMemo(() => {
    let list = posts.filter(post => {
      if (activeKind !== 'all') {
        // Match either legacy post_type or new kind values.
        if (post.postType !== activeKind) return false
      }
      if (activePillars.length > 0) {
        const pillarNum = post.pillarTag ? parseInt(post.pillarTag.slice(1), 10) : null
        if (pillarNum === null || !activePillars.includes(pillarNum as Pillar)) return false
      }
      return true
    })

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortBy === 'most_reacted') {
      const total = (p: Post) => (p.reactions ?? []).reduce((s, r) => s + r.count, 0)
      list = [...list].sort((a, b) => total(b) - total(a))
    }

    return list
  }, [posts, activeKind, activePillars, sortBy])

  const visible = filtered.slice(0, visibleCount)
  // Hide LOAD MORE entirely on an empty filter — fetching more posts that
  // would also fail the filter is pure noise. Re-enable once at least one
  // post matches.
  const hasMoreVisible = filtered.length > 0 && (filtered.length > visibleCount || hasMore)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden" style={{ height: '100%', background: 'var(--community-page-bg)' }}>
      {/* Dashboard strip */}
      <DashboardStrip {...dashboardProps} />

      {/* Editorial header (COMMUNITY-SPRINT-1) */}
      <CommunityPageHeader />

      {/* Filter rail (COMMUNITY-SPRINT-2) */}
      <FilterRail
        activeKind={activeKind}
        activePillars={activePillars}
        sortBy={sortBy}
        onChangeKind={setActiveKind}
        onChangePillars={setActivePillars}
        onChangeSort={setSortBy}
      />

      {/* Feed (left) + weekly leaderboard rail (right) */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--community-page-bg)' }}>
        <div
          className="w-full mx-auto px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(280px,35fr)] gap-6"
          style={{ maxWidth: 1280 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* Pinned announcement */}
          {pinnedPost && (
            <div
              className="rounded-lg"
              style={{
                backgroundColor: '#112535',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px 20px',
              }}
            >
              <p
                className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px] sm:text-[12px] mb-2"
                style={{ color: '#C9A84C' }}
              >
                📌 {pinnedPost.label}
              </p>
              <p
                className="font-body text-[13px] leading-[1.55]"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                dangerouslySetInnerHTML={{ __html: pinnedPost.body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
              />
            </div>
          )}

          {/* Compose (COMMUNITY-SPRINT-1) */}
          <Composer
            channelId={defaultChannelId}
            currentUser={{
              displayName: currentUser.displayName ?? '',
              initials: getInitials(currentUser.displayName),
              avatarUrl: currentUser.avatarUrl,
              tier: currentUser.tier ?? null,
            }}
            onPostCreated={handleNewComposerPost}
          />

          {/* New posts banner */}
          {queuedCount > 0 && (
            <button
              onClick={flushQueued}
              className="w-full py-2.5 rounded font-condensed font-semibold uppercase tracking-wide text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#68a2b9' }}
            >
              ↑ {queuedCount} new {queuedCount === 1 ? 'post' : 'posts'} — click to load
            </button>
          )}

          {/* Posts + in-feed ads (COMMUNITY-SPRINT-2: PostCardV2 + visibleCount pagination) */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-condensed text-xs tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                {activeKind === 'all' && activePillars.length === 0
                  ? 'No posts yet — be the first to share.'
                  : 'No posts match the current filters.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {visible.map((post, index) => (
                <React.Fragment key={post.id}>
                  <PostCardV2
                    post={post}
                    currentUserId={currentUser.id}
                    onCommentClick={handleCommentClick}
                  />
                  {/* Inline reply thread — renders directly under the card
                      when its comment icon is clicked. Lives outside
                      PostCardV2 so the card stays presentational. */}
                  {expandedPostId === post.id && (
                    <div
                      style={{
                        background: 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border-color)',
                        padding: '0 24px 20px',
                      }}
                    >
                      {loadingRepliesFor === post.id && repliesByPost[post.id] === undefined ? (
                        <p
                          className="font-condensed text-xs uppercase tracking-widest pl-4 pt-3"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Loading…
                        </p>
                      ) : (
                        <PostReplyThread
                          postId={post.id}
                          replies={repliesByPost[post.id] ?? []}
                          totalReplies={post.replyCount ?? 0}
                          currentUser={{
                            id: currentUser.id,
                            displayName: currentUser.displayName,
                            avatarUrl: currentUser.avatarUrl,
                          }}
                          onReplySubmit={body => handleReplySubmit(post.id, body)}
                        />
                      )}
                    </div>
                  )}
                  {/* Inject ad after every 3rd post */}
                  {(index + 1) % 3 === 0 && ads.length > 0 && (
                    <FeedAdUnit ad={ads[Math.floor(index / 3) % ads.length]} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* LOAD MORE button — explicit, anchors the page (COMMUNITY-SPRINT-2) */}
          {hasMoreVisible && (
            <div className="flex justify-center py-6">
              <button
                type="button"
                onClick={() => {
                  // First reveal more from already-fetched posts; only hit
                  // the network once the local cache is exhausted.
                  if (visibleCount < filtered.length) {
                    setVisibleCount(c => c + PAGE_SIZE)
                  } else {
                    void loadMore()
                  }
                }}
                disabled={loadingMore}
                style={{
                  padding: '10px 28px',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 13,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: loadingMore ? 'wait' : 'pointer',
                  borderRadius: 0,
                }}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center font-condensed text-[12px] sm:text-[12px] tracking-widest py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              You&apos;ve reached the beginning
            </p>
          )}
          </div>

          {/* Right rail — weekly leaderboard */}
          <div style={{ minWidth: 0 }}>
            <div style={{ position: 'sticky', top: 0 }}>
              <WeeklyLeaderboardRail entries={weeklyLeaderboard} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
