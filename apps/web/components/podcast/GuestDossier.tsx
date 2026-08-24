import { getPillarColor, PILLARS } from '@/lib/pillars'
import { showBookingStrip, showLinks, type Guest } from '@/lib/podcast/episodeExtras'

/**
 * Section A — Guest dossier (SPRINT PODCAST-1). Server component, no state.
 *
 * Design rules that are load-bearing, not taste:
 *  - border-radius 0 everywhere, no shadows, no gradients.
 *  - A fact row whose value is null is OMITTED. We never render an em-dash
 *    placeholder — a blank is a lie about what we know.
 *  - The fact table is frequently ONE row (company only: location is null on 6
 *    of 10 episodes, books has no column). One row has to read as deliberate,
 *    so the 2px brand-red top rule carries it and the last row has no bottom
 *    rule — the table ends on content, not on a dangling hairline.
 *
 * Colors come from tokens, never raw hex (STYLEGUIDE §1): --brand-red is the
 * spec's section red, --brand-gold the headline gold, --brand-teal the focus
 * ring, --navy-card the always-dark card surface. Each already resolves to the
 * exact value the spec names. The --podcast-* text/border tiers are re-pinned
 * to ivory inside .podcast-force-dark, so they stay correct in light theme.
 */

const PILLAR_BY_NUMBER = new Map(PILLARS.map(p => [p.n as number, p]))

