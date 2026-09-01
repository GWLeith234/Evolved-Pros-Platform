'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAvatarColor } from '@/lib/community/types'
import { MediaAttachControl } from './MediaAttachControl'
import { PostMedia } from './PostMedia'
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
  // CM-1: file is null for the text-only path, which is unchanged.
  onReplySubmit: (body: string, file: File | null) => Promise<void>
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
  // Defers Date.now() to client-only — avoids server/client mismatch (hydration error #425)
  // Pattern B: useState<string | null>(null) so initial render is identical
  // on server and client (both produce ''); useEffect fills in after mount.
  const [ago, setAgo] = useState<string | null>(null)
  useEffect(() => { setAgo(timeAgo(reply.createdAt)) }, [reply.createdAt])
  return (
    <div className="flex gap-2.5">
      <Link
        href={`/profile/${reply.author.id}`}
        aria-label={`${reply.author.displayName} profile`}
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: avatarBg }}
      >
        {reply.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reply.author.avatarUrl} alt={reply.author.displayName} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="font-condensed font-bold text-white" style={{ fontSize: '12px' }}>
            {getInitials(reply.author.displayName)}
          </span>
        )}
      </Link>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/profile/${reply.author.id}`}
            className="font-body font-semibold text-[13px] text-[#1b3c5a] hover:underline"
          >
            {reply.author.displayName}
          </Link>
          <span className="font-condensed text-[12px] sm:text-[12px] text-[#7a8a96]" suppressHydrationWarning>
            {ago ?? ''}
          </span>
        </div>
        {reply.body && (
          <p className="text-[13px] text-[#3a4a56] leading-relaxed mt-0.5">{reply.body}</p>
        )}
        {/* CM-1: attached image, shorter frame than a stream card. */}
        {reply.media && (
          <PostMedia
            media={reply.media}
            alt={`Image attached by ${reply.author.displayName}`}
            maxHeight={320}
          />
        )}
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
  // CM-1: one optional image on a comment.
  const [file, setFile] = useState<File | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const visible = showAll ? replies : replies.slice(0, INITIAL_SHOW)
  const hiddenCount = replies.length - INITIAL_SHOW

  // An image on its own is a valid comment; a standing media rejection blocks
  // the submit rather than silently sending text-only.
  const canReply = (replyBody.trim().length > 0 || file !== null) && !submitting && !mediaError

  async function handleSubmit() {
    if (!canReply) return
    setSubmitting(true)
    setError('')
    try {
      await onReplySubmit(replyBody.trim(), file)
      setReplyBody('')
      setFile(null)
      setMediaError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reply.'
      if (file && /image|file|upload|mb\b/i.test(message)) setMediaError(message)
      else setError(message)
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
          className="font-condensed text-[12px] sm:text-[12px] font-semibold text-[#68a2b9] hover:underline"
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Compose reply */}
      <div className="flex gap-2 pt-1 min-w-0">
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: getAvatarColor(currentUser.id) }}
        >
          {currentUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUser.avatarUrl} alt={currentUser.displayName ?? ''} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span className="font-condensed font-bold text-white" style={{ fontSize: '12px' }}>
              {getInitials(currentUser.displayName)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={replyBody}
            onChange={e => { setReplyBody(e.target.value); if (error) setError('') }}
            placeholder="Write a reply…"
            cols={1}
            className="block w-full resize-none rounded border font-body text-[13px] text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none px-3 py-2 transition-colors"
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
          {/* CM-1 attach — mounted whenever the thread is open. */}
          <div className="mt-2">
            <MediaAttachControl
              file={file}
              onChange={setFile}
              error={mediaError}
              onError={setMediaError}
              disabled={submitting}
              compact
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleSubmit}
              disabled={!canReply}
              className="font-condensed font-bold uppercase tracking-wide text-[12px] sm:text-[12px] rounded px-3 py-1.5 text-white transition-all"
              style={{
                backgroundColor: canReply ? '#ef0e30' : 'rgba(239,14,48,0.4)',
                cursor: canReply ? 'pointer' : 'not-allowed',
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
