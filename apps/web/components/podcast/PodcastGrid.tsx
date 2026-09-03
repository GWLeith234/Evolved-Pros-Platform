'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { sortEpisodesNewest } from '@/lib/podcast/transforms'
import { PodcastFilterPills, type FilterKey, type SortKey } from './PodcastFilterPills'
import { PodcastCoverCard } from './PodcastCoverCard'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { selectPodcastBigBoxes } from '@/lib/sponsors/partners'
import { PODCAST_AD_EVERY, interleaveAds } from '@/lib/ads/rhythm'

const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'

interface PodcastGridProps {
  episodes: PodcastEpisode[]
  /** Shown as a single card when the active filter returns nothing. */
  fallbackEpisode?: PodcastEpisode
  /** Zone E 300×600 big boxes — full-width rows, never episode-tile squares. */
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

  // Zone E 300×600 only — never 728×90, never a 300×250 stuffed into a tile.
  const uniqueStills = useMemo(() => selectPodcastBigBoxes(sponsorAds), [sponsorAds])

  // 4 episode cards, then a centered big box, then 4, then a box.
  // Ads break the row (1 / -1) so they cannot sit as fake episode squares.
  const gridChildren = useMemo(() => {
    const chunks = interleaveAds(filtered, uniqueStills, PODCAST_AD_EVERY, { trailing: true })
    const nodes: ReactNode[] = []
    chunks.forEach((chunk, idx) => {
      if (chunk.kind === 'ad') {
        if (!chunk.ad.image_url) return
        nodes.push(
          <div
            key={`sponsor-slot-${chunk.ad.id}-${idx}`}
            className="podcast-sponsor-bigbox"
            style={{ gridColumn: '1 / -1', justifySelf: 'center', width: '100%' }}
          >
            <IabAdvertisementSlot
              ad={{ ...chunk.ad, image_url: chunk.ad.image_url }}
              locationId="podcast"
            />
          </div>,
        )
        return
      }
      chunk.items.forEach(ep => {
        nodes.push(<PodcastCoverCard key={ep.id} episode={ep} />)
      })
    })
    return nodes
  }, [filtered, uniqueStills])

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
        padding: '40px 24px 120px',
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
          1-up on the narrowest phones. Big-box ads span the full row. */}
      <style>{`
        .podcast-tile-cover { outline: none; }
        .podcast-tile-cover:focus-visible {
          outline: 2px solid var(--brand-teal);
          outline-offset: 2px;
        }
        .podcast-sponsor-bigbox {
          min-width: 0;
          width: 100%;
          padding: 8px 0 16px;
        }
        @media (max-width: 600px) {
          .podcast-archive-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px 12px !important;
          }
        }
        @media (max-width: 380px) {
          .podcast-archive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
