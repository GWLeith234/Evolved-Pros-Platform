import type { Metadata } from 'next'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { suppressProspect } from '@/lib/email/suppression'
import { ResubscribeButton } from './ResubscribeButton'

export const metadata: Metadata = {
  title: 'Unsubscribe — Evolved Pros',
  // Never let an unsubscribe URL (which contains a live token) into an index.
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Public unsubscribe confirmation (SPRINT EM-1).
 *
 * Suppression happens on GET. That is deliberate despite the usual "GET must
 * not mutate" rule: a recipient clicking Unsubscribe in their mail client
 * expects to be done, not to land on a page with another button to press.
 * The write is idempotent and requires a valid HMAC token, so a prefetch or a
 * double-click cannot do anything a single click didn't already do.
 *
 * An invalid, forged or expired token gets the SAME neutral page as a valid
 * one for an id that no longer exists — the page must never reveal whether a
 * given prospect id is real.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  // Next hands a repeated ?token= through as string[]; typing it honestly
  // keeps the runtime shape and the compiler in agreement.
  searchParams: { token?: string | string[] }
}) {
  const raw = searchParams.token
  const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined

  const verified = verifyUnsubscribeToken(token)
  let suppressed = false
  if (verified.ok) {
    suppressed = (await suppressProspect(verified.prospectId)) === 'ok'
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderTop: '3px solid var(--brand-gold)',
          padding: 'clamp(24px, 5vw, 40px)',
        }}
      >
        <p
          className="font-condensed font-bold uppercase"
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.32em',
            color: 'var(--brand-gold)',
          }}
        >
          Evolved Pros
        </p>

        {suppressed ? (
          <>
            <h1
              className="font-display font-black"
              style={{
                margin: '10px 0 12px',
                fontSize: 'clamp(26px, 4vw, 34px)',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              You&rsquo;re unsubscribed.
            </h1>
            <p
              className="font-body"
              style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}
            >
              You won&rsquo;t receive any more campaign email from us. This doesn&rsquo;t affect
              anything you asked us for directly — receipts, account email, and anything you
              replied to still reach you.
            </p>
            <p
              className="font-condensed font-bold uppercase"
              style={{
                margin: '0 0 10px',
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'var(--text-tertiary)',
              }}
            >
              Changed your mind?
            </p>
            <ResubscribeButton token={token as string} />
          </>
        ) : (
          <>
            <h1
              className="font-display font-black"
              style={{
                margin: '10px 0 12px',
                fontSize: 'clamp(26px, 4vw, 34px)',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              This link isn&rsquo;t valid.
            </h1>
            {/* Same copy for forged, expired, and unknown-id — no oracle. */}
            <p
              className="font-body"
              style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}
            >
              It may have expired, or been copied incompletely from the email. To be taken off the
              list for certain, reply to any message from us or email{' '}
              <a href="mailto:george@evolvex360.com" style={{ color: 'var(--brand-gold)' }}>
                george@evolvex360.com
              </a>{' '}
              and we&rsquo;ll take care of it by hand.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
