'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { sortEpisodesNewest } from '@/lib/podcast/transforms'
import { PodcastFilterPills, type FilterKey, type SortKey } from './PodcastFilterPills'
import { PodcastCoverCard } from './PodcastCoverCard'
import { RotatingSponsorCard } from './PodcastSponsorCard'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'

/** One rotating sponsor card after every Nth episode (album-cover ratio 3:1). */
const AD_EVERY_N = 3

interface PodcastGridProps {
  episodes: PodcastEpisode[]
  /** Shown as a single card when the active filter returns nothing. */
  fallbackEpisode?: PodcastEpisode
  /** Up to 2 Evolution Partner ads to interleave between episode cards. */
  sponsorAds?: SponsorAd[]
}

export function PodcastGrid({ episodes, fallbackEpisode, sponsorAds = [] }: PodcastGridProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let list = filter === 'all' ? episodes : episodes.filter(e => e.pillar === filter)
    // Newest uses the shared deterministic comparator (date desc, then episode
    // number desc) so same-day episodes hold a stable order (PODCAST-CLEANUP S6).
    if (sort === 'newest') list = sortEpisodesNewest(list)
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.releasedAt).getTime() - new Date(b.releasedAt).getTime() || a.episode - b.episode)
    if (sort === 'longest') list = [...list].sort((a, b) => b.duration - a.duration)
    return list
  }, [episodes, filter, sort])

  // Interleave one album-cover-sized sponsor unit after every 3rd episode.
  // Each slot is a single grid cell (same footprint as an episode tile) that
  // rotates through the full active/in-date pool, honoring rotation_interval.
  // Slots are staggered so adjacent cards don't show the same partner, and the
  // rotation self-cycles so a short pool never leaves a gap.
  const gridChildren = useMemo(() => {
    const nodes: ReactNode[] = []
    let slot = 0
    filtered.forEach((ep, i) => {
      nodes.push(<PodcastCoverCard key={ep.id} episode={ep} />)
      // After every 3rd episode (1-based), drop in a rotating sponsor cell.
      if (sponsorAds.length > 0 && (i + 1) % AD_EVERY_N === 0) {
        const startIndex = slot++
        nodes.push(
          <div key={`sponsor-slot-${startIndex}`} className="podcast-sponsor-slot">
            <RotatingSponsorCard pool={sponsorAds} startIndex={startIndex} />
          </div>,
        )
      }
    })
    return nodes
  }, [filtered, sponsorAds])

  // Headline count excludes the pilot — it carries a PILOT chip, not a number,
  // so "5 episodes + pilot" reads true (PODCAST-CLEANUP S6).
  const numberedCount = filtered.filter(e => e.episode > 0).length
  const pilotCount = filtered.length - numberedCount
  const countLabel =
    `${numberedCount} ${numberedCount === 1 ? 'episode' : 'episodes'}` +
    (pilotCount > 0 ? ' + pilot' : '')

  return (
    <section
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '40px 24px 96px',
        fontFamily: FB,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
          borderBottom: '1px solid var(--podcast-border-soft2)',
          paddingBottom: 22,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.85)',
            }}
          >
            The archive
          </p>
          <h2
            style={{
              margin: '6px 0 0',
              fontFamily: FBN,
              fontSize: 36,
              letterSpacing: '0.04em',
              color: 'var(--podcast-text-strong)',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            All episodes
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: FBC,
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--podcast-text-3)',
          }}
        >
          {countLabel}
        </p>
      </header>

      <PodcastFilterPills filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

      <div
        className="podcast-archive-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '32px 22px',
        }}
      >
        {gridChildren}
      </div>

      {filtered.length === 0 && fallbackEpisode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--podcast-text-4)',
            }}
          >
            Nothing in {filter === 'all' ? 'this filter' : 'this pillar'} yet — featured episode below
          </p>
          <div
            className="podcast-archive-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '32px 22px',
            }}
          >
            <PodcastCoverCard episode={fallbackEpisode} />
          </div>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 16px',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: 'var(--podcast-text-strong)',
              border: '1px solid var(--podcast-border-soft2)',
              cursor: 'pointer',
            }}
          >
            Browse all →
          </button>
        </div>
      )}

      {filtered.length === 0 && !fallbackEpisode && (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            border: '1px solid var(--podcast-border-soft2)',
            background: 'var(--podcast-bg-surface)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'var(--podcast-text-4)',
            }}
          >
            No episodes
          </p>
          <h3
            style={{
              margin: '10px 0 0',
              fontFamily: FB,
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--podcast-text-strong)',
            }}
          >
            Nothing in this pillar yet.
          </h3>
        </div>
      )}

      {/* Archive reflow: desktop auto-fills; ≤600px drops to 2-up, then
          1-up on the narrowest phones so nothing clips. Card covers get a
          brand-teal keyboard focus ring (PODCAST-CLEANUP S7). */}
      <style>{`
        .podcast-tile-cover { outline: none; }
        .podcast-tile-cover:focus-visible {
          outline: 2px solid var(--brand-teal);
          outline-offset: 2px;
        }
        .podcast-sponsor-slot {
          min-width: 0;
        }
        @media (max-width: 600px) {
          .podcast-archive-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px 14px !important;
          }
        }
        @media (max-width: 400px) {
          .podcast-archive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
