import Link from 'next/link'
import { getPillar, getPillarColor, getPillarLabel } from '@/lib/pillars'
import type { RelatedEpisode } from '@/lib/podcast/episodeExtras'

/**
 * Section B — Related episodes (SPRINT PODCAST-1). Server component.
 *
 * 4 cols >=1200, 2 cols 768-1199, 1 col below. Ships the DEFAULT 1-col mobile
 * stack only — the snap-scroll rail is optional-behind-a-flag in the spec and
 * we are not adding a flag this sprint.
 *
 * Thumbnails are maxresdefault (1280x720, true 16:9) with explicit width/height
 * so the card reserves its box and does not shift on load. hqdefault is 480x360
 * 4:3 and letterboxes inside a 16:9 frame — never use it here.
 *
 * Colors are tokens, not raw hex (STYLEGUIDE §1): --navy-card is the card
 * surface, --navy-abyss the thumbnail well, --brand-red the section eyebrow.
 */
export function RelatedEpisodes({ episodes }: { episodes: RelatedEpisode[] }) {
  if (episodes.length === 0) return null

  return (
    <section className="re" aria-labelledby="related-heading">
      <style>{CSS}</style>

      <h2 id="related-heading" className="re-eyebrow font-condensed">
        Related episodes
      </h2>

      <ul className="re-grid">
        {episodes.map(ep => {
          // pillar is a NUMBER (1..6) on the view model; lib/pillars is keyed by
          // slug, so resolve the slug from the id here.
          const pillarSlug = ep.pillar != null ? (getPillar(ep.pillar)?.slug ?? null) : null
          const pillarColor = getPillarColor(pillarSlug)
          const pillarLabel = getPillarLabel(pillarSlug)
          const eyebrow = [pillarLabel, ep.episodeNumber != null ? `Ep ${ep.episodeNumber}` : null]
            .filter(Boolean)
            .join(' · ')

          return (
            <li key={ep.slug} className="re-cell">
              <Link href={`/podcast/${ep.slug}`} className="re-card">
                <span className="re-thumb">
                  {ep.thumbnail && (
                    // alt comes from the data and is deliberately '' — the card's
                    // visible title already names the episode, so alt here would
                    // be a duplicate announcement. Not a missing alt.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ep.thumbnail.url}
                      alt={ep.thumbnail.alt}
                      width={ep.thumbnail.width}
                      height={ep.thumbnail.height}
                      loading="lazy"
                      className="re-img"
                    />
                  )}
                  {ep.durationLabel && (
                    <span className="re-duration font-condensed tabular-nums">{ep.durationLabel}</span>
                  )}
                </span>

                <span className="re-body">
                  {eyebrow && (
                    <span className="re-card-eyebrow font-condensed" style={{ color: pillarColor }}>
                      {eyebrow}
                    </span>
                  )}

                  <span className="re-title font-condensed">{ep.title}</span>

                  {ep.guestName && (
                    <span className="re-guest font-body">
                      {[ep.guestName, ep.guestHeadline].filter(Boolean).join(' · ')}
                    </span>
                  )}

                  <span className="re-reason font-body">{ep.reason}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const CSS = `
.re { margin-bottom: 8px; }
.re-eyebrow {
  margin: 0 0 20px;
  font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  color: var(--brand-red);
}
.re-grid {
  display: grid; grid-template-columns: 1fr; gap: 16px;
  margin: 0; padding: 0; list-style: none;
}
@media (min-width: 768px)  { .re-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1200px) { .re-grid { grid-template-columns: repeat(4, 1fr); } }

.re-cell { min-width: 0; }
.re-card {
  display: flex; flex-direction: column; height: 100%;
  background: var(--navy-card);
  border: 1px solid var(--podcast-border-soft2);
  border-radius: 0;
  text-decoration: none;
  transition: border-color 140ms ease;
}
/* Border only — no lift, no shadow. */
@media (hover: hover) { .re-card:hover { border-color: rgba(255,255,255,0.22); } }
.re-card:focus-visible { outline: 1px solid var(--brand-teal); outline-offset: 2px; }

.re-thumb {
  position: relative; display: block;
  aspect-ratio: 16 / 9;
  background: var(--navy-abyss);
  overflow: hidden;
}
.re-img {
  display: block; width: 100%; height: 100%;
  object-fit: cover; object-position: center;
  border-radius: 0;
}
.re-duration {
  position: absolute; right: 8px; bottom: 8px;
  padding: 2px 6px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--podcast-text-strong);
  background: var(--navy-abyss);
  border-radius: 0;
}

.re-body { display: flex; flex-direction: column; gap: 6px; padding: 14px; }
.re-card-eyebrow {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em;
}
.re-title {
  font-size: 16px; font-weight: 700; line-height: 1.2;
  color: var(--podcast-text-strong);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.re-guest {
  font-size: 13px; line-height: 1.4;
  color: var(--podcast-text-3);
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden;
}
.re-reason {
  margin-top: 4px; padding-top: 10px;
  border-top: 1px solid var(--podcast-border-soft2);
  font-size: 12px; font-style: italic; line-height: 1.4;
  color: var(--podcast-text-4);
}
`
