import Link from 'next/link'
import {
  FOOTER_JOIN_FREE,
  FOOTER_LINK_GROUPS,
  FOOTER_TAGLINE,
  LISTEN_ON_LINKS,
  footerCopyright,
  type ListenOnLink,
} from '@/lib/layout/publicFooter'
import { FooterLogo } from '@/components/layout/FooterLogo'

/**
 * Global public footer. George-approved band, 29 Oct 2026.
 *
 * Always the dark lockup from the mockup: red top rule, JOIN FREE as the
 * only red control, three link groups, nine white listen marks in 52px
 * circles. Light mode does not flip it.
 *
 * `tone` stays so /login can keep passing tone="dark". The band does not
 * branch on it.
 *
 * Listen marks: Simple Icons, recolored white, except Podchaser, which uses
 * the official icon geometry with the colors stripped to white. Files live
 * in public/brand/listen/marks.
 */
export function PublicFooter({
  tone = 'theme',
}: {
  tone?: 'theme' | 'dark'
} = {}) {
  return (
    <footer
      className={`ep-public-footer${tone === 'dark' ? ' ep-force-dark' : ''}`}
      aria-label="Footer"
    >
      <div className="ep-public-footer-inner">
        <div className="ep-public-footer-top">
          <div className="ep-public-footer-brand-block">
            <Link
              href="/"
              aria-label="Evolved Pros home"
              className="ep-public-footer-brand"
            >
              <FooterLogo />
            </Link>
            <p className="ep-public-footer-tagline">{FOOTER_TAGLINE}</p>
            <Link href={FOOTER_JOIN_FREE.href} className="ep-public-footer-cta">
              {FOOTER_JOIN_FREE.label}
            </Link>
          </div>

          <nav className="ep-public-footer-cols" aria-label="Footer links">
            {FOOTER_LINK_GROUPS.map(group => (
              <div key={group.label}>
                <h2 className="ep-public-footer-kicker">{group.label}</h2>
                <ul>
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <ListenOn />

        <div className="ep-public-footer-legal">
          <p>{footerCopyright()}</p>
          <p>
            {/* One builder credit for the whole site. This component is the only
                mount, so the anchor stays a single dofollow link with no rel. */}
            Website by <a href="https://www.evolvex360.com/">EvolveX360</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function ListenOn() {
  return (
    <nav className="ep-public-footer-listen ep-listen-on" aria-label="Listen on">
      <h2 className="ep-public-footer-kicker">Listen on</h2>
      <ul className="ep-public-footer-listen-grid">
        {LISTEN_ON_LINKS.map(link => (
          <li key={link.icon}>
            <ListenTile link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ListenTile({ link }: { link: ListenOnLink }) {
  const inner = (
    <>
      <span className="ep-public-footer-icon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/brand/listen/marks/${link.icon}.svg`}
          alt=""
          width={24}
          height={24}
        />
      </span>
      <span className="ep-public-footer-tile-label">{link.label}</span>
    </>
  )

  if (!link.external) {
    return (
      <Link href={link.href} className="ep-public-footer-tile" aria-label={link.ariaLabel}>
        {inner}
      </Link>
    )
  }

  return (
    <a
      href={link.href}
      className="ep-public-footer-tile"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.ariaLabel}
    >
      {inner}
    </a>
  )
}
