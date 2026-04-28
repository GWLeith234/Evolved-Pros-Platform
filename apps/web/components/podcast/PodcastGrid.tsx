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
}

export function PodcastGrid({ episodes }: PodcastGridProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [focused, setFocused] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = filter === 'all' ? episodes : episodes.filter(e => e.pillar === filter)
    if (sort === 'newest') list = [...list].sort((a, b) => b.releasedAt.getTime() - a.releasedAt.getTime())
    if (sort === 'oldest') list = [...list].sort((a, b) => a.releasedAt.getTime() - b.releasedAt.getTime())
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
              fontSize: 11,
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
          {filtered.length} episodes
        </p>
      </header>

      <PodcastFilterPills filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '32px 22px',
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

      {filtered.length === 0 && (
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
              fontSize: 11,
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
