'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import type { Post } from '@/lib/community/types'

// Brief naming (UI-facing): fire/hundred/hands/heart/mindblown.
// Sprint 0 DB CHECK uses fire/hundred/clap/heart/mind — translation lives
// inside /api/posts/[postId]/react/route.ts and the GET /api/posts handler.
type Emoji = 'fire' | 'hundred' | 'hands' | 'heart' | 'mindblown'

const EMOJI_ORDER: Emoji[] = ['fire', 'hundred', 'hands', 'heart', 'mindblown']

const EMOJI_GLYPH: Record<Emoji, string> = {
  fire: '🔥',
  hundred: '💯',
  hands: '🙌',
  heart: '❤️',
  mindblown: '🤯',
}

// UI-HEART: render the heart with an SVG so its colour follows the
// `currentColor` token (gold #C9A84C when active, muted otherwise).
// Native ❤️ emoji ignores CSS color and stays red, which is why the
// button "looked red" even though the active text token is gold.
function HeartGlyph({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 1.4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

const EMOJI_VAR: Record<Emoji, { bg: string; color: string }> = {
  fire:      { bg: 'var(--reaction-fire-bg)',      color: 'var(--reaction-fire-color)' },
  hundred:   { bg: 'var(--reaction-hundred-bg)',   color: 'var(--reaction-hundred-color)' },
  hands:     { bg: 'var(--reaction-hands-bg)',     color: 'var(--reaction-hands-color)' },
  heart:     { bg: 'var(--reaction-heart-bg)',     color: 'var(--reaction-heart-color)' },
  mindblown: { bg: 'var(--reaction-mindblown-bg)', color: 'var(--reaction-mindblown-color)' },
}

const KIND_LABEL: Record<string, string> = {
  update: 'Update',
  question: 'Question',
  win: 'Win',
  poll: 'Poll',
  announce: 'Announce',
}

interface PostCardV2Props {
  post: Post
  currentUserId: string
  onCommentClick?: (postId: string) => void
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Defers Date.now() to client-only — avoids SSR/client mismatch (#425).
function ClientTimeAgo({ dateStr }: { dateStr: string }) {
  const [ago, setAgo] = useState('')
  useEffect(() => { setAgo(timeAgo(dateStr).toUpperCase()) }, [dateStr])
  return <>{ago}</>
}

// COMMUNITY-TIER-BADGE-FIX: subtle tinted-bg + bordered chips (not solid pills)
// to match the kind/pillar chip pattern used elsewhere in the editorial design.
// Heart-gold for PRO, brand red for VIP, transparent + gray border for MEMBER.
// DB stores 'community' for the base tier — display label is "MEMBER" per
// brief. null/undefined → no badge.
function tierBadgeStyle(tier: string | null | undefined): { bg: string; color: string; border: string; label: string } | null {
  const t = tier?.toLowerCase()
  if (t === 'pro') {
    return {
      bg:     'rgba(201,48,42,0.18)',
      color:  '#C9302A',
      border: 'rgba(201,48,42,0.40)',
      label:  'PRO',
    }
  }
  if (t === 'vip') {
    return {
      bg:     'rgba(201,168,76,0.18)',
      color:  '#C9A84C',
      border: 'rgba(201,168,76,0.40)',
      label:  'VIP',
    }
  }
  if (t === 'community' || t === 'member') {
    return {
      bg:     'transparent',
      color:  'var(--text-tertiary)',
      border: 'var(--text-tertiary)',
      label:  'MEMBER',
    }
  }
  return null
}

export function PostCardV2({ post, currentUserId: _currentUserId, onCommentClick }: PostCardV2Props) {
  // Seed counts from server-rendered reactions so first paint is accurate.
  const initialCounts = (() => {
    const c: Record<Emoji, number> = { fire: 0, hundred: 0, hands: 0, heart: 0, mindblown: 0 }
    for (const r of post.reactions ?? []) {
      if (r.type in c) c[r.type as Emoji] = r.count
    }
    return c
  })()

  const [counts, setCounts] = useState<Record<Emoji, number>>(initialCounts)
  const [myReaction, setMyReaction] = useState<Emoji | null>(
    EMOJI_ORDER.includes(post.myReaction as Emoji) ? (post.myReaction as Emoji) : null,
  )

  // UI-HEART: each entry is one confetti burst rendered inside the heart
  // button; cleared 700ms after fire so the DOM doesn't accumulate.
  const [bursts, setBursts] = useState<Array<{ id: number; particles: Array<{ dx: number; dy: number; rot: number; glyph: string }> }>>([])

  function fireHeartConfetti() {
    const id = Date.now() + Math.random()
    const glyphs = ['💛', '✦', '•', '💛', '✦', '•', '💛']
    const particles = Array.from({ length: 7 }, (_, i) => {
      // Spread roughly upward in a fan: -150° to -30° in screen space.
      const angle = (-150 + (i / 6) * 120 + (Math.random() - 0.5) * 18) * (Math.PI / 180)
      const dist = 28 + Math.random() * 16
      return {
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist),
        rot: Math.round((Math.random() - 0.5) * 240),
        glyph: glyphs[i],
      }
    })
    setBursts(prev => [...prev, { id, particles }])
    window.setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== id))
    }, 700)
  }

  const pillarNum = post.pillarTag ? parseInt(post.pillarTag.slice(1), 10) : null
  const pillarConf = pillarNum && pillarNum >= 1 && pillarNum <= 6 ? PILLAR_CONFIG[pillarNum] : null
  const tierBadge = tierBadgeStyle(post.author.tier)
  const kindLabel = KIND_LABEL[post.postType] ?? null

  async function handleReact(emoji: Emoji) {
    const prevCounts = { ...counts }
    const prevReaction = myReaction
    const isToggleOff = myReaction === emoji

    // Optimistic update.
    const next = { ...counts }
    if (prevReaction) next[prevReaction] = Math.max(0, next[prevReaction] - 1)
    if (!isToggleOff) next[emoji] = (next[emoji] ?? 0) + 1
    setCounts(next)
    setMyReaction(isToggleOff ? null : emoji)

    // UI-HEART: fire confetti only when toggling the heart ON.
    if (emoji === 'heart' && !isToggleOff) fireHeartConfetti()

    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: isToggleOff ? 'DELETE' : 'POST',
        headers: isToggleOff ? undefined : { 'Content-Type': 'application/json' },
        body: isToggleOff ? undefined : JSON.stringify({ emoji }),
      })
      if (!res.ok) throw new Error('react failed')
      const data = await res.json() as { ok: boolean; counts: Record<Emoji, number> }
      if (data.counts) setCounts(data.counts)
    } catch {
      // Rollback.
      setCounts(prevCounts)
      setMyReaction(prevReaction)
    }
  }

  return (
    <article
      style={{
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 0,
        borderBottom: '1px solid var(--border-color)',
        padding: 24,
      }}
    >
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid var(--border-color)',
            background: '#1A2332',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={`${post.author.displayName} avatar`}
              width={40}
              height={40}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 13,
                color: '#FFFFFF',
              }}
            >
              {getInitials(post.author.displayName)}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 18,
                letterSpacing: '0.01em',
                color: 'var(--text-primary)',
              }}
            >
              {post.author.displayName}
            </span>
            {tierBadge && (
              <span
                style={{
                  padding: '4px 8px',
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  background: tierBadge.bg,
                  color: tierBadge.color,
                  border: `1px solid ${tierBadge.border}`,
                }}
              >
                {tierBadge.label}
              </span>
            )}
            <span
              style={{
                fontFamily: '"Barlow", sans-serif',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
              }}
              suppressHydrationWarning
            >
              <ClientTimeAgo dateStr={post.createdAt} />
            </span>
          </div>
        </div>

        {kindLabel && (
          <span
            style={{
              padding: '4px 10px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            {kindLabel}
          </span>
        )}
      </header>

      {/* Body */}
      <p
        style={{
          margin: '16px 0 0',
          fontFamily: '"Barlow", sans-serif',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {post.body}
      </p>

      {/* Pillar tag */}
      {pillarConf && pillarNum && (
        <div style={{ marginTop: 12 }}>
          <span
            style={{
              padding: '4px 10px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: `${pillarConf.color}1A`,
              color: pillarConf.color,
              border: `1px solid ${pillarConf.color}55`,
            }}
          >
            {pillarConf.label}
          </span>
        </div>
      )}

      {/* Reaction row */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {EMOJI_ORDER.map(emoji => {
          const active = myReaction === emoji
          const count = counts[emoji] ?? 0
          const v = EMOJI_VAR[emoji]
          const isHeart = emoji === 'heart'
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReact(emoji)}
              aria-pressed={active}
              aria-label={`React with ${emoji}`}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: active ? v.bg : 'transparent',
                border: `1px solid ${active ? v.color : 'transparent'}`,
                color: active ? v.color : 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 0,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = v.bg
                  e.currentTarget.style.color = v.color
                  e.currentTarget.style.borderColor = `${v.color}55`
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, display: 'inline-flex' }} aria-hidden="true">
                {isHeart ? <HeartGlyph active={active} /> : EMOJI_GLYPH[emoji]}
              </span>
              {count > 0 && <span>{formatCount(count)}</span>}
              {isHeart && bursts.length > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                  }}
                >
                  {bursts.flatMap(b =>
                    b.particles.map((p, i) => (
                      <span
                        key={`${b.id}-${i}`}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          fontSize: 11,
                          lineHeight: 1,
                          color: '#C9A84C',
                          willChange: 'transform, opacity',
                          animation: 'ui-heart-confetti 600ms ease-out forwards',
                          // Custom props consumed by the keyframe.
                          ['--dx' as string]: `${p.dx}px`,
                          ['--dy' as string]: `${p.dy}px`,
                          ['--rot' as string]: `${p.rot}deg`,
                        } as React.CSSProperties}
                      >
                        {p.glyph}
                      </span>
                    )),
                  )}
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onCommentClick?.(post.id)}
          aria-label="Comments"
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.replyCount > 0 && <span>{formatCount(post.replyCount)}</span>}
        </button>
      </div>
    </article>
  )
}
