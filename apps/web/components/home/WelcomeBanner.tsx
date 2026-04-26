'use client'

// WELCOME-BANNER-V3 — mirrors design-reference/.../welcome-banner.jsx (894 lines).
// Cinematic time-of-day SkyScene backdrop + dramatic Playfair greeting +
// optional JustEarned callout + date/time/quarter strip + scoreboard row +
// THE ARCHITECTURE column. v2 prop shape preserved (transformed inline) so
// no page-level wiring change is needed.

import { useEffect, useMemo, useState } from 'react'
import { MarvelSkyScene, type MarvelScenePeriod } from './scenes/MarvelSkyScene'

// ── Public props (v2 shape kept; new fields optional) ──────────────────────

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
    earnedAt?: string | null
  }>
  /** Optional override for testing — when omitted, period auto-detects from local time. */
  period?: MarvelScenePeriod
  /** Optional override for testing — when omitted, uses live ticking clock. */
  now?: Date
}

// ── Architecture-column pillar palette (from welcome-banner.jsx DEFAULT_PILLARS) ──
// These are the JSX's locked accent colors for the Architecture column. They
// differ slightly from the project's PILLAR_CONFIG (e.g. orange #D4862B vs
// #FFA538). Kept in sync with the JSX so the hero matches the design ref.

const ARCH_PILLARS: Record<1 | 2 | 3 | 4 | 5 | 6, { short: string; color: string; label: string }> = {
  1: { short: 'Foundtn.', color: '#D4862B', label: 'Foundation' },
  2: { short: 'Identity', color: '#A86CFF', label: 'Identity' },
  3: { short: 'Mental',   color: '#ef0e30', label: 'Mental Toughness' },
  4: { short: 'Strategy', color: '#3FB8E8', label: 'Strategy' },
  5: { short: 'Account.', color: '#E8B547', label: 'Accountability' },
  6: { short: 'Exec.',    color: '#19C9A6', label: 'Execution' },
}

// Tier colors from welcome-banner.jsx (line 187-191).
const TIER_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pro:       { bg: '#C9A84C', fg: '#0A0F18', label: 'Pro' },
  vip:       { bg: '#0ABFA3', fg: '#0A0F18', label: 'VIP' },
  community: { bg: '#60A5FA', fg: '#0A0F18', label: 'Community' },
}

// Greeting copy by period (from welcome-banner.jsx line 514-521).
const GREETING_BY_PERIOD: Record<MarvelScenePeriod, string> = {
  'early-morning': 'Early start, ',
  'mid-morning':   'Good morning, ',
  'midday':        'Good afternoon, ',
  'early-evening': 'Good evening, ',
  'evening':       'Good evening, ',
  'night':         'Burning the midnight oil, ',
}

// Auto-period detection — maps local hour to one of the six MarvelScenePeriod values.
// Mirrors the brief's intended thresholds, mapped onto the JSX's period names.
function periodForHour(h: number): MarvelScenePeriod {
  if (h >= 5  && h < 7)  return 'early-morning'
  if (h >= 7  && h < 11) return 'mid-morning'
  if (h >= 11 && h < 14) return 'midday'
  if (h >= 14 && h < 17) return 'early-evening'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// ── Tier badge (chevron variant — JSX default per welcome-app.jsx:42) ──────

function TierBadge({ tier }: { tier: string }) {
  const c = TIER_COLORS[tier.toLowerCase()] ?? TIER_COLORS.community
  return (
    <div
      style={{
        position: 'absolute',
        bottom: -6,
        left: -2,
        background: c.bg,
        color: c.fg,
        padding: '4px 14px 4px 10px',
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </div>
  )
}

// ── Architecture-column pillar row (from welcome-banner.jsx PillarRow line 433) ──

interface ArchPillar {
  num: 1 | 2 | 3 | 4 | 5 | 6
  short: string
  color: string
  earned: boolean
  progress: number
}

function PillarRow({ pillar }: { pillar: ArchPillar }) {
  const { earned, color, num, short, progress } = pillar
  const size = 18
  const innerR = size / 2 - 1.5
  const circ = 2 * Math.PI * innerR
  const dash = (progress / 100) * circ

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 96 }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: earned
            ? `radial-gradient(circle at 35% 30%, ${color}, ${color}99)`
            : 'rgba(10,15,24,0.4)',
          border: earned ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.18)',
          boxShadow: earned ? `0 0 6px ${color}55` : 'none',
          flexShrink: 0,
        }}
      >
        {!earned && progress > 0 && (
          <svg
            style={{ position: 'absolute', inset: -1, transform: 'rotate(-90deg)' }}
            width={size + 2}
            height={size + 2}
          >
            <circle
              cx={(size + 2) / 2}
              cy={(size + 2) / 2}
              r={innerR + 0.5}
              fill="none"
              stroke={color}
              strokeOpacity="0.85"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
        )}
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 10,
            color: earned ? '#0A0F18' : 'rgba(255,255,255,0.4)',
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          {num}
        </span>
        {earned && (
          <span
            style={{
              position: 'absolute',
              top: -1,
              right: -1,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: `0 0 4px ${color}`,
              animation: `pillarSparkle ${2 + (num % 3) * 0.4}s ease-in-out ${num * 0.2}s infinite`,
            }}
          />
        )}
      </div>
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: earned ? 700 : 500,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: earned ? '#fff' : 'rgba(255,255,255,0.45)',
          flex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {short}
      </span>
    </div>
  )
}

