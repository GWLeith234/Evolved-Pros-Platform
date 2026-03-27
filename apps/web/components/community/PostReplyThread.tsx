'use client'

import { useState } from 'react'
import { getAvatarColor } from '@/lib/community/types'
import type { Reply } from '@/lib/community/types'

interface PostReplyThreadProps {
  postId: string
  replies: Reply[]
  totalReplies: number
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  }
  onReplySubmit: (body: string) => Promise<void>
}

const INITIAL_SHOW = 3

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function ReplyItem({ reply }: { reply: Reply }) {
  const avatarBg = getAvatarColor(reply.author.id)
  return (
    <div className="flex gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: avatarBg }}
      >
        {reply.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reply.author.avatarUrl} alt={reply.author.displayName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="font-condensed font-bold text-white" style={{ fontSize: '9px' }}>
            {getInitials(reply.author.displayName)}
          </span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-body font-semibold text-[13px] text-[#1b3c5a]">
            {reply.author.displayName}
          </span>
          <span className="font-condensed text-[10px] text-[#7a8a96]">
            {timeAgo(reply.createdAt)}
          </span>
        </div>
        <p className="text-[13px] text-[#3a4a56] leading-relaxed mt-0.5">{reply.body}</p>
      </div>
    </div>
  )
}

export function PostReplyThread({
  replies,
  totalReplies,
  currentUser,
  onReplySubmit,
}: PostReplyThreadProps) {
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState('')

  const visible = showAll ? replies : replies.slice(0, INITIAL_SHOW)
  const hiddenCount = replies.length - INITIAL_SHOW

  async function handleSubmit() {
    if (!replyBody.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await onReplySubmit(replyBody.trim())
      setReplyBody('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reply.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="mt-3 pl-4 space-y-3"
      style={{ borderLeft: '1px solid rgba(104,162,185,0.2)' }}
    >
      {/* Existing replies */}
      {visible.map(reply => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}

      {/* Show more link */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="font-condensed text-[11px] font-semibold text-[#68a2b9] hover:underline"
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Compose reply */}
      <div className="flex gap-2 pt-1">
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: getAvatarColor(currentUser.id) }}
        >
          {currentUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUser.avatarUrl} alt={currentUser.displayName ?? ''} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span className="font-condensed font-bold text-white" style={{ fontSize: '9px' }}>
              {getInitials(currentUser.displayName)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <textarea
            value={replyBody}
            onChange={e => { setReplyBody(e.target.value); if (error) setError('') }}
            placeholder="Write a reply…"
            className="w-full resize-none rounded border font-body text-[13px] text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none px-3 py-2 transition-colors"
            style={{
              minHeight: '48px',
              borderColor: 'rgba(27,60,90,0.18)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
          />
          {error && <p className="text-xs text-[#ef0e30] mt-1">{error}</p>}
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleSubmit}
              disabled={submitting || !replyBody.trim()}
              className="font-condensed font-bold uppercase tracking-wide text-[10px] rounded px-3 py-1.5 text-white transition-all"
              style={{
                backgroundColor: submitting || !replyBody.trim() ? 'rgba(239,14,48,0.4)' : '#ef0e30',
                cursor: submitting || !replyBody.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '...' : 'Reply →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
