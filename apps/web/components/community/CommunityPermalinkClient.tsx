'use client'

import { useCallback, useEffect, useState } from 'react'
import { PostCardV2 } from './PostCardV2'
import { PostReplyThread } from './PostReplyThread'
import type { Post, Reply } from '@/lib/community/types'

/**
 * Single-post permalink view (SPRINT CM-1).
 *
 * Renders the SAME PostCardV2 the feed uses — a post must not look different
 * because you arrived by link. The reply thread is always expanded here; that
 * is the only difference from an in-feed card.
 */
export function CommunityPermalinkClient({
  post: initialPost,
  currentUser,
}: {
  post: Post
  currentUser: { id: string; displayName: string | null; avatarUrl: string | null }
}) {
  const [post, setPost] = useState<Post>(initialPost)
  const [replies, setReplies] = useState<Reply[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/posts/${initialPost.id}/replies`)
      .then(res => (res.ok ? res.json() as Promise<{ replies: Reply[] }> : { replies: [] as Reply[] }))
      .then(data => { if (!cancelled) setReplies(data.replies ?? []) })
      .catch(() => { if (!cancelled) setReplies([]) })
    return () => { cancelled = true }
  }, [initialPost.id])

  const handleReplySubmit = useCallback(async (body: string, file: File | null) => {
    const form = new FormData()
    form.append('body', body)
    if (file) form.append('file', file, file.name)
    const res = await fetch(`/api/community/posts/${initialPost.id}/comments`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(data.error ?? 'Failed to reply')
    }
    const reply = await res.json() as Reply
    setReplies(prev => [...(prev ?? []), reply])
    setPost(prev => ({ ...prev, replyCount: (prev.replyCount ?? 0) + 1 }))
  }, [initialPost.id])

  return (
    <>
      <PostCardV2 post={post} currentUserId={currentUser.id} />
      <div
        className="px-3 sm:px-6 pb-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
        }}
      >
        {replies === null ? (
          <p
            className="font-condensed text-xs uppercase tracking-widest pl-4 pt-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Loading…
          </p>
        ) : (
          <PostReplyThread
            postId={post.id}
            replies={replies}
            totalReplies={post.replyCount ?? 0}
            currentUser={currentUser}
            onReplySubmit={handleReplySubmit}
          />
        )}
      </div>
    </>
  )
}
