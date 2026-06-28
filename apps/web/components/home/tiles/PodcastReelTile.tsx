// HOME-4UP-TILES: ports PodcastReelCard from home-tiles.jsx (lines 350-440).
// 3 latest episodes with square cover (gradient + episode number),
// title, guest · role · duration, and a play/pause toggle button.
// Bottom link to /podcast.
//
// 'use client' — play/pause toggle uses local state. Actual audio
// playback wiring is out of scope for this sprint; the button is a
// visual affordance that links to the episode page.

'use client'

import { useState } from 'react'
import { TileCard } from './TileCard'
import { TileRow, TileFooterLink } from './TileRow'

const ACCENT = 'var(--tile-podcast)'

export interface PulseEpisode {
  id: string
  slug: string
  episodeNumber: number | null
  title: string
  guestName: string | null
  guestTitle: string | null
  guestCompany: string | null
  durationLabel: string
  /** Whether the episode is < 7 days old — drives the corner NEW badge. */
  isNew: boolean
  /** Per-episode accent (rotates through pillar palette in v1). */
  accent: string
}

interface PodcastReelTileProps {
  episodes: PulseEpisode[]
  /** Latest episode number. No longer drives the header pill (the pill is a
   *  "N NEW" count now, per A1.1) — the episode number lives on each row's
   *  cover chip. Kept for the page's call site; intentionally unused. */
  latestEpisodeNumber?: number | null
}

function guestLine(ep: PulseEpisode): string {
  const parts: string[] = []
  if (ep.guestName) parts.push(ep.guestName)
  const role = [ep.guestTitle, ep.guestCompany].filter(Boolean).join(', ')
  if (role) parts.push(role)
  parts.push(ep.durationLabel)
  return parts.join(' · ')
}

export function PodcastReelTile({ episodes }: PodcastReelTileProps) {
  const [playing, setPlaying] = useState<string | null>(null)

  // Status pill = new-since-last-visit count. Episodes < 7 days old carry
  // the isNew flag; that's the closest available signal for "new".
  const newCount = episodes.filter(ep => ep.isNew).length

  const bottomLink = <TileFooterLink href="/podcast">All episodes</TileFooterLink>

  return (
    <TileCard
      accent={ACCENT}
      eyebrow="Podcast"
      title="Latest drops"
      newCount={newCount}
      footer={bottomLink}
    >
      {episodes.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow", sans-serif',
              fontSize: 12,
              color: 'var(--text-tertiary)',
            }}
          >
            New episodes coming soon.
          </p>
        </div>
      ) : (
        <ul style={{ margin: 0, padding: '4px 16px 0', listStyle: 'none' }}>
          {episodes.map((ep, i) => {
            const isPlaying = playing === ep.id
            return (
              <TileRow
                key={ep.id}
                isFirst={i === 0}
                align="center"
                leading={
                  <a
                    href={`/podcast/${ep.slug}`}
                    style={{
                      position: 'relative',
                      width: 44,
                      height: 44,
                      background: `linear-gradient(135deg, ${ep.accent}33, ${ep.accent}11)`,
                      border: `1px solid ${ep.accent}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 18,
                        letterSpacing: '0.04em',
                        color: ep.accent,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {/* TODO(format): route episode number through lib/format.ts */}
                      {ep.episodeNumber ?? '—'}
                    </span>
                    {ep.isNew && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          background: '#ef0e30',
                          color: '#fff',
                          fontFamily: '"Barlow Condensed", sans-serif',
                          fontWeight: 800,
                          fontSize: 7,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          padding: '1px 4px',
                        }}
                      >
                        New
                      </span>
                    )}
                  </a>
                }
                primary={
                  <a
                    href={`/podcast/${ep.slug}`}
                    style={{
                      display: 'block',
                      margin: 0,
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textDecoration: 'none',
                    }}
                  >
                    {ep.title}
                  </a>
                }
                meta={
                  <p
                    style={{
                      margin: 0,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {/* TODO(format): route guest · role · duration through lib/format.ts */}
                    {guestLine(ep)}
                  </p>
                }
                trailing={
                  <button
                    type="button"
                    onClick={() => setPlaying(isPlaying ? null : ep.id)}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isPlaying ? ep.accent : 'transparent',
                      color: isPlaying ? '#0A0F18' : ep.accent,
                      border: `1px solid ${ep.accent}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {isPlaying ? (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                        <rect x="2" y="2" width="3" height="8" />
                        <rect x="7" y="2" width="3" height="8" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                        <path d="M3 2 L10 6 L3 10 Z" />
                      </svg>
                    )}
                  </button>
                }
              />
            )
          })}
        </ul>
      )}
    </TileCard>
  )
}