// ── Score cell (from welcome-banner.jsx ScoreCell line 850) ────────────────

function ScoreCell({
  href,
  label,
  value,
  accent,
  last,
}: {
  href: string
  label: string
  value: number
  accent: string
  last?: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 20px',
        minWidth: 84,
        textDecoration: 'none',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.08)',
        background: hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 120ms ease',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 2,
          background: accent,
          opacity: value > 0 ? 1 : hover ? 0.5 : 0,
          transition: 'opacity 120ms ease',
        }}
      />
      <span
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          letterSpacing: '0.04em',
          color: value > 0 ? '#fff' : 'rgba(255,255,255,0.45)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span
        style={{
          marginTop: 4,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: value > 0 ? accent : 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </span>
    </a>
  )
}

// ── Banner ─────────────────────────────────────────────────────────────────

export function WelcomeBanner({
  displayName,
  tier,
  avatarUrl,
  quote,
  scoreboard,
  pillars,
  period: periodOverride,
  now: nowOverride,
}: WelcomeBannerProps) {
  // Live clock — ticks every 30 seconds (matches JSX line 548).
  const [now, setNow] = useState<Date | null>(() => nowOverride ?? null)
  useEffect(() => {
    if (nowOverride) {
      setNow(nowOverride)
      return
    }
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30 * 1000)
    return () => clearInterval(id)
  }, [nowOverride])

  // Auto-period from local time, or override if provided.
  const period: MarvelScenePeriod = periodOverride ?? (now ? periodForHour(now.getHours()) : 'evening')
  const greet = GREETING_BY_PERIOD[period]

  // Year-countdown math — JSX line 552-559 (year-based, not quarter-based;
  // the Q label + bar both reflect year progress and quarter is just a label).
  const dateStr = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''
  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''
  let yearPct = 0
  let daysLeft = 0
  let quarter = 1
  let year = new Date().getFullYear()
  if (now) {
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime()
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime()
    const totalMs = yearEnd - yearStart
    const elapsedMs = now.getTime() - yearStart
    yearPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
    daysLeft = Math.ceil((yearEnd - now.getTime()) / 86400000)
    quarter = Math.floor(now.getMonth() / 3) + 1
    year = now.getFullYear()
  }

  // Transform v2 pillar shape → architecture-column shape with locked colors.
  const archPillars: ArchPillar[] = useMemo(
    () =>
      ([1, 2, 3, 4, 5, 6] as const).map(num => {
        const src = pillars.find(p => p.number === num)
        const conf = ARCH_PILLARS[num]
        const earned = src?.state === 'earned'
        const progress = src?.state === 'in-progress' ? src.progressPct ?? 0 : earned ? 100 : 0
        return { num, short: conf.short, color: conf.color, earned, progress }
      }),
    [pillars],
  )

  // Most-recent acquisition (within 7 days) → JustEarned callout.
  // Only fires if the page passes earnedAt timestamps (v2 page.tsx doesn't
  // currently pass them, so this is silently null today; ready when wired).
  const recentEarn = useMemo(() => {
    if (!now) return null
    const earned = pillars.filter(p => p.state === 'earned' && p.earnedAt)
    if (!earned.length) return null
    const sorted = [...earned].sort(
      (a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime(),
    )
    const newest = sorted[0]
    const ageDays = (now.getTime() - new Date(newest.earnedAt!).getTime()) / 86400000
    if (ageDays >= 7) return null
    const conf = ARCH_PILLARS[newest.number]
    return { num: newest.number, color: conf.color, label: conf.label }
  }, [pillars, now])

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 260,
        background: '#0A0F18',
      }}
    >
      <MarvelSkyScene period={period} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 36px 24px',
          minHeight: 260,
        }}
      >
        {/* Top row: avatar + greeting + quote */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
          {/* Avatar with chevron tier badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <div
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: '0 0 0 3px rgba(255,255,255,0.18), 0 0 0 5px rgba(0,0,0,0.4)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: '50%',
                  background: '#ef0e30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 3px rgba(255,255,255,0.18), 0 0 0 5px rgba(0,0,0,0.4)',
                }}
              >
                <span
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 900,
                    fontSize: 56,
                    color: '#fff',
                    letterSpacing: '0.02em',
                  }}
                >
                  {displayName?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
            {tier && <TierBadge tier={tier} />}
          </div>

          {/* Greeting + quote */}
          <div style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: 38,
                lineHeight: 1.1,
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              {greet}
              {displayName}.
            </h1>
            {quote && (
              <div style={{ marginTop: 12, maxWidth: 560 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'rgba(255,255,255,0.82)',
                  }}
                >
                  &ldquo;{quote.quote_text}&rdquo;
                </p>
                {quote.source && (
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#C9A84C',
                    }}
                  >
                    — Evolved · {quote.source}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* JustEarned callout — fires when newest earn < 7 days */}
        {recentEarn && (
          <a
            href="/profile/me/badges"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              alignSelf: 'flex-start',
              marginTop: 14,
              padding: '6px 14px 6px 8px',
              background: `${recentEarn.color}1F`,
              border: `1px solid ${recentEarn.color}66`,
              textDecoration: 'none',
              animation: 'earnedPulse 2.6s ease-in-out infinite',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, ${recentEarn.color}, ${recentEarn.color}aa)`,
                border: `1.5px solid ${recentEarn.color}`,
                boxShadow: `0 0 10px ${recentEarn.color}99`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 12,
                color: '#0A0F18',
                flexShrink: 0,
              }}
            >
              {recentEarn.num}
            </span>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.85)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: recentEarn.color, fontWeight: 800 }}>Just earned</span>
              {' · '}
              {recentEarn.label}
            </span>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: recentEarn.color,
                borderLeft: `1px solid ${recentEarn.color}55`,
                paddingLeft: 10,
              }}
            >
              View →
            </span>
          </a>
        )}

        {/* Bottom row: date · time · year countdown  +  scoreboard + architecture */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: date · time · year countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.92)',
                whiteSpace: 'nowrap',
              }}
            >
              {dateStr}
            </span>
            <span
              style={{
                width: 1,
                height: 14,
                background: 'rgba(255,255,255,0.18)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {timeStr}
            </span>
            <span
              style={{
                width: 1,
                height: 14,
                background: 'rgba(255,255,255,0.18)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 10px',
                border: '1px solid rgba(201,168,76,0.35)',
                background: 'rgba(201,168,76,0.08)',
              }}
            >
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#C9A84C',
                  whiteSpace: 'nowrap',
                }}
              >
                Q{quarter} · {year}
              </span>
              <span
                style={{
                  width: 64,
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${yearPct}%`,
                    background: '#C9A84C',
                  }}
                />
              </span>
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: '#fff',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {daysLeft}d left
              </span>
            </div>
          </div>

          {/* Right: scoreboard + architecture column */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 6,
                  paddingRight: 2,
                }}
              >
                This week
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'stretch',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(10,15,24,0.55)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <ScoreCell
                  href="/community"
                  label="Posts"
                  value={scoreboard.unreadPostCount}
                  accent="#A78BFA"
                />
                <ScoreCell
                  href="/events"
                  label="Events"
                  value={scoreboard.upcomingEventCount}
                  accent="#0ABFA3"
                />
                <ScoreCell
                  href="/podcast"
                  label="Podcast"
                  value={scoreboard.podcastCount}
                  accent="#60A5FA"
                />
                <ScoreCell
                  href="/media"
                  label="Stories"
                  value={scoreboard.storyCount}
                  accent="#C9A84C"
                  last
                />
              </div>
            </div>

            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 6,
                  paddingLeft: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                The Architecture
              </span>
              <a
                href="/academy"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(10,15,24,0.55)',
                  backdropFilter: 'blur(6px)',
                  textDecoration: 'none',
                }}
              >
                {archPillars.map(p => (
                  <PillarRow key={p.num} pillar={p} />
                ))}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeBanner
