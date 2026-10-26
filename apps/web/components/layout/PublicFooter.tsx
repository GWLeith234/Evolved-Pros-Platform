import Link from 'next/link'
import {
  LISTEN_ON_LINKS,
  PUBLIC_FOOTER_LINKS,
  footerCopyright,
  type ListenOnLink,
} from '@/lib/layout/publicFooter'
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
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            minHeight: 44,
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
                      justifyContent: 'center',
                      minHeight: 44,
                      minWidth: 44,
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
                      justifyContent: 'center',
                      minHeight: 44,
                      minWidth: 44,
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

        <ListenOnRow />

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
          <br />
          {/* One builder credit for the whole site. This component is the only
              mount, so the anchor stays a single dofollow link with no rel. */}
          Website by <a href="https://www.evolvex360.com/">EvolveX360</a>
        </p>
      </div>
    </footer>
  )
}

/**
 * Official marks, unmodified. Pocket Casts, Castbox, Podcast Addict,
 * Podchaser, Podcast Index, and RSS are text links.
 *
 * Apple Podcasts badge SVG (US_UK_Apple_Podcasts_Listen_Badge_RGB.svg):
 * https://www.apple.com/105/media/us/ipoditunes/itunes/2017/e3fd5849_f16b_4256_9188_db2103c3a4ef/badges-podcasts/us.zip
 * Guidelines: https://marketing.services.apple/apple-podcasts-identity-guidelines
 * The badge download on that page (https://apple.box.com/s/ov4uvkt6lk3fv2fdj2i6p8iwh3ljc0c3) returned 404.
 * The zip above is the Listen badge SVG Apple still serves, and it matches the badge shown on the guidelines page.
 *
 * Spotify full logo SVG, black on light and white on dark
 * (Full_Logo_Black_RGB.svg, Full_Logo_White_RGB.svg):
 * https://developer.spotify.com/documentation/design
 * https://developer.spotify.com/images/guidelines/design/2024-spotify-full-logo.zip
 *
 * YouTube full-color digital logo. The brand package has PNG, AI, EPS, and PDF, and no SVG.
 * Almost-black wordmark on light, white wordmark on dark
 * (yt_logo_fullcolor_almostblack_digital.png, yt_logo_fullcolor_white_digital.png):
 * https://brand.youtube/youtube-logo
 * https://www.gstatic.com/marketing-cms/52/7d/637fef5a4788a97747e6feabc4aa/youtube-logo.zip
 */
const APPLE_BADGE_SRC = '/brand/listen/apple-podcasts-listen-badge.svg'
const SPOTIFY_LOGO_DARK_SRC = '/brand/listen/spotify-logo-white.svg'
const SPOTIFY_LOGO_LIGHT_SRC = '/brand/listen/spotify-logo-black.svg'
const YOUTUBE_LOGO_DARK_SRC = '/brand/listen/youtube-logo-white.png'
const YOUTUBE_LOGO_LIGHT_SRC = '/brand/listen/youtube-logo-almostblack.png'

function ListenOnRow() {
  return (
    <nav aria-label="Listen on" style={{ minWidth: 0, maxWidth: '100%' }}>
      <ul
        className="ep-listen-on"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 16px',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <li
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 44,
            color: 'var(--text-tertiary)',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Listen on
        </li>
        {LISTEN_ON_LINKS.map(link => (
          <li key={link.href} style={{ minWidth: 0, maxWidth: '100%' }}>
            <ListenOnAnchor link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Published SVG and PNG marks. Leave the files as the platforms shipped them.
/* eslint-disable @next/next/no-img-element */
function ListenOnAnchor({ link }: { link: ListenOnLink }) {
  const text = link.mark === 'text'
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.ariaLabel}
      className={text ? 'ep-public-footer-link' : undefined}
      style={
        text
          ? {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              minWidth: 44,
              maxWidth: '100%',
              color: 'var(--text-secondary)',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }
          : {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              maxWidth: '100%',
              lineHeight: 0,
              textDecoration: 'none',
            }
      }
    >
      {link.mark === 'apple' && (
        // Apple Podcasts Listen badge. Source: https://www.apple.com/105/media/us/ipoditunes/itunes/2017/e3fd5849_f16b_4256_9188_db2103c3a4ef/badges-podcasts/us.zip
        <img
          src={APPLE_BADGE_SRC}
          alt=""
          style={{ height: 32, width: 'auto', maxWidth: '100%' }}
        />
      )}
      {link.mark === 'spotify' && (
        // Spotify full logo. Source: https://developer.spotify.com/documentation/design and https://developer.spotify.com/images/guidelines/design/2024-spotify-full-logo.zip
        <>
          <img
            src={SPOTIFY_LOGO_DARK_SRC}
            alt=""
            className="ep-public-footer-logo--on-dark"
            style={{ height: 32, width: 'auto', maxWidth: '100%' }}
          />
          <img
            src={SPOTIFY_LOGO_LIGHT_SRC}
            alt=""
            className="ep-public-footer-logo--on-light"
            style={{ height: 32, width: 'auto', maxWidth: '100%' }}
          />
        </>
      )}
      {link.mark === 'youtube' && (
        // YouTube full-color logo. Source: https://brand.youtube/youtube-logo and https://www.gstatic.com/marketing-cms/52/7d/637fef5a4788a97747e6feabc4aa/youtube-logo.zip
        <>
          <img
            src={YOUTUBE_LOGO_DARK_SRC}
            alt=""
            className="ep-public-footer-logo--on-dark"
            style={{ height: 24, width: 'auto', maxWidth: '100%' }}
          />
          <img
            src={YOUTUBE_LOGO_LIGHT_SRC}
            alt=""
            className="ep-public-footer-logo--on-light"
            style={{ height: 24, width: 'auto', maxWidth: '100%' }}
          />
        </>
      )}
      {text && link.label}
    </a>
  )
}
/* eslint-enable @next/next/no-img-element */
