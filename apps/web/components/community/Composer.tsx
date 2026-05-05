'use client'

import { useEffect, useRef, useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

type Kind = 'update' | 'question' | 'win' | 'poll'
type Pillar = 1 | 2 | 3 | 4 | 5 | 6

interface ComposerProps {
  currentUser: {
    displayName: string
    initials: string
    avatarUrl: string | null
    tier: string | null
  }
  channelId: string
  onPostCreated?: () => void
}

interface TabConfig {
  kind: Kind
  label: string
  icon: React.ReactNode
  placeholder: string
}

const TABS: TabConfig[] = [
  {
    kind: 'update',
    label: 'Update',
    icon: null,
    placeholder: "Share what you're working on or applying...",
  },
  {
    kind: 'question',
    label: 'Question',
    icon: <span aria-hidden="true">?</span>,
    placeholder: 'Ask the community something...',
  },
  {
    kind: 'win',
    label: 'Win',
    icon: <span aria-hidden="true">🏆</span>,
    placeholder: 'Share a win — big or small...',
  },
  {
    kind: 'poll',
    label: 'Poll',
    icon: <span aria-hidden="true">📊</span>,
    placeholder: 'Ask a poll question...',
  },
]

const PILLAR_LABELS: Record<Pillar, string> = {
  1: 'Foundation',
  2: 'Identity',
  3: 'Mental',
  4: 'Strategy',
  5: 'Accountability',
  6: 'Execution',
}

const PILLARS: Pillar[] = [1, 2, 3, 4, 5, 6]

// AI returns canonical pillar slugs ('mental') — map to the composer's
// numeric pillar identity so the chip auto-selects post-generation.
const PILLAR_SLUG_TO_NUMBER: Record<string, Pillar> = {
  foundation:     1,
  identity:       2,
  mental:         3,
  strategy:       4,
  accountability: 5,
  execution:      6,
}

const TEAL = '#0ABFA3'

function tierAvatarBg(tier: string | null): string {
  if (tier === 'pro') return 'linear-gradient(135deg, #C9A84C 0%, #E2C572 100%)'
  if (tier === 'vip') return 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)'
  return 'linear-gradient(135deg, #ef0e30 0%, #f87171 100%)'
}

