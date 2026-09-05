import Link from 'next/link'
import { PUBLIC_FOOTER_LINKS, footerCopyright } from '@/lib/layout/publicFooter'
import { FooterLogo } from '@/components/layout/FooterLogo'

/**
 * Global public footer (SPRINT FOOTER-1).
 *
 * Sprint 0's anonymous crawl found no <footer> anywhere on the public site and
 * no door to /terms, /privacy or /contact. This is that door.
 *
 * Colour comes entirely from the semantic tokens (--bg-surface, --text-*,
 * --border-color), so the footer inverts correctly between light and dark
 * (STYLEGUIDE §1/§2) and carries zero raw hex. On the always-dark shells
 * (/live, /login) the surrounding wrapper re-declares those same tokens to
 * their dark values — see `.live-force-dark` / `.ep-force-dark` in globals.css
 * — so the footer follows the shell instead of flipping out from under it.
 *
 * Layout is a single wrapping flex row: no horizontal overflow at 360/390/430.
 */
export function PublicFooter({
  /**
   * 'dark' pins the footer to the dark token set regardless of theme. Use it
   * only inside a fixed-dark shell that does NOT already carry
   * `.live-force-dark` (i.e. /login). /live's page wrapper handles its own.
   */
  tone = 'theme',
}: {
  tone?: 'theme' | 'dark'
} = {}) {
  return (
    <footer
      className={`ep-public-footer${tone === 'dark' ? ' ep-force-dark' : ''}`}
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <div
        className="ep-stack"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px 16px calc(32px + env(safe-area-inset-bottom, 0px))',
          minWidth: 0,
        }}
      >
        {/* Same horizontal lockup as header/nav (white on dark, navy on light).
            Swap is CSS so this stays a server component and force-dark shells
            keep the white mark. Cropped in FooterLogo so the E is flush with
            this column and the red disc sits on the wordmark cap-height. */}
        <Link
          href="/"
          aria-label="Evolved Pros home"
          className="ep-public-footer-brand"
          style={{
            display: 'block',
            alignSelf: 'flex-start',
            lineHeight: 0,
            textDecoration: 'none',
          }}
        >
          <FooterLogo />
        </Link>

        <nav aria-label="Footer" style={{ minWidth: 0 }}>
          <ul
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px 20px',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              minWidth: 0,
            }}
          >
            {PUBLIC_FOOTER_LINKS.map(link => (
              <li key={link.label} style={{ minWidth: 0 }}>
                {link.cta ? (
                  <Link
                    href={link.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 38,
                      padding: '0 18px',
                      borderRadius: 4,
                      background: 'var(--brand-red)',
                      color: 'var(--white)',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    href={link.href}
                    className="ep-public-footer-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 38,
                      color: 'var(--text-secondary)',
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow", sans-serif',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--text-tertiary)',
          }}
        >
          {footerCopyright()}
        </p>
      </div>
    </footer>
  )
}
