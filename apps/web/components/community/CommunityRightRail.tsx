'use client'

/**
 * Community engagement rail — sticky on desktop, compact strip on mobile.
 *
 * Order optimized for DAU:
 *  1. Active / upcoming poll (interaction)
 *  2. Latest podcast (content consumption)
 *  3. Academy continue learning (content)
 *  4. Evolution Partner (rotating, deduped)
 *  5. Weekly leaderboard (competition)
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { CommunityPollCard } from './CommunityPollCard'
import { WeeklyLeaderboardRail } from './WeeklyLeaderboardRail'
import { SponsorAdCard, type SponsorAd } from '@/components/home/HomeSponsorAd'
import type { WeeklyLeaderboardEntry } from '@/lib/community/types'

export type RailPodcastEpisode = {
  id: string
  title: string
  slug: string | null
  guest_name: string | null
  episode_number: number | null
}

export type RailAcademyContinue = {
  courseTitle: string
  courseSlug: string
  progressPct: number
  href: string
} | null

interface CommunityRightRailProps {
  weeklyLeaderboard: WeeklyLeaderboardEntry[]
  latestEpisode: RailPodcastEpisode | null
  academyContinue: RailAcademyContinue
  sponsors: SponsorAd[]
}

const cardShell: CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
}

function RailEyebrow({ children, accent }: { children: ReactNode; accent?: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: accent ?? 'var(--brand-red, #C9302A)',
      }}
    >
      {children}
    </p>
  )
}

function PodcastPromoCard({ episode }: { episode: RailPodcastEpisode | null }) {
  const href = episode?.slug ? `/podcast/${episode.slug}` : '/podcast'
  const epLabel =
    episode?.episode_number != null
      ? `Ep ${episode.episode_number}`
      : 'Latest episode'

  return (
    <section aria-label="Latest podcast episode" style={cardShell}>
      <div style={{ padding: '14px 14px 16px' }}>
        <RailEyebrow accent="var(--brand-gold, #C9A84C)">Podcast</RailEyebrow>
        {episode ? (
          <>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              {epLabel}
              {episode.guest_name ? ` · ${episode.guest_name}` : ''}
            </p>
            <h3
              style={{
                margin: '8px 0 0',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1.3,
                color: 'var(--text-primary)',
              }}
            >
              {episode.title}
            </h3>
          </>
        ) : (
          <h3
            style={{
              margin: '8px 0 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.3,
              color: 'var(--text-primary)',
            }}
          >
            The Evolved Pros Podcast
          </h3>
        )}
        <Link
          href={href}
          className="ep-pressable"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            minHeight: 40,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'var(--brand-red, #C9302A)',
            padding: '8px 12px',
            textDecoration: 'none',
          }}
        >
          {episode ? 'Listen now' : 'Browse episodes'}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

function AcademyPromoCard({ academyContinue }: { academyContinue: RailAcademyContinue }) {
  const href = academyContinue?.href ?? '/academy'
  const title = academyContinue?.courseTitle ?? 'The 6 Pillars'
  const pct = academyContinue?.progressPct

  return (
    <section aria-label="Continue learning" style={cardShell}>
      <div style={{ padding: '14px 14px 16px' }}>
        <RailEyebrow>Academy</RailEyebrow>
        <h3
          style={{
            margin: '8px 0 0',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 20,
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
          }}
        >
          Continue Learning
        </h3>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: '"Barlow", sans-serif',
            fontSize: 13,
            lineHeight: 1.45,
            color: 'var(--text-secondary)',
          }}
        >
          {academyContinue
            ? `Pick up ${title}${typeof pct === 'number' ? ` · ${pct}% complete` : ''}.`
            : 'Build the habits and systems of high performers across 6 pillars.'}
        </p>
        {typeof pct === 'number' && pct > 0 && (
          <div
            aria-hidden
            style={{
              marginTop: 12,
              height: 4,
              background: 'var(--border-color)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, pct))}%`,
                height: '100%',
                background: 'var(--brand-red, #C9302A)',
              }}
            />
          </div>
        )}
        <Link
          href={href}
          className="ep-pressable"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            minHeight: 40,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--brand-red, #C9302A)',
            border: '1px solid var(--brand-red, #C9302A)',
            padding: '8px 12px',
            textDecoration: 'none',
          }}
        >
          {academyContinue ? 'Resume course' : 'Enter Academy'}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

/** Rotating Evolution Partner — random start + interval cycle. */
function SponsorPromoCard({ sponsors }: { sponsors: SponsorAd[] }) {
  // Random start index after mount so SSR stays stable
  const [idx, setIdx] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (sponsors.length === 0) return
    setIdx(Math.floor(Math.random() * sponsors.length))
    setReady(true)
  }, [sponsors.length])

  useEffect(() => {
    if (sponsors.length <= 1) return
    const id = setInterval(() => {
      setIdx(i => (i + 1) % sponsors.length)
    }, 10_000)
    return () => clearInterval(id)
  }, [sponsors.length])

  if (sponsors.length === 0) return null
  const ad = sponsors[idx % sponsors.length]
  if (!ad) return null

  return (
    <section aria-label="Evolution Partner">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <RailEyebrow accent="var(--brand-gold, #C9A84C)">Sponsors</RailEyebrow>
        {sponsors.length > 1 && (
          <div style={{ display: 'flex', gap: 5 }} aria-hidden>
            {sponsors.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Show ${s.sponsor_name ?? 'partner'}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  minWidth: 8,
                  minHeight: 8,
                  background:
                    ready && i === idx % sponsors.length
                      ? 'var(--brand-red, #C9302A)'
                      : 'var(--border-color)',
                }}
              />
            ))}
          </div>
        )}
      </div>
      <SponsorAdCard ad={ad} />
    </section>
  )
}

