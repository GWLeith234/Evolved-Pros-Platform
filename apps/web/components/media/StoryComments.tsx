'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  storyId: string
  body: string
  createdAt: string
  author: { display_name: string; avatar_url: string | null }
}

interface StoryCommentsProps {
  storyId: string
  pillarColor: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AvatarCircle({ name, url, color }: { name: string; url: string | null; color: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: 32, height: 32 }}
      />
    )
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center font-condensed font-bold text-[10px]"
      style={{ width: 32, height: 32, backgroundColor: color, color: '#fff' }}
    >
      {initials}
    </div>
  )
}

export function StoryComments({ storyId, pillarColor }: StoryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const supabase = createClient()

    // Check auth and fetch comments in parallel
    Promise.all([
      supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user)),
      fetch(`/api/media/comments?story_id=${storyId}`)
        .then(r => r.json())
        .then(data => setComments(data.comments ?? []))
    ])
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [storyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/media/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, body: trimmed }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? 'Failed to post comment')
        setSubmitting(false)
        return
      }

      const { comment } = await res.json()
      setComments(prev => [...prev, comment])
      setBody('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <section
      className="mt-10 pt-8"
      style={{ borderTop: '1px solid rgba(10,15,24,0.08)' }}
    >
      <h2
        className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px] mb-5"
        style={{ color: 'rgba(10,15,24,0.5)' }}
      >
        Comments{loaded && comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {/* Comment form or sign-in prompt */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleTextareaInput}
            placeholder="Join the conversation..."
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg px-4 py-3 text-[14px] font-body resize-none focus:outline-none transition-colors"
            style={{
              backgroundColor: '#fff',
              border: '1px solid rgba(10,15,24,0.1)',
              color: '#0A0F18',
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = pillarColor }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(10,15,24,0.1)' }}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className="font-condensed text-[10px]"
              style={{ color: body.length > 900 ? '#C9302A' : 'rgba(10,15,24,0.3)' }}
            >
              {body.length}/1000
            </span>
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-5 py-2 rounded transition-opacity"
              style={{
                backgroundColor: pillarColor,
                color: '#fff',
                opacity: !body.trim() || submitting ? 0.5 : 1,
                cursor: !body.trim() || submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
          {error && (
            <p className="font-body text-[12px] mt-1" style={{ color: '#C9302A' }}>
              {error}
            </p>
          )}
        </form>
      ) : (
        <div
          className="rounded-lg px-5 py-4 mb-6 text-center"
          style={{ backgroundColor: 'rgba(10,15,24,0.03)', border: '1px solid rgba(10,15,24,0.06)' }}
        >
          <p className="font-body text-[13px]" style={{ color: 'rgba(10,15,24,0.5)' }}>
            <Link
              href="/login"
              className="font-semibold underline"
              style={{ color: pillarColor }}
            >
              Sign in
            </Link>
            {' '}to join the conversation.
          </p>
        </div>
      )}

      {/* Comment list */}
      {loaded && comments.length === 0 && (
        <p className="font-body text-[13px] text-center py-4" style={{ color: 'rgba(10,15,24,0.35)' }}>
          No comments yet — be the first.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AvatarCircle
                name={c.author.display_name}
                url={c.author.avatar_url}
                color={pillarColor}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-body font-semibold text-[13px]" style={{ color: '#0A0F18' }}>
                  {c.author.display_name}
                </span>
                <span className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.35)' }}>
                  {timeAgo(c.createdAt)}
                </span>
              </div>
              <p
                className="font-body text-[14px] leading-relaxed whitespace-pre-wrap break-words"
                style={{ color: 'rgba(10,15,24,0.75)' }}
              >
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
