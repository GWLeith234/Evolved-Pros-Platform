// HOME-4UP-TILES: ports CommunityPulseCard from home-tiles.jsx (lines 87-243).
// 3 most-recent posts (avatar / author / pillar dot / age / preview /
// reaction count + comment count) + a pinned upcoming event with RSVP
// affordance + bottom link to /community.
//
// 'use client' — RSVP toggle uses optimistic local state.

'use client'

import { useState } from 'react'
import { TileCard } from './TileCard'
import { TileRow, TileFooterLink } from './TileRow'

const ACCENT = 'var(--tile-community)'

export interface PulsePost {
  id: string
  authorName: string
  initials: string
  tier: 'pro' | 'vip' | 'community' | string | null
  pillarColor: string | null
  age: string
  preview: string
  reactionCount: number
  commentCount: number
}

export interface PulseEvent {
  id: string
  title: string
  /** Short day label, e.g. "TODAY" / "TMRW" / "FRI". */
  dayLabel: string
  /** Time string, e.g. "11:00 AM PT". */
  timeLabel: string
  attendingCount: number
  initiallyRsvpd?: boolean
}

interface CommunityPulseTileProps {
  posts: PulsePost[]
  pinnedEvent: PulseEvent | null
}

function tierGradient(tier: string | null | undefined): string {
  const t = tier?.toLowerCase()
  if (t === 'pro') return 'linear-gradient(135deg, #C9302A, #8a1f1c)'
  if (t === 'vip') return 'linear-gradient(135deg, #C9A84C, #8b7332)'
  return 'linear-gradient(135deg, #60A5FA, #3a73c8)'
}

export function CommunityPulseTile({ posts, pinnedEvent }: CommunityPulseTileProps) {
  const [event, setEvent] = useState(pinnedEvent)
  const [rsvpInFlight, setRsvpInFlight] = useState(false)

  const newCount = posts.length

  async function toggleRsvp() {
    if (!event || rsvpInFlight) return
    const wasRsvpd = event.initiallyRsvpd ?? false
    setRsvpInFlight(true)
    setEvent({
      ...event,
      initiallyRsvpd: !wasRsvpd,
      attendingCount: event.attendingCount + (wasRsvpd ? -1 : 1),
    })
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: wasRsvpd ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error('rsvp failed')
    } catch {
      // Rollback
      setEvent(prev => prev && {
        ...prev,
        initiallyRsvpd: wasRsvpd,
        attendingCount: prev.attendingCount + (wasRsvpd ? 1 : -1),
      })
    } finally {
      setRsvpInFlight(false)
    }
  }

  const bottomLink = <TileFooterLink href="/community">All posts</TileFooterLink>

  return (
    <TileCard
      accent={ACCENT}
      eyebrow="Community"
      title="Community Pulse"
      newCount={newCount}
      footer={bottomLink}
    >
      {posts.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow", sans-serif',
              fontSize: 12,
              color: 'var(--text-tertiary)',
            }}
          >
            No posts yet — be the first to share.
          </p>
        </div>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: '0 16px',
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {posts.map((p, i) => (
            <TileRow
              key={p.id}
              isFirst={i === 0}
              leading={
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: tierGradient(p.tier),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: '0.04em',
                    color: '#0A0F18',
                  }}
                >
                  {p.initials}
                </div>
              }
              primary={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.authorName}
                  </span>
                  {p.pillarColor && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: p.pillarColor,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {/* TODO(format): route relative time through lib/format.ts */}
                    {p.age}
                  </span>
                </div>
              }
              meta={
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Barlow", sans-serif',
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: 'var(--text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.preview}
                </p>
              }
              trailing={
                // TODO(format): route reaction/comment counts through lib/format.ts
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {p.reactionCount}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {p.commentCount}
                  </span>
                </div>
              }
            />
          ))}
        </ul>
      )}

      {/* Inline event w/ RSVP */}
      {event && (
        <div
          style={{
            marginTop: 'auto',
            padding: '10px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              flexShrink: 0,
              textAlign: 'center',
              padding: '4px 0',
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.3)',
            }}
          >
            <div
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 8,
                letterSpacing: '0.18em',
                color: ACCENT,
                textTransform: 'uppercase',
              }}
            >
              Live
            </div>
            <div
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {event.dayLabel}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: '"Barlow", sans-serif',
                fontSize: 11.5,
                color: 'var(--text-primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event.title}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              {event.timeLabel} · {event.attendingCount} going
            </p>
          </div>
          <button
            type="button"
            onClick={toggleRsvp}
            disabled={rsvpInFlight}
            style={{
              padding: '6px 12px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: event.initiallyRsvpd ? ACCENT : 'transparent',
              color: event.initiallyRsvpd ? '#0A0F18' : ACCENT,
              border: `1px solid ${ACCENT}`,
              cursor: rsvpInFlight ? 'wait' : 'pointer',
              transition: 'all 120ms ease',
              flexShrink: 0,
            }}
          >
            {event.initiallyRsvpd ? '✓ Going' : 'RSVP'}
          </button>
        </div>
      )}
    </TileCard>
  )
}
