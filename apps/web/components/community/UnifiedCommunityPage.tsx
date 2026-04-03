'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeedCompose } from './FeedCompose'
import { PostCard } from './PostCard'
import { DashboardStrip } from './DashboardStrip'
import { FeedAdUnit } from './FeedAdUnit'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import type { Post, CommunityAd } from '@/lib/community/types'
import type { DashboardStripProps } from './DashboardStrip'

type Filter = 'all' | 'win' | 'question' | PillarFilter
type PillarFilter = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

const PILLAR_FILTERS = Object.entries(PILLAR_CONFIG).map(([num, config]) => ({
  id: `p${num}` as PillarFilter,
  label: config.label,
  color: config.color,
}))

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
}: UnifiedCommunityPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [queuedCount, setQueuedCount] = useState(0)
  const [queued, setQueued] = useState<Post[]>([])

  const sentinelRef = useRef<HTMLDivElement>(null)

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

  // Infinite scroll
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
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, hasMore, loadingMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore() },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  function handlePostCreated(post: Post) {
    setPosts(prev => [post, ...prev])
  }

  function flushQueued() {
    setPosts(prev => {
      const ids = new Set(prev.map(p => p.id))
      return [...queued.filter(p => !ids.has(p.id)), ...prev]
    })
    setQueued([])
    setQueuedCount(0)
  }

  function handleReact(postId: string, reactionType: string) {
    const currentPost = posts.find(p => p.id === postId)
    const isToggleOff = currentPost?.myReaction === reactionType
    let original: Post | null = null

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      original = p
      const toggleOff = p.myReaction === reactionType
      const reactionMap = new Map(p.reactions.map(r => [r.type, r.count]))
      if (p.myReaction && !toggleOff) {
        const c = reactionMap.get(p.myReaction) ?? 0
        c <= 1 ? reactionMap.delete(p.myReaction) : reactionMap.set(p.myReaction, c - 1)
      }
      if (toggleOff) {
        const c = reactionMap.get(reactionType) ?? 0
        c <= 1 ? reactionMap.delete(reactionType) : reactionMap.set(reactionType, c - 1)
      } else {
        reactionMap.set(reactionType, (reactionMap.get(reactionType) ?? 0) + 1)
      }
      const reactions = Array.from(reactionMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
      return { ...p, myReaction: toggleOff ? null : reactionType, isLiked: !toggleOff, likeCount: reactions.reduce((s, r) => s + r.count, 0), reactions }
    }))

    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction_type: reactionType, remove: isToggleOff }),
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          setPosts(prev => prev.map(p => p.id !== postId ? p : {
            ...p,
            isLiked: data.liked,
            likeCount: data.likeCount,
            myReaction: data.myReaction,
            reactions: data.reactions.length > 0 ? data.reactions : p.reactions,
          }))
        } else if (original) {
          const snap = original
          setPosts(prev => prev.map(p => p.id !== postId ? p : snap))
        }
      })
      .catch(() => {
        if (original) {
          const snap = original
          setPosts(prev => prev.map(p => p.id !== postId ? p : snap))
        }
      })
  }

  function handleBookmark(postId: string) {
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, isBookmarked: !p.isBookmarked }))
    fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' })
      .catch(() => {
        setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, isBookmarked: !p.isBookmarked }))
      })
  }

  // Client-side filtering
  const filtered = posts.filter(post => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'win') return post.postType === 'win'
    if (activeFilter === 'question') return post.postType === 'question'
    return post.pillarTag === activeFilter
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden" style={{ height: '100%' }}>
      {/* Dashboard strip */}
      <DashboardStrip {...dashboardProps} />

      {/* Feed — full-width, centered, scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0A0F18' }}>
        <div className="w-full mx-auto p-4 space-y-3" style={{ maxWidth: '680px' }}>

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
                className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-2"
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

          {/* Filter pill bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all' as Filter, label: 'All', color: null },
              { id: 'win' as Filter, label: '🏆 Wins', color: '#C9A84C' },
              { id: 'question' as Filter, label: '❓ Questions', color: '#60A5FA' },
            ].map(f => {
              const active = activeFilter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] rounded-full px-3 py-1 transition-all"
                  style={{
                    backgroundColor: active ? (f.color ?? '#68a2b9') : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${active ? (f.color ?? '#68a2b9') : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  {f.label}
                </button>
              )
            })}
            {PILLAR_FILTERS.map(f => {
              const active = activeFilter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] rounded-full px-3 py-1 transition-all"
                  style={{
                    backgroundColor: active ? f.color : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${active ? f.color : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Compose */}
          <FeedCompose
            channelId={defaultChannelId}
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
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

          {/* Posts + in-feed ads */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-condensed text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {activeFilter === 'all' ? 'No posts yet — be the first to share.' : 'No posts in this category yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: '#0A0F18' }}>
              {filtered.map((post, index) => (
                <React.Fragment key={post.id}>
                  <PostCard
                    post={post}
                    currentUserId={currentUser.id}
                    currentUser={{ id: currentUser.id, displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl }}
                    onReact={handleReact}
                    onBookmark={handleBookmark}
                  />
                  {/* Inject ad after every 3rd post */}
                  {(index + 1) % 3 === 0 && ads.length > 0 && (
                    <FeedAdUnit ad={ads[Math.floor(index / 3) % ads.length]} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-5 w-5" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center font-condensed text-[10px] tracking-widest py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              You&apos;ve reached the beginning
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
