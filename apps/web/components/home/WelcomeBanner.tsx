'use client'

import { useState, useEffect } from 'react'

interface WelcomeBannerProps {
  displayName: string
  tier: string | null
  avatarUrl: string | null
  quote: { quote_text: string; source: string | null } | null
  scoreboard: {
    unreadPostCount: number
    upcomingEventCount: number
    podcastCount: number
    storyCount: number
  }
  pillars: Array<{
    number: 1 | 2 | 3 | 4 | 5 | 6
    name: string
    state: 'earned' | 'in-progress' | 'locked'
    progressPct?: number
  }>
}

const PILLAR_HEX: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: '#FFA538',
  2: '#A78BFA',
  3: '#F87171',
  4: '#60A5FA',
  5: '#C9A84C',
  6: '#0ABFA3',
}

type Greeting = 'GOOD MORNING' | 'GOOD AFTERNOON' | 'GOOD EVENING' | 'STILL UP'

function greetingForHour(h: number): Greeting {
  if (h >= 5 && h < 12) return 'GOOD MORNING'
  if (h >= 12 && h < 17) return 'GOOD AFTERNOON'
  if (h >= 17 && h < 22) return 'GOOD EVENING'
  return 'STILL UP'
}

function greetingPhrase(g: Greeting): string {
  if (g === 'GOOD MORNING') return 'Good morning,'
  if (g === 'GOOD AFTERNOON') return 'Good afternoon,'
  if (g === 'GOOD EVENING') return 'Good evening,'
  return 'Still up,'
}

function tierStyle(tier: string | null): { bg: string; color: string; border: string; label: string } {
  const t = tier?.toLowerCase()
  if (t === 'pro') return { bg: '#C9A84C', color: '#0A0F18', border: 'transparent', label: 'PRO' }
  if (t === 'vip') return { bg: '#ef0e30', color: '#FFFFFF', border: 'transparent', label: 'VIP' }
  return {
    bg: 'transparent',
    color: 'var(--banner-text-muted)',
    border: 'var(--banner-pillar-border)',
    label: 'MEMBER',
  }
}

function ChipDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

export function WelcomeBanner({
  displayName,
  tier,
  avatarUrl: _avatarUrl,
  quote,
  scoreboard,
  pillars,
}: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState<Greeting | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 720px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const ts = tierStyle(tier)
  const earnedCount = pillars.filter(p => p.state === 'earned').length

  const chips = [
    { key: 'posts', label: 'Posts', dot: '#ef0e30', count: scoreboard.unreadPostCount },
    { key: 'events', label: 'Events', dot: '#C9A84C', count: scoreboard.upcomingEventCount },
    { key: 'podcasts', label: 'Podcasts', dot: '#A78BFA', count: scoreboard.podcastCount },
    { key: 'stories', label: 'Stories', dot: '#0ABFA3', count: scoreboard.storyCount },
  ].filter(c => c.count > 0)

  const eyebrow = greeting ?? 'WELCOME'
  const phrase = greeting ? greetingPhrase(greeting) : 'Welcome,'

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: 320,
        background:
          'linear-gradient(135deg, var(--banner-bg) 0%, var(--banner-bg-end) 100%)',
        padding: isMobile ? 24 : 32,
        border: '1px solid var(--banner-pillar-border)',
        borderRadius: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 24 : 32,
          width: '100%',
        }}
      >
        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 600,
              fontSize: 11,
              color: 'var(--banner-eyebrow)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {eyebrow}
          </p>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 28,
              color: 'var(--banner-text-dim)',
              margin: '4px 0 0 0',
              lineHeight: 1.2,
            }}
          >
            {phrase}
          </p>
          <h1
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 64,
              color: 'var(--banner-text)',
              letterSpacing: '0.02em',
              margin: '4px 0 0 0',
              lineHeight: 1.0,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span>{displayName}</span>
            <span
              style={{
                marginLeft: 12,
                padding: '4px 10px',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: ts.bg,
                color: ts.color,
                border: ts.border === 'transparent' ? 'none' : `1px solid ${ts.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1.2,
              }}
            >
              {ts.label}
            </span>
          </h1>

          {quote && (
            <div style={{ marginTop: 14, maxWidth: 600 }}>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--banner-quote)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                &ldquo;{quote.quote_text}&rdquo;
              </p>
              <p
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  color: 'var(--banner-attribution)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  margin: '6px 0 0 0',
                }}
              >
                {quote.source ? `— EVOLVED · ${quote.source}` : '— EVOLVED'}
              </p>
            </div>
          )}

          {chips.length > 0 && (
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {chips.map(c => (
                <div
                  key={c.key}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--banner-pillar-bg)',
                    border: '1px solid var(--banner-pillar-border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ChipDot color={c.dot} />
                  <span
                    style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: 16,
                      color: 'var(--banner-text)',
                      lineHeight: 1,
                    }}
                  >
                    {c.count}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 9,
                      color: 'var(--banner-text-muted)',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Mobile pillar pip strip */}
          {isMobile && (
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
              }}
            >
              {pillars.map(p => {
                const opacity = p.state === 'earned' ? 1.0 : p.state === 'in-progress' ? 0.5 : 0.2
                return (
                  <span
                    key={p.number}
                    aria-label={`Pillar ${p.number} ${p.name} ${p.state}`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: PILLAR_HEX[p.number],
                      opacity,
                      display: 'inline-block',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT (desktop only) */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 600,
                  fontSize: 9,
                  color: 'var(--banner-eyebrow)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                Your Pillars
              </span>
              <span
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 14,
                  color: 'var(--banner-text)',
                  lineHeight: 1,
                }}
              >
                {earnedCount} / 6
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {pillars.map(p => {
                const color = PILLAR_HEX[p.number]
                return (
                  <div
                    key={p.number}
                    style={{
                      height: 38,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        background: `${color}1A`,
                        border: `1px solid ${color}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 14,
                        color,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {p.number}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontSize: 11,
                        color: 'var(--banner-text-dim)',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </span>
                    <div
                      style={{
                        width: 60,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                      }}
                    >
                      {p.state === 'earned' && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path
                            d="M2 7.5 L5.5 11 L12 3.5"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {p.state === 'in-progress' && (
                        <div
                          style={{
                            width: 60,
                            height: 4,
                            background: 'var(--banner-pillar-bg)',
                            border: '1px solid var(--banner-pillar-border)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, p.progressPct ?? 0))}%`,
                              height: '100%',
                              background: color,
                            }}
                          />
                        </div>
                      )}
                      {p.state === 'locked' && (
                        <span
                          style={{
                            fontFamily: '"Barlow Condensed", sans-serif',
                            fontWeight: 600,
                            fontSize: 9,
                            color: 'var(--banner-text-muted)',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WelcomeBanner
