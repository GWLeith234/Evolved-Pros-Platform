// HOME-4UP-TILES: ports TopStoriesCard from home-tiles.jsx (lines 254-339).
// 3 ranked stories with rank number, pillar tag, optional HOT badge,
// title (Playfair), and save button. Bottom link to /media.
//
// Pure presentational — no client interactivity needed (save toggle
// deferred to a future sprint; brief flagged sponsor + admin UI as
// out of scope).

import { TileCard } from './TileCard'

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
  const bottomLink = (
    <a
      href="/media"
      style={{
        display: 'block',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        textAlign: 'right',
      }}
    >
      All in Media →
    </a>
  )

  return (
    <TileCard
      accent={ACCENT}
      eyebrow="Top Stories"
      title="Top Stories"
      count="Media"
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
            <li
              key={s.id}
              style={{
                position: 'relative',
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  flexShrink: 0,
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
                        background: '#ef0e30',
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </TileCard>
  )
}
