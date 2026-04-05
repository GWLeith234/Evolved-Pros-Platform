'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { getAvatarColor } from '@/lib/community/types'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import type { Post, PillarTag, PostType } from '@/lib/community/types'

interface FeedComposeProps {
  channelId: string
  currentUser: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    isAdmin?: boolean
  }
  onPostCreated: (post: Post) => void
}

const POST_TABS: { type: PostType; icon: string; label: string; placeholder: string; adminOnly?: boolean }[] = [
  { type: 'update',   icon: '✏️', label: 'Update',   placeholder: "Share what you're working on or applying..." },
  { type: 'question', icon: '❓', label: 'Question',  placeholder: 'Ask the community something...' },
  { type: 'win',      icon: '🏆', label: 'Win',       placeholder: 'Share a win — closed a deal, hit a target, had a breakthrough...' },
  { type: 'announce', icon: '📣', label: 'Announce',  placeholder: 'Post an announcement to the community...', adminOnly: true },
]

const PILLAR_TAGS = Object.entries(PILLAR_CONFIG).map(([num, config]) => ({
  tag: `p${num}` as PillarTag,
  label: config.label,
  color: config.color,
}))

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function FeedCompose({ channelId, currentUser, onPostCreated }: FeedComposeProps) {
  const [body, setBody] = useState('')
  const [selectedTag, setSelectedTag] = useState<PillarTag | null>(null)
  const [activePostType, setActivePostType] = useState<PostType>('update')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasContent = body.trim().length > 0
  const avatarBg = getAvatarColor(currentUser.id)
  const activePlaceholder = POST_TABS.find(t => t.type === activePostType)?.placeholder ?? "What's on your mind?"

  const visibleTabs = POST_TABS.filter(t => !t.adminOnly || currentUser.isAdmin)

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
          postType: activePostType,
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
      setActivePostType('update')
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
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        padding: '16px',
      }}
    >
      {/* Post type tabs */}
      <div className="flex gap-1 mb-3">
        {visibleTabs.map(tab => {
          const active = activePostType === tab.type
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActivePostType(tab.type)}
              className="flex items-center gap-1.5 font-condensed font-semibold text-[11px] uppercase tracking-[0.1em] rounded px-3 py-1.5 transition-all"
              style={{
                backgroundColor: active ? '#1b3c5a' : 'transparent',
                color: active ? 'white' : '#7a8a96',
                border: `1px solid ${active ? '#1b3c5a' : 'rgba(27,60,90,0.15)'}`,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Top row: avatar + textarea */}
      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: currentUser.avatarUrl ? undefined : avatarBg }}
        >
          {currentUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName ?? ''}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <span className="font-condensed font-bold text-white text-xs">
              {getInitials(currentUser.displayName)}
            </span>
          )}
        </div>

        <textarea
          value={body}
          onChange={e => { setBody(e.target.value); if (error) setError('') }}
          placeholder={activePlaceholder}
          className="flex-1 resize-none rounded border font-body text-[14px] text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none transition-colors duration-150 px-3 py-2"
          style={{
            minHeight: '72px',
            borderColor: 'rgba(27,60,90,0.18)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
        />
      </div>

      {error && (
        <p className="mt-2 ml-12 text-xs font-body text-[#ef0e30]">{error}</p>
      )}

      {/* Bottom row: pillar tags + post button */}
      <div className="mt-3 ml-12">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {PILLAR_TAGS.map(({ tag, label, color }) => {
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
                  color: active ? color : '#7a8a96',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: active ? color : 'rgba(27,60,90,0.18)',
                  backgroundColor: active ? `${color}18` : 'transparent',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="font-condensed text-[10px] text-[#7a8a96] mb-2">(Optional) Tag your post to a pillar</p>
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!hasContent}
            loading={loading}
            className={!hasContent ? 'pointer-events-none' : ''}
          >
            Post →
          </Button>
        </div>
      </div>
    </div>
  )
}
