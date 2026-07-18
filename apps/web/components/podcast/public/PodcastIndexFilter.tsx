'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface EpisodeCard {
  slug: string
  title: string
  guestName: string | null
  summary: string
  tags: string[]
  thumb: string | null
  episodeNumber: number | null
  dateLabel: string
}

// Client-side search + tag filter over the published episodes. The full list is
// server-rendered (crawlable); this only narrows what's shown, improving UX +
// time-on-page without hiding anything from crawlers on first paint.
export function PodcastIndexFilter({ episodes, tags }: { episodes: EpisodeCard[]; tags: string[] }) {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return episodes.filter(e => {
      if (tag && !e.tags.includes(tag)) return false
      if (!needle) return true
      return (
        e.title.toLowerCase().includes(needle) ||
        (e.guestName ?? '').toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle)
      )
    })
  }, [episodes, q, tag])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <label className="sr-only" htmlFor="podcast-search">Search episodes</label>
        <input
          id="podcast-search"
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search episodes, guests, topics…"
          className="w-full rounded-lg px-4 py-3 text-[15px]"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,240,232,0.14)', color: '#F5F0E8' }}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            <TagPill label="All" active={tag === null} onClick={() => setTag(null)} />
            {tags.map(t => (
              <TagPill key={t} label={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)} />
            ))}
          </div>
        )}
      </div>

      <p className="mb-4 font-condensed text-[12px] uppercase tracking-[0.14em]" style={{ color: 'rgba(245,240,232,0.4)' }}>
        {filtered.length} {filtered.length === 1 ? 'episode' : 'episodes'}
      </p>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {filtered.map(e => (
          <li key={e.slug}>
            <Link
              href={`/podcast/${e.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl no-underline transition-transform duration-200 hover:-translate-y-1"
              style={{ background: '#111926', border: '1px solid rgba(245,240,232,0.08)' }}
            >
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9', background: '#0A0F18' }}>
                {e.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.thumb}
                    alt={`${e.title}${e.guestName ? ` with ${e.guestName}` : ''}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-condensed text-[12px] uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.25)' }}>
                    Evolved Pros
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="font-condensed text-[11px] uppercase tracking-[0.16em]" style={{ color: '#ef0e30' }}>
                  {e.episodeNumber != null ? `Ep ${String(e.episodeNumber).padStart(3, '0')}` : 'Episode'}
                  {e.dateLabel ? ` · ${e.dateLabel}` : ''}
                </span>
                <h3 className="mt-1.5 font-condensed text-[19px] font-bold leading-tight" style={{ color: '#F5F0E8' }}>
                  {e.title}
                </h3>
                {e.guestName && (
                  <p className="mt-0.5 text-[13px]" style={{ color: 'rgba(245,240,232,0.55)' }}>{e.guestName}</p>
                )}
                {e.summary && (
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.5)' }}>
                    {e.summary}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-16 text-center font-condensed uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.35)' }}>
          No episodes match your search.
        </p>
      )}
    </div>
  )
}

function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-3.5 py-1.5 font-condensed text-[12px] font-bold uppercase tracking-[0.1em] transition-colors"
      style={{
        background: active ? '#ef0e30' : 'rgba(255,255,255,0.05)',
        color: active ? '#fff' : 'rgba(245,240,232,0.6)',
        border: `1px solid ${active ? '#ef0e30' : 'rgba(245,240,232,0.14)'}`,
      }}
    >
      {label}
    </button>
  )
}
