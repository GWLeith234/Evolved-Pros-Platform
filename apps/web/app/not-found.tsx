import Link from 'next/link'
import { PublicFooter } from '@/components/layout/PublicFooter'

/**
 * Root 404.
 *
 * SPRINT FOOTER-1 — two fixes here:
 *  1. The CTA pointed at /home, a member route. An anonymous visitor who hit a
 *     dead link was bounced straight from the 404 to /login, which is a worse
 *     dead end than the 404. It now goes to /, the public front door.
 *  2. The page carried four raw hex literals (navy-deep page, hot-red eyebrow
 *     and CTA, off-white heading) and was therefore stuck dark in light mode.
 *     Every colour is now a semantic token, so it inverts with the theme
 *     (STYLEGUIDE §1/§2) and the hex ratchet drops by four.
 *
 * The public footer mounts here too — this page lives outside the (public)
 * route group, so it does not inherit that layout's footer.
 */
export default function NotFound() {
  return (
    <div className="ep-public-shell" style={{ background: 'var(--bg-page)' }}>
      <div
        className="ep-public-shell-main"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 0',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--brand-red-hot)',
              marginBottom: 16,
            }}
          >
            404. Page Not Found
          </p>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            This page doesn&apos;t exist.
          </h1>
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 14,
              color: 'var(--text-tertiary)',
              marginBottom: 36,
              lineHeight: 1.6,
            }}
          >
            The link may be broken or the page may have moved.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: 'var(--brand-red-hot)',
              color: 'var(--white)',
              padding: '12px 28px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
