'use client'

import { useState } from 'react'
import { PostReplyThread } from './PostReplyThread'
import { getAvatarColor, PILLAR_LABELS } from '@/lib/community/types'
import { MemberBadge } from '@/components/ui/MemberBadge'
import type { Post, Reply, PillarTag } from '@/lib/community/types'

interface PostCardProps {
  post: Post & { replies?: Reply[] }
  currentUserId: string
  currentUser: { id: string; displayName: string | null }
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}h ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function PostCard({ post, currentUserId, currentUser, onLike, onBookmark }: PostCardProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Reply[]>(post.replies ?? [])
  const [loadingReplies, setLoadingReplies] = useState(false)

  const avatarBg = getAvatarColor(post.author.id)

  async function handleToggleReplies() {
    if (!showReplies && replies.length === 0 && post.replyCount > 0) {
      setLoadingReplies(true)
      try {
        const res = await fetch(`/api/posts/${post.id}/replies`)
        if (res.ok) {
          const data = await res.json()
          setReplies(data.replies)
        }
      } finally {
        setLoadingReplies(false)
      }
    }
    setShowReplies(v => !v)
  }

  async function handleReplySubmit(body: string) {
    const res = await fetch(`/api/posts/${post.id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to reply')
    }
    const reply = await res.json() as Reply
    setReplies(prev => [...prev, reply])
    // Note: parent should also update replyCount via onReply callback
  }

  const pillarLabel = post.pillarTag
    ? `Pillar ${post.pillarTag[1]} — ${PILLAR_LABELS[post.pillarTag]}`
    : null

  const actionBtnClass = 'flex items-center gap-1.5 font-condensed font-semibold uppercase text-[11px] tracking-wide text-[#7a8a96] hover:text-[#ef0e30] transition-colors duration-150'

  return (
    <div
      className="rounded-lg transition-all duration-150"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(27,60,90,0.12)',
        padding: '20px',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#a8cdd9')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.12)')}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: avatarBg }}
        >
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              className="w-9 h-9 rounded object-cover"
            />
          ) : (
            <span className="font-condensed font-bold text-white text-xs">
              {getInitials(post.author.displayName)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body font-semibold text-[14px] text-[#1b3c5a]">
              {post.author.displayName}
            </span>
            {post.author.tier && <MemberBadge tier={post.author.tier} size="sm" />}
            {pillarLabel && (
              <span
                className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                style={{
                  backgroundColor: 'rgba(104,162,185,0.08)',
                  border: '1px solid rgba(104,162,185,0.18)',
                  color: '#68a2b9',
                }}
              >
                {pillarLabel}
              </span>
            )}
          </div>
          <p className="font-condensed font-semibold uppercase text-[10px] text-[#7a8a96] mt-0.5">
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Body */}
      <p
        className="font-body text-[14px] leading-[1.72] mb-4"
        style={{ color: '#3a4a56' }}
      >
        {post.body}
      </p>

      {/* Actions */}
      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}
      >
        <button
          onClick={handleToggleReplies}
          className={actionBtnClass}
          style={{ color: showReplies ? '#68a2b9' : undefined }}
        >
          <ReplyIcon />
          Reply ({post.replyCount + (replies.length > (post.replies?.length ?? 0) ? replies.length - (post.replies?.length ?? 0) : 0)})
        </button>

        <button
          onClick={() => onLike(post.id)}
          className={actionBtnClass}
          style={{ color: post.isLiked ? '#ef0e30' : undefined }}
        >
          <HeartIcon filled={post.isLiked} />
          {post.likeCount}
        </button>

        <button
          onClick={() => onBookmark(post.id)}
          className={actionBtnClass}
          style={{ color: post.isBookmarked ? '#1b3c5a' : undefined }}
        >
          <BookmarkIcon filled={post.isBookmarked} />
          Bookmark
        </button>
      </div>

      {/* Reply thread */}
      {showReplies && (
        <div className="mt-3">
          {loadingReplies ? (
            <p className="font-condensed text-xs text-[#7a8a96] uppercase tracking-widest pl-4">
              Loading…
            </p>
          ) : (
            <PostReplyThread
              postId={post.id}
              replies={replies}
              totalReplies={post.replyCount}
              currentUser={currentUser}
              onReplySubmit={handleReplySubmit}
            />
          )}
        </div>
      )}
    </div>
  )
}