/** Compact horizontal CTAs for mobile — non-intrusive, one-tap. */
function MobileEngagementStrip({
  latestEpisode,
  academyContinue,
}: {
  latestEpisode: RailPodcastEpisode | null
  academyContinue: RailAcademyContinue
}) {
  const chips: { href: string; label: string; sub: string; accent: string }[] = [
    {
      href: academyContinue?.href ?? '/academy',
      label: 'Learn',
      sub: academyContinue ? 'Continue' : 'Academy',
      accent: 'var(--brand-red, #C9302A)',
    },
    {
      href: '/home',
      label: 'Goals',
      sub: 'Scoreboard',
      accent: 'var(--brand-gold, #C9A84C)',
    },
    {
      href: latestEpisode?.slug ? `/podcast/${latestEpisode.slug}` : '/podcast',
      label: 'Listen',
      sub: latestEpisode ? 'Podcast' : 'Episodes',
      accent: 'var(--brand-teal, #0ABFA3)',
    },
  ]

  return (
    <div
      className="ep-scroll-x lg:hidden"
      style={{
        display: 'flex',
        gap: 8,
        paddingBottom: 2,
      }}
    >
      {chips.map(c => (
        <Link
          key={c.href + c.label}
          href={c.href}
          className="community-mobile-chip ep-pressable ep-touch-target"
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${c.accent}`,
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: c.accent,
            }}
          >
            {c.label}
          </span>
          <span
            style={{
              fontFamily: '"Barlow", sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {c.sub}
          </span>
        </Link>
      ))}
    </div>
  )
}

function StickyRailBody({
  weeklyLeaderboard,
  latestEpisode,
  academyContinue,
  sponsors,
}: CommunityRightRailProps) {
  return (
    <>
      <CommunityPollCard />
      <PodcastPromoCard episode={latestEpisode} />
      <AcademyPromoCard academyContinue={academyContinue} />
      <SponsorPromoCard sponsors={sponsors} />
      <WeeklyLeaderboardRail entries={weeklyLeaderboard} />
    </>
  )
}

export function CommunityRightRail(props: CommunityRightRailProps) {
  return (
    <>
      {/* Desktop sticky rail — sticks within .ep-main-scroll */}
      <aside
        className="hidden lg:block"
        style={{ minWidth: 0 }}
        aria-label="Community engagement"
      >
        <div
          className="community-sticky-rail"
          style={{
            position: 'sticky',
            /* main is the scrollport; topnav is outside it — small offset only */
            top: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxHeight: 'calc(100dvh - 96px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            paddingBottom: 32,
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <StickyRailBody {...props} />
        </div>
      </aside>
    </>
  )
}

/**
 * Mobile-only engagement — poll + chips; sponsors stay on desktop rail
 * to avoid double-serving the same partner cards in the feed.
 */
export function CommunityMobileEngagement({
  latestEpisode,
  academyContinue,
}: {
  latestEpisode: RailPodcastEpisode | null
  academyContinue: RailAcademyContinue
}) {
  return (
    <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CommunityPollCard />
      <MobileEngagementStrip
        latestEpisode={latestEpisode}
        academyContinue={academyContinue}
      />
    </div>
  )
}
