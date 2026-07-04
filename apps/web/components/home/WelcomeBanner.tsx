'use client'

// WELCOME-BANNER-V3 — mirrors design-reference/.../welcome-banner.jsx (894 lines).
// Cinematic time-of-day SkyScene backdrop + dramatic Playfair greeting +
// optional JustEarned callout + date/time/quarter strip + scoreboard row +
// THE ARCHITECTURE column. v2 prop shape preserved (transformed inline) so
// no page-level wiring change is needed.

import { useEffect, useMemo, useState } from 'react'
import { MarvelSkyScene, type MarvelScenePeriod } from './scenes/MarvelSkyScene'
import { PILLARS } from '@/lib/pillars'
import { formatPct } from '@/lib/format'
import { BRAND, AUTHOR_NAME } from '@/lib/brand'

// Hero attribution (A6.1): render the quote source canonically against the
// brand so we never double the brand token (`EVOLVED · EVOLVED`) and so the
// author always reads as one spelling (`George Leith`). Output is one of:
//   "EVOLVED"                  (source is the brand / "Evolved Pros")
//   "EVOLVED · George Leith"   (source names the author)
//   "EVOLVED · <other source>" (any other attribution)
function formatQuoteAttribution(source: string): string {
  const raw = source.trim()
  const lower = raw.toLowerCase()
  const isBrand = lower.startsWith('evolved')
  // Does the source name the author (in any of its prior spellings)?
  const namesAuthor = /george\s*lei|leith/i.test(lower)

  if (isBrand && namesAuthor) return `${BRAND} · ${AUTHOR_NAME}`
  if (isBrand) return BRAND
  if (namesAuthor) return `${BRAND} · ${AUTHOR_NAME}`
  return `${BRAND} · ${raw}`
}

// ── Public props (v2 shape kept; new fields optional) ──────────────────────

interface WelcomeBannerProps {
  displayName: string
  tier: string | null
  avatarUrl: string | null
  quote: { quote_text: string; source: string | null } | null
  scoreboard: {
    /** Posts the member authored (posts.author_id = public.users.id). */
    postCount: number
    /** Upcoming published events the member hasn't registered for yet. */
    upcomingEventCount: number
    /** Episodes the member has played (user_episode_progress rows). */
    podcastCount: number
    /** Comments the member left on stories (story_comments rows). */
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

// ── Architecture-column pillar palette (canonical, one hue per pillar) ──
// Desktop and mobile previously forked here (e.g. orange #D4862B vs the
// canonical #FFA538) — collapsed to a single source of truth matching the
// brand palette (colors_and_type.css / --pillar-N tokens). Labels are NOT
// defined here — pillar names/abbreviations come from the single `PILLARS`
// source (lib/pillars.ts) so the hero strip, the Path Forward stepper, and
// the lower progress bars never drift in name, order, or abbreviation.

const ARCH_COLORS: Record<1 | 2 | 3 | 4 | 5 | 6, { color: string; mobileColor: string }> = {
  1: { color: '#FFA538', mobileColor: '#FFA538' },
  2: { color: '#A78BFA', mobileColor: '#A78BFA' },
  3: { color: '#F87171', mobileColor: '#F87171' },
  4: { color: '#60A5FA', mobileColor: '#60A5FA' },
  5: { color: '#C9A84C', mobileColor: '#C9A84C' },
  6: { color: '#0ABFA3', mobileColor: '#0ABFA3' },
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
  full: string
  color: string
  earned: boolean
  progress: number
}

function PillarRow({ pillar }: { pillar: ArchPillar }) {
  const { earned, color, num, short, full, progress } = pillar
  const inProgress = !earned && progress > 0
  const size = 18
  const innerR = size / 2 - 1.5
  const circ = 2 * Math.PI * innerR
  const dash = (progress / 100) * circ

  return (
    <div className="arch-pillar-row" style={{ width: '100%' }}>
    <div className="arch-pillar-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 96 }}>
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
            : inProgress
              ? `radial-gradient(circle at 35% 30%, ${color}55, ${color}22)`
              : 'rgba(10,15,24,0.4)',
          border: earned
            ? `1.5px solid ${color}`
            : inProgress
              ? `1px solid ${color}99`
              : '1px solid rgba(255,255,255,0.18)',
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
            color: earned
              ? '#0A0F18'
              : inProgress
                ? color
                : 'rgba(255,255,255,0.4)',
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
          fontWeight: earned ? 700 : inProgress ? 600 : 500,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: earned
            ? '#fff'
            : inProgress
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(255,255,255,0.45)',
          flex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {short}
      </span>
    </div>

    {/* Mobile variant (<640px): full pillar name, larger type, platform-palette
        color dot. Hidden on desktop via the @media rule below; the desktop
        markup above is hidden in turn at mobile widths. */}
    <div
      className="arch-pillar-mobile"
      style={{
        display: 'none',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 4px',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          boxShadow: earned ? `0 0 6px ${color}99` : 'none',
          opacity: earned || inProgress ? 1 : 0.4,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: earned ? 700 : inProgress ? 600 : 500,
          fontSize: 13,
          letterSpacing: '0.04em',
          color: earned
            ? '#fff'
            : inProgress
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(255,255,255,0.6)',
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {full}
      </span>
      {inProgress && (
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 13,
            color: color,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {formatPct(progress / 100)}
        </span>
      )}
      {earned && (
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: color,
            flexShrink: 0,
          }}
        >
          Earned
        </span>
      )}
      {!earned && !inProgress && (
        <span
          aria-hidden="true"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 600,
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            flexShrink: 0,
          }}
        >
          Locked
        </span>
      )}
    </div>
    </div>
  )
}

