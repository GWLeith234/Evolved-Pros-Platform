'use client'

import { useEffect, useRef, useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { MediaAttachControl } from './MediaAttachControl'
import {
  canSubmitPost,
  COMPOSER_TYPES,
  type ComposerKind,
  type ComposerPhase,
} from '@/lib/community/composer'
import {
  PILLAR_NUMBERS,
  PillarNumberBadge,
  PillarNumberBadgeStyles,
  type PillarNumber,
} from './PillarNumberBadge'

type Pillar = PillarNumber

interface ComposerProps {
  currentUser: {
    displayName: string
    initials: string
    avatarUrl: string | null
    tier: string | null
  }
  channelId: string
  onPostCreated?: () => void
  /** Test / deep-link hook. Shipped /community starts on the Post CTA. */
  initialPhase?: ComposerPhase
  initialKind?: ComposerKind
}

// AI returns canonical pillar slugs ('mental') — map to the composer's
// numeric pillar identity so the badge auto-selects post-generation.
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
  if (tier === 'pro') return 'linear-gradient(135deg, #C9302A 0%, #E55B55 100%)'
  if (tier === 'vip') return 'linear-gradient(135deg, #C9A84C 0%, #E2C572 100%)'
  return 'linear-gradient(135deg, #ef0e30 0%, #f87171 100%)'
}

