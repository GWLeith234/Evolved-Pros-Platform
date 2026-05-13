'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { getAvatarColor } from '@/lib/community/types'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { clearDraft, loadDraft, useDraftAutosave } from '@/hooks/useDraft'
import type { Post, PillarTag, PostType } from '@/lib/community/types'

interface ComposeDraft {
  body: string
  selectedTag: PillarTag | null
  activePostType: PostType
  pollOptions: string[]
  pollClosesAt: string
}

function isDraftEmpty(d: ComposeDraft): boolean {
  return (
    d.body.trim().length === 0 &&
    d.selectedTag === null &&
    d.activePostType === 'update' &&
    d.pollOptions.every(o => o.trim().length === 0) &&
    d.pollClosesAt === ''
  )
}

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
  { type: 'poll',     icon: '📊', label: 'Poll',      placeholder: 'Ask a poll question...' },
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
  const draftKey = `community:compose:${channelId}`
  const initial = useMemo(() => loadDraft<ComposeDraft>(draftKey), [draftKey])
  const [body, setBody] = useState<string>(initial?.body ?? '')
  const [selectedTag, setSelectedTag] = useState<PillarTag | null>(initial?.selectedTag ?? null)
  const [activePostType, setActivePostType] = useState<PostType>(initial?.activePostType ?? 'update')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(
    initial?.pollOptions && initial.pollOptions.length >= 2 ? initial.pollOptions : ['', ''],
  )
  const [pollClosesAt, setPollClosesAt] = useState<string>(initial?.pollClosesAt ?? '')

  useDraftAutosave<ComposeDraft>(
    draftKey,
    { body, selectedTag, activePostType, pollOptions, pollClosesAt },
    { isEmpty: isDraftEmpty },
  )

  const isPoll = activePostType === 'poll'
  const hasContent = isPoll ? body.trim().length > 0 && pollOptions.filter(o => o.trim()).length >= 2 : body.trim().length > 0
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
      let pollId: string | null = null

      // If poll, create poll first
      if (isPoll) {
        const validOptions = pollOptions.filter(o => o.trim()).map(o => o.trim())
        if (validOptions.length < 2) {
          setError('At least 2 poll options required.')
          setLoading(false)
          return
        }
        const pollRes = await fetch('/api/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: trimmed,
            options: validOptions,
            context: 'community',
            closes_at: pollClosesAt || null,
          }),
        })
        if (!pollRes.ok) {
          const d = await pollRes.json()
          throw new Error(d.error ?? 'Failed to create poll')
        }
        const pollData = await pollRes.json()
        pollId = pollData.poll?.id ?? null
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          body: trimmed,
          pillarTag: selectedTag,
          postType: activePostType,
          ...(pollId ? { pollId } : {}),
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
      setPollOptions(['', ''])
      setPollClosesAt('')
      clearDraft(draftKey)
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
      <div className="flex flex-wrap gap-1 mb-3 pr-4 sm:flex-nowrap sm:pr-0">
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

      {/* Poll builder */}
      {isPoll && (
        <div className="mt-3 ml-12 space-y-2">
          <p className="font-condensed font-semibold text-[10px] uppercase tracking-[0.1em]" style={{ color: '#7a8a96' }}>
            Poll options (2–6)
          </p>
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const next = [...pollOptions]
                  next[i] = e.target.value
                  setPollOptions(next)
                }}
                placeholder={`Option ${i + 1}`}
                maxLength={100}
                className="flex-1 rounded border font-body text-[13px] text-[#1b3c5a] placeholder:text-[#7a8a96] focus:outline-none px-3 py-1.5"
                style={{ borderColor: 'rgba(27,60,90,0.18)' }}
              />
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}
                  className="font-condensed text-[10px] px-2"
                  style={{ color: '#ef0e30' }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button
              type="button"
              onClick={() => setPollOptions(prev => [...prev, ''])}
              className="font-condensed font-semibold text-[10px] uppercase tracking-[0.1em]"
              style={{ color: '#68a2b9' }}
            >
              + Add option
            </button>
          )}
          <div>
            <label className="font-condensed text-[10px] uppercase tracking-[0.08em]" style={{ color: '#7a8a96' }}>
              Close date (optional)
            </label>
            <input
              type="date"
              value={pollClosesAt}
              onChange={e => setPollClosesAt(e.target.value)}
              className="block mt-1 rounded border font-body text-[12px] text-[#1b3c5a] focus:outline-none px-3 py-1.5"
              style={{ borderColor: 'rgba(27,60,90,0.18)' }}
            />
          </div>
        </div>
      )}

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