export function Composer({ currentUser, channelId, onPostCreated }: ComposerProps) {
  const [activeKind, setActiveKind] = useState<Kind>('update')
  const [body, setBody] = useState('')
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // "Write for me" assist
  const [aiOpen, setAiOpen] = useState(false)
  const [aiIdea, setAiIdea] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const aiInputRef = useRef<HTMLInputElement>(null)

  // Refocus the textarea whenever the active tab changes.
  useEffect(() => {
    textareaRef.current?.focus()
  }, [activeKind])

  // Auto-focus the idea input when the panel opens.
  useEffect(() => {
    if (aiOpen) aiInputRef.current?.focus()
  }, [aiOpen])

  async function handleAIWrite() {
    const idea = aiIdea.trim()
    if (!idea || aiLoading) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/write-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, type: activeKind }),
      })
      const data = await res.json().catch(() => ({})) as {
        content?: string
        suggested_pillar?: string
        error?: string
      }
      if (!res.ok || !data.content) {
        setAiError('Could not generate — try again')
        return
      }
      setBody(data.content)
      const mapped = data.suggested_pillar ? PILLAR_SLUG_TO_NUMBER[data.suggested_pillar] : undefined
      if (mapped) setSelectedPillar(mapped)
      setAiOpen(false)
      setAiIdea('')
      // Scroll the new content into view + focus so the user can edit.
      requestAnimationFrame(() => textareaRef.current?.focus())
    } catch {
      setAiError('Could not generate — try again')
    } finally {
      setAiLoading(false)
    }
  }

  const activeTab = TABS.find(t => t.kind === activeKind) ?? TABS[0]
  const canPost = body.trim().length > 0 && !isPosting

  async function handleSubmit() {
    if (!canPost) return
    setIsPosting(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          body: body.trim(),
          kind: activeKind,
          pillar: selectedPillar,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to post')
      }
      setBody('')
      setSelectedPillar(null)
      onPostCreated?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post.')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--composer-bg)',
        border: '1px solid var(--composer-border)',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tabs */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--composer-border)',
        }}
      >
        {TABS.map(tab => {
          const active = tab.kind === activeKind
          return (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveKind(tab.kind)}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.color = 'var(--composer-tab-hover)'
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.color = 'var(--composer-tab-idle)'
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '14px 20px',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 13,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: active ? 'var(--composer-tab-active)' : 'var(--composer-tab-idle)',
                background: 'transparent',
                border: 'none',
                borderBottom: active
                  ? '2px solid var(--composer-tab-underline)'
                  : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                transition: 'color 140ms ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Body row */}
      <div style={{ display: 'flex', gap: 14, padding: '18px 20px' }}>
        {/* Avatar */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            overflow: 'hidden',
            background: currentUser.avatarUrl ? '#1A2332' : tierAvatarBg(currentUser.tier),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentUser.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUser.avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 12,
                color: '#0A0F18',
                letterSpacing: '0.04em',
              }}
            >
              {currentUser.initials}
            </span>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => { setBody(e.target.value); if (error) setError('') }}
            placeholder={aiLoading ? 'Writing…' : activeTab.placeholder}
            disabled={aiLoading}
            style={{
              background: 'var(--composer-textarea-bg)',
              border: 'none',
              outline: 'none',
              color: 'var(--composer-textarea-text)',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 14,
              lineHeight: 1.5,
              minHeight: 70,
              maxHeight: 240,
              resize: 'vertical',
              opacity: aiLoading ? 0.55 : 1,
              animation: aiLoading ? 'composerAIPulse 1.4s ease-in-out infinite' : 'none',
              transition: 'opacity 160ms ease',
            }}
          />

          {aiOpen && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: 'rgba(10,191,163,0.06)',
                border: `1px solid ${TEAL}33`,
                borderRadius: 4,
                animation: 'composerAISlide 160ms ease-out',
              }}
            >
              <input
                ref={aiInputRef}
                type="text"
                value={aiIdea}
                onChange={e => { setAiIdea(e.target.value); if (aiError) setAiError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIWrite() }
                  if (e.key === 'Escape')                { setAiOpen(false); setAiIdea('') }
                }}
                disabled={aiLoading}
                placeholder="Give me an idea or topic…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--composer-textarea-text)',
                  fontFamily: '"Barlow", sans-serif',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              />
              <button
                type="button"
                onClick={handleAIWrite}
                disabled={!aiIdea.trim() || aiLoading}
                style={{
                  padding: '6px 14px',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  background: aiIdea.trim() && !aiLoading ? TEAL : 'transparent',
                  color: aiIdea.trim() && !aiLoading ? '#0A0F18' : `${TEAL}99`,
                  border: `1px solid ${TEAL}`,
                  cursor: aiIdea.trim() && !aiLoading ? 'pointer' : 'not-allowed',
                  borderRadius: 2,
                  transition: 'all 140ms ease',
                }}
              >
                {aiLoading ? 'Writing…' : 'Generate'}
              </button>
            </div>
          )}

          {aiError && !aiLoading && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontFamily: '"Barlow", sans-serif',
                fontSize: 12,
                color: '#ef6075',
              }}
            >
              {aiError}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes composerAIPulse {
          0%, 100% { background: var(--composer-textarea-bg); }
          50%      { background: rgba(10,191,163,0.08); }
        }
        @keyframes composerAISlide {
          from { transform: translateY(-4px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      {/* Pillar tag row */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--composer-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--composer-pillar-label)',
          }}
        >
          Tag Pillar
        </span>

        {PILLARS.map(p => {
          const color = PILLAR_CONFIG[p].color
          const active = selectedPillar === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPillar(active ? null : p)}
              style={{
                padding: '4px 10px',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: active ? color : 'var(--composer-pillar-chip-bg)',
                color: active ? 'var(--composer-pillar-chip-active-text)' : 'var(--composer-pillar-label)',
                border: `1px solid ${active ? color : `${color}55`}`,
                cursor: 'pointer',
                transition: 'all 140ms ease',
              }}
            >
              {PILLAR_LABELS[p]}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => { setAiOpen(o => !o); setAiError('') }}
          disabled={aiLoading || isPosting}
          aria-pressed={aiOpen}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            background: aiOpen ? `${TEAL}1A` : 'transparent',
            color: TEAL,
            border: `1px solid ${aiOpen ? TEAL : `${TEAL}66`}`,
            borderRadius: 0,
            cursor: aiLoading || isPosting ? 'not-allowed' : 'pointer',
            transition: 'all 140ms ease',
          }}
        >
          {aiOpen ? 'Cancel AI' : 'Write for me'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canPost}
          style={{
            padding: '10px 24px',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 13,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            background: canPost ? 'var(--composer-post-btn-bg)' : 'var(--composer-post-btn-disabled)',
            color: canPost ? 'var(--composer-post-btn-text)' : 'var(--composer-pillar-label)',
            border: 'none',
            borderRadius: 0,
            cursor: canPost ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 160ms ease',
          }}
          onMouseEnter={e => {
            if (canPost) {
              const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null
              if (arrow) arrow.style.transform = 'translateX(2px)'
            }
          }}
          onMouseLeave={e => {
            const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null
            if (arrow) arrow.style.transform = 'translateX(0)'
          }}
        >
          {isPosting ? 'Posting...' : 'Post'}
          <span data-arrow style={{ transition: 'transform 160ms ease' }} aria-hidden="true">→</span>
        </button>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '0 20px 12px',
            fontFamily: '"Barlow", sans-serif',
            fontSize: 12,
            color: '#ef6075',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