export function GuestDossier({ guest }: { guest: Guest }) {
  const facts: Array<{ label: string; value: string }> = []
  if (guest.facts.company) facts.push({ label: 'Company', value: guest.facts.company })
  if (guest.facts.location) facts.push({ label: 'Location', value: guest.facts.location })
  if (guest.facts.books.length) facts.push({ label: 'Books', value: guest.facts.books.join(', ') })
  // facts.recordedAt is deliberately NOT rendered — we only have published_at,
  // and a publish date is not a recording date. See episodeExtras.ts.

  const pillars = guest.pillars
    .map(n => PILLAR_BY_NUMBER.get(n))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <section className="gd" aria-labelledby="guest-heading">
      <style>{CSS}</style>

      <h2 id="guest-heading" className="gd-eyebrow font-condensed">
        About the guest
      </h2>

      <div className="gd-grid">
        {/* Portrait. Sources are not guaranteed 4:5 yet (back-catalogue
            normalization is open), so crop from the top — a bad crop should
            lose the chin, never the forehead. */}
        <div className="gd-portrait">
          {guest.headshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guest.headshot}
              alt={guest.name}
              width={300}
              height={375}
              loading="lazy"
              className="gd-headshot"
            />
          ) : (
            <div className="gd-headshot gd-headshot-empty" aria-hidden />
          )}
        </div>

        <div className="gd-body">
          <h3 className="gd-name font-bebas">{guest.name}</h3>

          {guest.headline && <p className="gd-headline font-condensed">{guest.headline}</p>}

          {pillars.length > 0 && (
            <ul className="gd-pillars" aria-label="Pillars">
              {pillars.map(p => (
                <li
                  key={p.n}
                  className="gd-chip font-condensed"
                  style={{ color: getPillarColor(p.slug), borderColor: getPillarColor(p.slug) }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          )}

          {guest.bio && <p className="gd-bio font-body">{guest.bio}</p>}

          {facts.length > 0 && (
            <dl className="gd-facts font-body">
              {facts.map((f, i) => (
                <div key={f.label} className={i === facts.length - 1 ? 'gd-fact gd-fact-last' : 'gd-fact'}>
                  <dt className="gd-fact-label font-condensed">{f.label}</dt>
                  <dd className="gd-fact-value">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Hairline-lattice link grid. Hidden under 3 links per spec, which
              means it never renders today — no link column exists yet. */}
          {showLinks(guest.links) && (
            <ul className="gd-links" aria-label={`Follow ${guest.name}`}>
              {guest.links.map(l => (
                <li key={l.href} className="gd-link-cell">
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gd-link font-condensed"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Booking strip. contact.visibility is hardcoded 'internal', so this
              cannot render — email/phone come from guest intake only, never
              scraped. Built so PODCAST-2 only has to supply the data. */}
          {showBookingStrip(guest.contact) && (
            <div className="gd-booking font-condensed">
              <span className="gd-booking-label">Booking</span>
              {guest.contact.email && (
                <a className="gd-booking-link" href={`mailto:${guest.contact.email}`}>
                  {guest.contact.email}
                </a>
              )}
              {guest.contact.phone && (
                <a className="gd-booking-link" href={`tel:${guest.contact.phone}`}>
                  {guest.contact.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const CSS = `
.gd { margin-bottom: 48px; }
.gd-eyebrow {
  margin: 0 0 20px;
  font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  color: var(--brand-red);
}
.gd-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
@media (min-width: 768px)  { .gd-grid { grid-template-columns: 220px 1fr; gap: 28px; } }
@media (min-width: 1200px) { .gd-grid { grid-template-columns: 300px 1fr; gap: 32px; } }

/* Stacked mobile: cap the portrait. At full column width a 4:5 crop is taller
   than the viewport, so the name fell a whole screen below the fold. */
.gd-portrait { border-radius: 0; max-width: 200px; }
@media (min-width: 768px) { .gd-portrait { max-width: none; } }
.gd-headshot {
  display: block; width: 100%; height: auto;
  aspect-ratio: 4 / 5;
  object-fit: cover; object-position: top;
  border-radius: 0;
  background: var(--navy-card);
  border: 1px solid var(--podcast-border-soft2);
}
.gd-headshot-empty { aspect-ratio: 4 / 5; }

.gd-body { min-width: 0; }
.gd-name {
  margin: 0;
  font-size: 38px; line-height: 1.02;
  letter-spacing: 0.02em; text-transform: uppercase;
  color: var(--podcast-text-strong);
}
@media (min-width: 1200px) { .gd-name { font-size: 46px; } }
.gd-headline {
  margin: 6px 0 0;
  font-size: 16px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--brand-gold);
}

.gd-pillars { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; padding: 0; list-style: none; }
.gd-chip {
  padding: 3px 10px;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.14em;
  border: 1px solid currentColor; border-radius: 0; background: transparent;
}

.gd-bio {
  margin: 18px 0 0;
  font-size: 15px; line-height: 1.7;
  color: var(--podcast-text-2);
}

/* One row must look deliberate: the 2px rule opens the table, each row closes
   with a hairline, and the LAST row has none — so a single-row table reads as
   a titled block, not a truncated list. */
.gd-facts { margin: 22px 0 0; border-top: 2px solid var(--brand-red); }
.gd-fact {
  display: grid; grid-template-columns: 1fr; gap: 2px;
  padding: 10px 0;
  border-bottom: 1px solid var(--podcast-border-soft2);
}
@media (min-width: 768px) { .gd-fact { grid-template-columns: 120px 1fr; gap: 16px; align-items: baseline; } }
.gd-fact-last { border-bottom: 0; }
.gd-fact-label {
  margin: 0;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--podcast-text-4);
}
.gd-fact-value { margin: 0; font-size: 15px; color: var(--podcast-text-strong); }

.gd-links {
  display: grid; grid-template-columns: repeat(2, 1fr);
  margin: 24px 0 0; padding: 0; list-style: none;
  border-top: 1px solid var(--podcast-border-med);
  border-left: 1px solid var(--podcast-border-med);
}
@media (min-width: 768px) { .gd-links { grid-template-columns: repeat(3, 1fr); } }
.gd-link-cell {
  border-right: 1px solid var(--podcast-border-med);
  border-bottom: 1px solid var(--podcast-border-med);
}
.gd-link {
  display: block; padding: 12px 14px;
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--podcast-text-strong); text-decoration: none;
  border-radius: 0;
}
@media (hover: hover) { .gd-link:hover { color: var(--brand-gold); } }

.gd-booking {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px;
  margin: 24px 0 0; padding: 12px 16px;
  border: 1px solid var(--brand-gold); border-radius: 0;
}
.gd-booking-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: var(--brand-gold);
}
.gd-booking-link { font-size: 14px; color: var(--podcast-text-strong); text-decoration: none; }
@media (hover: hover) { .gd-booking-link:hover { color: var(--brand-gold); } }

.gd a:focus-visible { outline: 1px solid var(--brand-teal); outline-offset: 2px; }
`
