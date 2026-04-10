'use client'

import React from 'react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeedCompose } from './FeedCompose'
import { PostCard } from './PostCard'
import { PinnedPost } from './PinnedPost'
import { SponsorCard } from '@/components/ads/SponsorCard'
import { useSponsorAd } from '@/hooks/useSponsorAd'
import type { Post, Reply } from '@/lib/community/types'

interface CommunityFeedProps {
  channelId: string
  channelSlug: string
  initialPosts: Post[]
  initialNextCursor: string | null
  initialHasMore: boolean
  pinnedPost: { label: string; body: string } | null
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export function CommunityFeed({
  channelId,
  channelSlug,
  initialPosts,
  initialNextCursor,
  initialHasMore,
  pinnedPost,
  currentUser,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [queuedPosts, setQueuedPosts] = useState<Post[]>([])
  const [newPostCount, setNewPostCount] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const errorCountRef = useRef(0)

  const communityAd = useSponsorAd('community')

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`posts-feed-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string
            channel_id: string
            body: string
            pillar_tag: string | null
            is_pinned: boolean
            like_count: number
            reply_count: number
            created_at: string
            author_id: string
          }
          if (newRow.author_id === currentUser.id) return

          const newPost: Post = {
            id: newRow.id,
            channelId: newRow.channel_id,
            body: newRow.body,
            pillarTag: newRow.pillar_tag as Post['pillarTag'],
            isPinned: newRow.is_pinned,
            likeCount: newRow.like_count,
            replyCount: newRow.reply_count,
            createdAt: newRow.created_at,
            author: {
              id: newRow.author_id,
              displayName: 'Member',
              avatarUrl: null,
            },
            isLiked: false,
            myReaction: null,
            reactions: [],
            isBookmarked: false,
          }

          setNewPostCount(c => c + 1)
          setQueuedPosts(prev => [newPost, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId, currentUser.id])

  // Infinite scroll with error handling + backoff
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor || loadError) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/posts?channelSlug=${channelSlug}&cursor=${encodeURIComponent(cursor)}&limit=20`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { posts: Post[]; nextCursor: string | null; hasMore: boolean }
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newPosts = data.posts.filter(p => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
      errorCountRef.current = 0
    } catch {
      errorCountRef.current += 1
      if (errorCountRef.current >= 3) {
        setLoadError(true)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [channelSlug, cursor, hasMore, loadingMore, loadError])

  const retryLoad = useCallback(() => {
    errorCountRef.current = 0
    setLoadError(false)
    loadMore()
  }, [loadMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadError) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore, loadError])

  function handlePostCreated(post: Post) {
    setPosts(prev => [post, ...prev])
  }

  function flushQueuedPosts() {
    setPosts(prev => {
      const existingIds = new Set(prev.map(p => p.id))
      const filtered = queuedPosts.filter(p => !existingIds.has(p.id))
      return [...filtered, ...prev]
    })
    setQueuedPosts([])
    setNewPostCount(0)
  }

  function handleReact(postId: string, reactionType: string) {
    // Read toggle state from current posts array BEFORE optimistic update
    const currentPost = posts.find(p => p.id === postId)
    const isToggleOff = currentPost?.myReaction === reactionType

    // Capture original post state for revert
    let original: Post | null = null

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      original = p
      // Build optimistic reaction counts
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
      return {
        ...p,
        myReaction: toggleOff ? null : reactionType,
        isLiked: !toggleOff,
        likeCount: reactions.reduce((s, r) => s + r.count, 0),
        reactions,
      }
    }))

    fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Pass explicit remove flag so the API can bypass unreliable existing-row lookup
      body: JSON.stringify({ reaction_type: reactionType, remove: isToggleOff }),
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p
            return {
              ...p,
              isLiked: data.liked,
              likeCount: data.likeCount,
              myReaction: data.myReaction,
              // Only replace optimistic reactions if the API returned real data;
              // an empty array means the server-side aggregate query failed silently —
              // keep the optimistic state so chips don't vanish.
              reactions: data.reactions.length > 0 ? data.reactions : p.reactions,
            }
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
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id !== postId ? p : { ...p, isBookmarked: !p.isBookmarked }
    ))

    fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' })
      .catch(() => {
        // Revert on failure
        setPosts(prev => prev.map(p =>
          p.id !== postId ? p : { ...p, isBookmarked: !p.isBookmarked }
        ))
      })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Feed area - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3 max-w-3xl mx-auto">
          {/* Compose */}
          <FeedCompose
            channelId={channelId}
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
          />

          {/* Pinned post */}
          {pinnedPost && <PinnedPost label={pinnedPost.label} body={pinnedPost.body} />}

          {/* New posts banner */}
          {newPostCount > 0 && (
            <button
              onClick={flushQueuedPosts}
              className="w-full py-2.5 rounded font-condensed font-semibold uppercase tracking-wide text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#68a2b9' }}
            >
              ↑ {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'} — click to load
            </button>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-condensed text-xs tracking-widest text-[#7a8a96]">
                No posts yet — be the first to share.
              </p>
            </div>
          ) : (
            posts.map((post, i) => (
              <React.Fragment key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={currentUser.id}
                  currentUser={{ id: currentUser.id, displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl }}
                  onReact={handleReact}
                  onBookmark={handleBookmark}
                />
                {(i + 1) % 8 === 0 && communityAd && (
                  <SponsorCard ad={communityAd} variant="community" />
                )}
              </React.Fragment>
            ))
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading spinner */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-[#7a8a96]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Error state with retry */}
          {loadError && (
            <div className="flex flex-col items-center gap-2 py-6">
              <p className="font-condensed text-[12px] text-[#7a8a96]">
                Failed to load more posts
              </p>
              <button
                type="button"
                onClick={retryLoad}
                className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-all"
                style={{ backgroundColor: 'rgba(27,60,90,0.08)', color: '#1b3c5a' }}
              >
                Retry
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center font-condensed text-[10px] tracking-widest text-[#7a8a96] py-4">
              You've reached the beginning
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