export function Composer({
  currentUser,
  channelId,
  onPostCreated,
  initialPhase = 'cta',
  initialKind = 'update',
}: ComposerProps) {
  const [phase, setPhase] = useState<ComposerPhase>(initialPhase)
  const [activeKind, setActiveKind] = useState<ComposerKind>(initialKind)
  const [body, setBody] = useState('')
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null)
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  // CM-1: one optional image. null === today's text-only submit, exactly.
  const [file, setFile] = useState<File | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // "Write for me" assist
  const [aiOpen, setAiOpen] = useState(false)
  const [aiIdea, setAiIdea] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const aiInputRef = useRef<HTMLInputElement>(null)

  // Refocus the textarea when the composer opens or the type changes.
  useEffect(() => {
    if (phase === 'compose') textareaRef.current?.focus()
  }, [activeKind, phase])

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
        setAiError('Could not generate. Try again')
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
      setAiError('Could not generate. Try again')
    } finally {
      setAiLoading(false)
    }
  }

  const activeTab = COMPOSER_TYPES.find(t => t.kind === activeKind) ?? COMPOSER_TYPES[0]
  const validPollOptionCount = pollOptions.filter(o => o.trim().length > 0).length
  // An image on its own is a valid post on the non-poll tabs; a standing
  // media rejection blocks the submit rather than silently posting text-only.
  // The rule lives in lib/community/composer.ts so it can be unit-tested; the
  // user clears a standing rejection by dismissing it or picking a valid image.
  const canPost = canSubmitPost({
    body,
    activeKind,
    file,
    mediaError,
    validPollOptionCount,
    isPosting,
  })

  async function handleSubmit() {
    if (!canPost) return
    setIsPosting(true)
    setError('')
    try {
      let res: Response
      if (activeKind === 'poll') {
        // Polls need poll_options rows and never carry media in CM-1, so they
        // stay on the original JSON route — unchanged behaviour.
        const cleanedPollOptions = pollOptions.map(o => o.trim()).filter(Boolean)
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            body: body.trim(),
            kind: activeKind,
            pillar: selectedPillar,
            pollOptions: cleanedPollOptions,
          }),
        })
      } else {
        // CM-1: multipart, with or without a file. No file part === the
        // text-only path, byte-identical to before.
        const form = new FormData()
        form.append('channelId', channelId)
        form.append('body', body.trim())
        form.append('type', activeKind)
        if (selectedPillar) form.append('pillar', String(selectedPillar))
        if (file) form.append('file', file, file.name)
        res = await fetch('/api/community/posts', { method: 'POST', body: form })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Failed to post')
      }
      setBody('')
      setSelectedPillar(null)
      setPollOptions(['', ''])
      setFile(null)
      setMediaError(null)
      setPhase('cta')
      setActiveKind('update')
      onPostCreated?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post.'
      // Surface upload rejections next to the attach control, general
      // failures under the Post button. Never swallow either.
      if (file && /image|file|upload|mb\b/i.test(message)) setMediaError(message)
      else setError(message)
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
      {phase === 'cta' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
          }}
        >
          <ComposerAvatar currentUser={currentUser} />
          <button
            type="button"
            onClick={() => setPhase('sheet')}
            style={{
              flex: 1,
              minHeight: 44,
              textAlign: 'left',
              background: 'var(--composer-textarea-bg)',
              border: '1px solid var(--composer-border)',
              color: 'var(--composer-pillar-label)',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 14,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Start a post
          </button>
          <button
            type="button"
            onClick={() => setPhase('sheet')}
            style={{
              minHeight: 44,
              padding: '10px 24px',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 13,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              background: 'var(--composer-post-btn-bg)',
              color: 'var(--composer-post-btn-text)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Post
          </button>
        </div>
      )}

      {phase === 'sheet' && (
        <div style={{ padding: '18px 20px' }} role="dialog" aria-label="Choose post type">
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--composer-pillar-label)',
            }}
          >
            What are you posting?
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {COMPOSER_TYPES.map(type => (
              <button
                key={type.kind}
                type="button"
                onClick={() => {
                  setActiveKind(type.kind)
                  setPhase('compose')
                }}
                style={{
                  minHeight: 48,
                  padding: '12px 14px',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 14,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  background: 'var(--composer-textarea-bg)',
                  color: 'var(--composer-textarea-text)',
                  border: '1px solid var(--composer-border)',
                  cursor: 'pointer',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPhase('cta')}
            style={{
              marginTop: 12,
              minHeight: 44,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--composer-pillar-label)',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Compose fields stay mounted so the CM-1 file input remains in the tree. */}
      <div hidden={phase !== 'compose'}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 20px 0',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--composer-tab-active)',
          }}
        >
          {activeTab.label}
        </p>
        <button
          type="button"
          onClick={() => setPhase('sheet')}
          style={{
            minHeight: 44,
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--composer-pillar-label)',
          }}
        >
          Change type
        </button>
      </div>
      <div style={{ display: 'flex', gap: 14, padding: '18px 20px' }}>
        <ComposerAvatar currentUser={currentUser} />

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

          {activeKind === 'poll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions]
                      next[i] = e.target.value
                      setPollOptions(next)
                    }}
                    placeholder={`Option ${i + 1}`}
                    maxLength={200}
                    disabled={aiLoading || isPosting}
                    style={{
                      flex: 1,
                      background: 'var(--composer-textarea-bg)',
                      border: '1px solid var(--composer-border)',
                      outline: 'none',
                      color: 'var(--composer-textarea-text)',
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: 13,
                      lineHeight: 1.4,
                      padding: '8px 10px',
                      borderRadius: 2,
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove option ${i + 1}`}
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      style={{
                        width: 28,
                        height: 28,
                        background: 'transparent',
                        border: '1px solid var(--composer-border)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        color: 'var(--composer-pillar-label)',
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 10px',
                    background: 'transparent',
                    border: `1px dashed ${TEAL}66`,
                    color: TEAL,
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  + Add option
                </button>
              )}
              {validPollOptionCount < 2 && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 12,
                    color: 'var(--composer-pillar-label)',
                  }}
                >
                  Add at least 2 options to post the poll.
                </p>
              )}
            </div>
          )}

          {/* CM-1 attach. Always mounted so the file input is in the DOM on
              every tab — disabled on Poll, which carries no media in v1. */}
          <MediaAttachControl
            file={file}
            onChange={setFile}
            error={mediaError}
            onError={setMediaError}
            disabled={aiLoading || isPosting || activeKind === 'poll'}
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
                  fontSize: 12,
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

      {/* Pillar tag row — same numbered circles as the feed PILLAR filter */}
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
        <PillarNumberBadgeStyles />
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--composer-pillar-label)',
          }}
        >
          Tag Pillar
        </span>

        <div className="pillar-number-badge-row" style={{ flex: '1 1 160px' }}>
          {PILLAR_NUMBERS.map(p => (
            <PillarNumberBadge
              key={p}
              n={p}
              selected={selectedPillar === p}
              onClick={() => setSelectedPillar(selectedPillar === p ? null : p)}
              ariaLabel={`Tag ${PILLAR_CONFIG[p].label}`}
              abbrev="always"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => { setAiOpen(o => !o); setAiError('') }}
          disabled={aiLoading || isPosting}
          aria-pressed={aiOpen}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 12,
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
    </div>
  )
}

function ComposerAvatar({
  currentUser,
}: {
  currentUser: ComposerProps['currentUser']
}) {
  return (
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
  )
}
