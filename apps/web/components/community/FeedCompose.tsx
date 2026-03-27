'use client'

import { useState } from 'react'
import { getAvatarColor } from '@/lib/community/types'
import type { Post, PillarTag } from '@/lib/community/types'

interface FeedComposeProps {
  channelId: string
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  }
  onPostCreated: (post: Post) => void
}

const PILLAR_TAGS: { tag: PillarTag; label: string }[] = [
  { tag: 'p1', label: 'P1 · Foundation' },
  { tag: 'p2', label: 'P2 · Identity' },
  { tag: 'p3', label: 'P3 · Mental Toughness' },
  { tag: 'p4', label: 'P4 · Strategy' },
  { tag: 'p5', label: 'P5 · Accountability' },
  { tag: 'p6', label: 'P6 · Execution' },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function FeedCompose({ channelId, currentUser, onPostCreated }: FeedComposeProps) {
  const [body, setBody] = useState('')
  const [selectedTag, setSelectedTag] = useState<PillarTag | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const avatarBg = getAvatarColor(currentUser.id)

  async function handleSubmit() {
    const trimmed = body.trim()
    if (trimmed.length < 10) {
      setError('Post must be at least 10 characters.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          body: trimmed,
          pillarTag: selectedTag,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to post')
      }

      const post = await res.json() as Post
      onPostCreated(post)
      setBody('')
      setSelectedTag(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(27,60,90,0.12)',
        padding: '16px',
      }}
    >
      {/* Top row: avatar + textarea */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: currentUser.avatarUrl ? undefined : avatarBg }}
        >
          {currentUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName ?? ''}
              className="w-9 h-9 rounded object-cover"
            />
          ) : (
            <span className="font-condensed font-bold text-white text-xs">
              {getInitials(currentUser.displayName)}
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          value={body}
          onChange={e => { setBody(e.target.value); if (error) setError('') }}
          placeholder="Share what you're working on or applying..."
          className="flex-1 resize-none rounded border font-body text-[14px] text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none transition-colors duration-150 px-3 py-2"
          style={{
            minHeight: '72px',
            borderColor: 'rgba(27,60,90,0.18)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 ml-12 text-xs font-body text-[#ef0e30]">{error}</p>
      )}

      {/* Bottom row: pillar tags + post button */}
      <div className="mt-3 ml-12">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {PILLAR_TAGS.map(({ tag, label }) => {
            const active = selectedTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(active ? null : tag)}
                className="font-condensed font-semibold transition-all duration-150 rounded"
                style={{
                  fontSize: '10px',
                  padding: '4px 9px',
                  color: active ? '#68a2b9' : '#7a8a96',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: active ? '#68a2b9' : 'rgba(27,60,90,0.18)',
                  backgroundColor: active ? 'rgba(104,162,185,0.1)' : 'transparent',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="font-condensed text-[10px] text-[#7a8a96] mb-2">(Optional) Tag your post to a pillar</p>
        <div className="flex justify-end">

        <button
          onClick={handleSubmit}
          disabled={loading || body.trim().length < 10}
          className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 text-white transition-all"
          style={{
            backgroundColor: loading || body.trim().length < 10 ? 'rgba(239,14,48,0.4)' : '#ef0e30',
            cursor: loading || body.trim().length < 10 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : 'Post →'}
        </button>
        </div>
      </div>
    </div>
  )
}
