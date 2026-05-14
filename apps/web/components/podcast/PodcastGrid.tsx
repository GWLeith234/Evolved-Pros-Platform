'use client'

import { useMemo, useState } from 'react'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { PodcastFilterPills, type FilterKey, type SortKey } from './PodcastFilterPills'
import { PodcastEpisodeTile } from './PodcastEpisodeTile'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

interface PodcastGridProps {
  episodes: PodcastEpisode[]
  /** Shown as a single card when the active filter returns nothing. */
  fallbackEpisode?: PodcastEpisode
}

export function PodcastGrid({ episodes, fallbackEpisode }: PodcastGridProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [focused, setFocused] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = filter === 'all' ? episodes : episodes.filter(e => e.pillar === filter)
    if (sort === 'newest') list = [...list].sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime())
    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.releasedAt).getTime() - new Date(b.releasedAt).getTime())
    if (sort === 'longest') list = [...list].sort((a, b) => b.duration - a.duration)
    return list
  }, [episodes, filter, sort])

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
            All Episodes
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
          {filtered.length} {filtered.length === 1 ? 'episode' : 'episodes'}
        </p>
      </header>

      <PodcastFilterPills filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '36px 28px',
        }}
      >
        {filtered.map(ep => (
          <PodcastEpisodeTile
            key={ep.id}
            episode={ep}
            focused={focused === ep.id}
            onFocus={setFocused}
            onBlur={() => setFocused(null)}
          />
        ))}
      </div>

      {filtered.length === 0 && fallbackEpisode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '36px 28px',
            }}
          >
            <PodcastEpisodeTile
              episode={fallbackEpisode}
              focused={focused === fallbackEpisode.id}
              onFocus={setFocused}
              onBlur={() => setFocused(null)}
            />
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
              fontFamily: FP,
              fontSize: 22,
              color: 'var(--podcast-text-strong)',
            }}
          >
            Nothing in this pillar yet.
          </h3>
        </div>
      )}
    </section>
  )
}
