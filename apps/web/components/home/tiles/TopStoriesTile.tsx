// HOME-4UP-TILES: ports TopStoriesCard from home-tiles.jsx (lines 254-339).
// 3 ranked stories with rank number, pillar tag, optional HOT badge,
// title (Playfair), and save button. Bottom link to /media.
//
// Pure presentational — no client interactivity needed (save toggle
// deferred to a future sprint; brief flagged sponsor + admin UI as
// out of scope).

import { TileCard } from './TileCard'
import { TileRow, TileFooterLink } from './TileRow'

const ACCENT = 'var(--tile-stories)'

export interface PulseStory {
  id: string
  slug: string
  category: string
  /** Hex color for the category eyebrow; null falls back to text-secondary. */
  categoryColor: string | null
  title: string
  readTime: string
  /** Trending flag — renders a red HOT badge next to the category. */
  isHot: boolean
}

interface TopStoriesTileProps {
  stories: PulseStory[]
}

export function TopStoriesTile({ stories }: TopStoriesTileProps) {
  const bottomLink = <TileFooterLink href="/media">All stories</TileFooterLink>

  return (
    <TileCard
      accent={ACCENT}
      eyebrow="Media"
      title="Top stories"
      footer={bottomLink}
    >
      {stories.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow", sans-serif',
              fontSize: 12,
              color: 'var(--text-tertiary)',
            }}
          >
            Stories coming soon.
          </p>
        </div>
      ) : (
        <ul style={{ margin: 0, padding: '4px 16px 0', listStyle: 'none' }}>
          {stories.map((s, i) => (
            <TileRow
              key={s.id}
              isFirst={i === 0}
              leading={
                <div
                  style={{
                    width: 28,
                    textAlign: 'center',
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: 22,
                    letterSpacing: '0.02em',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  0{i + 1}
                </div>
              }
              primary={
                <a
                  href={`/media/${s.slug}`}
                  style={{
                    display: 'block',
                    margin: 0,
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 13,
                    lineHeight: 1.35,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  {s.title}
                </a>
              }
              meta={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 700,
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: s.categoryColor ?? 'var(--text-secondary)',
                    }}
                  >
                    {s.category}
                  </span>
                  {s.isHot && (
                    <span
                      style={{
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 800,
                        fontSize: 8,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: '#0A0F18',
                        background: 'var(--brand-red-hover)',
                        padding: '1px 6px',
                      }}
                    >
                      Hot
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 600,
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                      marginLeft: 'auto',
                    }}
                  >
                    {s.readTime}
                  </span>
                </div>
              }
            />
          ))}
        </ul>
      )}
    </TileCard>
  )
}
