import {
  episodeRailStill,
  episodeWatchHref,
  episodeWatchIsExternal,
  formatRailDuration,
  type MediaRailEpisode,
} from '@/lib/media/podcastRail'

export function MediaLatestPodcast({
  episodes,
  variant = 'index',
}: {
  episodes: MediaRailEpisode[]
  variant?: 'index' | 'article'
}) {
  if (episodes.length === 0) return null

  const inkHeader = variant === 'article'

  return (
    <div
      data-media-podcast-rail
      className="ed-rail-card"
      style={{
        marginBottom: 16,
        maxWidth: '100%',
        overflow: 'hidden',
        background: inkHeader ? '#fff' : 'var(--paper-card)',
        border: inkHeader ? '0.5px solid rgba(43,58,90,0.1)' : '1px solid var(--paper-line-soft)',
      }}
    >
      <div
        style={{
          background: inkHeader ? 'var(--media-ink)' : 'var(--paper-card)',
          padding: inkHeader ? '7px 10px' : '10px 12px',
          borderBottom: inkHeader ? undefined : '2px solid var(--brand-gold)',
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: inkHeader ? 11 : 12,
            color: inkHeader ? '#fff' : 'var(--navy-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Latest Podcast
        </span>
      </div>
      <div className="ed-rail-card-body" style={{ background: inkHeader ? '#fff' : 'var(--paper-card)' }}>
        {episodes.map(ep => {
          const href = episodeWatchHref(ep)
          const external = episodeWatchIsExternal(href)
          const still = episodeRailStill(ep)
          const duration = formatRailDuration(ep.duration_seconds)
          return (
            <a
              key={ep.id}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              data-media-podcast-row
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderBottom: inkHeader ? '0.5px solid rgba(43,58,90,0.06)' : '1px solid var(--paper-line-soft)',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 80,
                  aspectRatio: '16 / 9',
                  borderRadius: 2,
                  background: 'var(--navy-dark, #112535)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {still ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={still}
                    alt=""
                    width={80}
                    height={45}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: '50% 12%',
                      borderRadius: 0,
                      display: 'block',
                    }}
                  />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 9,
                    color: 'var(--media-ink-soft, rgba(43,58,90,0.45))',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: 0,
                  }}
                >
                  Episode {ep.episode_number}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--navy-dark, #112535)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.35,
                    margin: '2px 0 0',
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    textOverflow: 'unset',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {ep.title}
                </p>
                {duration ? (
                  <p
                    style={{
                      fontSize: 10,
                      color: 'var(--media-ink-soft, rgba(43,58,90,0.4))',
                      fontFamily: 'var(--font-body)',
                      margin: '2px 0 0',
                    }}
                  >
                    {duration}
                  </p>
                ) : null}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