// ── Score cell (from welcome-banner.jsx ScoreCell line 850) ────────────────

// A4.3: every stat renders the same anatomy — number + label + exactly one
// sub-line. The sub-line is a status when the stat has a value, or a CTA when
// it's empty (no bare "—" placeholder). The active-state treatment (lit accent
// bar + accent number/label) is driven by a single `active` rule decided in the
// banner, not by each cell's own value.
function ScoreCell({
  href,
  label,
  value,
  accent,
  last,
  active,
  subline,
  zeroHint,
}: {
  href: string
  label: string
  value: number
  accent: string
  last?: boolean
  /** True for the single stat the banner marks as active (soonest action). */
  active?: boolean
  /** Status sub-line shown when value > 0. */
  subline: string
  /** CTA sub-line shown when value === 0. */
  zeroHint: string
}) {
  const [hover, setHover] = useState(false)
  const lit = active || hover
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
          opacity: active ? 1 : hover ? 0.5 : 0,
          transition: 'opacity 120ms ease',
        }}
      />
      <span
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          letterSpacing: '0.04em',
          color: lit ? '#fff' : 'rgba(255,255,255,0.45)',
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
          color: lit ? accent : 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          marginTop: 3,
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: '0.04em',
          color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {value > 0 ? subline : zeroHint}
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
  // CRITICAL: `now` MUST stay null on first render (SSR + first client render)
  // so SSR and CSR produce byte-identical markup. Any Date-derived expression
  // below must gate on `now` — running `new Date()` at render scope produces
  // different output across the SSR/CSR boundary and fires React #425/#422.
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
  // Default 'evening' is the deterministic SSR/first-render value; the real
  // period only resolves after `now` is hydrated by the effect above.
  const period: MarvelScenePeriod = periodOverride ?? (now ? periodForHour(now.getHours()) : 'evening')
  const greet = GREETING_BY_PERIOD[period]

  // Year-countdown math — JSX line 552-559 (year-based, not quarter-based;
  // the Q label + bar both reflect year progress and quarter is just a label).
  // Everything below must be `now`-gated. Previously `let year = new Date()`
  // ran ungated at render scope; harmless most of the time but a #425 landmine
  // around year-boundary clock skew.
  const dateStr = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''
  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''
  const yearPct = now
    ? Math.min(
        100,
        Math.max(
          0,
          ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
            (new Date(now.getFullYear() + 1, 0, 1).getTime() -
              new Date(now.getFullYear(), 0, 1).getTime())) *
            100,
        ),
      )
    : 0
  const daysLeft = now
    ? Math.ceil((new Date(now.getFullYear() + 1, 0, 1).getTime() - now.getTime()) / 86400000)
    : 0
  const quarter = now ? Math.floor(now.getMonth() / 3) + 1 : 0
  const year = now ? now.getFullYear() : 0

  // Transform v2 pillar shape → architecture-column shape with locked colors.
  const archPillars: ArchPillar[] = useMemo(
    () =>
      PILLARS.map(({ n: num, name, abbr }) => {
        const src = pillars.find(p => p.number === num)
        const colors = ARCH_COLORS[num]
        const earned = src?.state === 'earned'
        const progress = src?.state === 'in-progress' ? src.progressPct ?? 0 : earned ? 100 : 0
        return { num, short: abbr, full: name, color: colors.color, mobileColor: colors.mobileColor, earned, progress }
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
    const colors = ARCH_COLORS[newest.number]
    const label = PILLARS.find(p => p.n === newest.number)?.name ?? newest.name
    return { num: newest.number, color: colors.color, label }
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

      {/* Mobile (<640px) responsive overrides — keeps the JSX otherwise
          identical to the design ref while preventing overflow at 390px:
          - tighter side padding,
          - avatar shrinks so name + quote get real width,
          - score cells wrap to a 2x2 grid instead of a 4-wide nowrap row,
          - architecture column gets full row beneath the scoreboard. */}
      {/* suppressHydrationWarning: SSR CSS minification strips `!important`
          declarations, while the client React tree keeps them as authored —
          producing a #425 on this <style> tag. Safe to suppress: style-tag
          contents are never user-visible text. */}
      <style suppressHydrationWarning>{`
        @media (max-width: 639px) {
          .welcome-banner-inner { padding: 20px 16px 16px !important; }
          .welcome-banner-top { gap: 16px !important; }
          .welcome-banner-avatar { width: 88px !important; height: 88px !important; }
          .welcome-banner-top h1 { font-size: 26px !important; }
          .welcome-banner-bottom { gap: 16px !important; margin-top: 20px !important; }
          .welcome-banner-daterow { gap: 8px !important; }
          .welcome-banner-right { width: 100%; gap: 16px !important; }
          .welcome-banner-right > div { width: 100%; }
          .welcome-banner-scoreboard { display: grid !important; grid-template-columns: 1fr 1fr; }
          .welcome-banner-scoreboard > a { min-width: 0 !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .welcome-banner-scoreboard > a:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.08); }
          .welcome-banner-scoreboard > a:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.08) !important; }
          .welcome-banner-scoreboard > a:nth-child(n+3) { border-bottom: none; }
          /* Architecture column — swap to full-width mobile rows */
          .welcome-banner-architecture { width: 100% !important; }
          .welcome-banner-architecture > a { width: 100% !important; align-items: stretch !important; padding: 4px 12px !important; gap: 0 !important; }
          .arch-pillar-desktop { display: none !important; }
          .arch-pillar-mobile { display: flex !important; }
          .arch-pillar-row + .arch-pillar-row { border-top: 1px solid rgba(255,255,255,0.06); }
        }
      `}</style>

      <div
        className="welcome-banner-inner"
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
        <div className="welcome-banner-top" style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
          {/* Avatar with chevron tier badge */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <div
                className="welcome-banner-avatar"
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
                className="welcome-banner-avatar"
                style={{
                  width: 128,
                  height: 128,
                  borderRadius: '50%',
                  background: 'var(--brand-red)',
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
            {/* suppressHydrationWarning: greet text is `now`-derived. SSR/first-
                client render both use the 'evening' default so they normally match,
                but route prerender + revalidate windows can produce a divergent
                "Good evening, " vs "Good morning, " when an older SSR payload is
                served to a browser whose local clock falls in a different period.
                Suppress to absorb that without flashing blank between effect ticks. */}
            <h1
              suppressHydrationWarning
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
                    — {formatQuoteAttribution(quote.source)}
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
          className="welcome-banner-bottom"
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
          <div
            className="welcome-banner-daterow"
            style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flexWrap: 'wrap' }}
          >
            <span
              suppressHydrationWarning
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
              suppressHydrationWarning
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
                suppressHydrationWarning
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
                  suppressHydrationWarning
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
                suppressHydrationWarning
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
          <div
            className="welcome-banner-right"
            style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', minWidth: 0 }}
          >
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
                Your scoreboard
              </span>
              <div
                className="welcome-banner-scoreboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'stretch',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(10,15,24,0.55)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {/* A4.3 active-state rule: a single stat is active — the one
                    with the soonest action. Events is the only time-bound stat
                    (an upcoming event has a date), so it's active whenever one
                    is scheduled; otherwise no stat is highlighted. */}
                <ScoreCell
                  href="/community"
                  label="Posts"
                  value={scoreboard.postCount}
                  accent="#A78BFA"
                  subline="Shared with the community"
                  zeroHint="Share an update"
                />
                <ScoreCell
                  href="/events"
                  label="Events"
                  value={scoreboard.upcomingEventCount}
                  accent="#0ABFA3"
                  active={scoreboard.upcomingEventCount > 0}
                  subline="Coming up soon"
                  zeroHint="Browse the calendar"
                />
                <ScoreCell
                  href="/podcast"
                  label="Podcast"
                  value={scoreboard.podcastCount}
                  accent="#60A5FA"
                  subline="Episodes you've played"
                  zeroHint="Listen to an episode"
                />
                <ScoreCell
                  href="/media"
                  label="Stories"
                  value={scoreboard.storyCount}
                  accent="#C9A84C"
                  subline="Comments on stories"
                  zeroHint="Read a story"
                  last
                />
              </div>
            </div>

            <div className="welcome-banner-architecture" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
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
