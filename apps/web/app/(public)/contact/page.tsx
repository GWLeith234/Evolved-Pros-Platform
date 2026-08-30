import Link from 'next/link'
import type { Metadata } from 'next'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { SPEAKING_EMAIL, SUPPORT_EMAIL } from '@/lib/layout/publicFooter'
import { LegalMail, LegalP, LegalPage, LegalSection } from '@/components/layout/LegalPage'

// Unique title on purpose — this page must NOT inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata('/contact', {
  title: 'Contact — Evolved Pros',
  description:
    'Reach Evolved Pros: support@evolvedpros.com for the platform and membership, speaking@evolvedpros.com for keynote inquiries.',
})

/**
 * SPRINT FOOTER-1 — /contact (previously a 404).
 *
 * Two published inboxes and nothing else: no form, no new API route, no new
 * backend. Addresses live in lib/layout/publicFooter.ts so the footer, the
 * legal pages, and this page cannot drift apart. George's personal
 * evolvex360.com address is deliberately not published here.
 */
export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Get in touch"
      intro={
        <p style={{ margin: 0 }}>
          Two inboxes, both read by a human. Pick the one that matches what you need.
        </p>
      }
    >
      <LegalSection title="Platform and membership support">
        <LegalP>
          Billing, access, your plan, a bug, or anything that isn&rsquo;t working:{' '}
          <LegalMail address={SUPPORT_EMAIL} />
        </LegalP>
        <LegalP>
          Include the email address on your account and, if it helps, the page you were
          on — it gets you a faster answer.
        </LegalP>
      </LegalSection>

      <LegalSection title="Keynotes and speaking">
        <LegalP>
          To book George for a keynote, workshop, or event:{' '}
          <LegalMail address={SPEAKING_EMAIL} />
        </LegalP>
        <LegalP>
          Dates, formats, and past stages are on the{' '}
          <Link href="/live" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            LIVE page
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="Privacy and legal">
        <LegalP>
          Data requests and questions about our{' '}
          <Link href="/terms" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            terms
          </Link>{' '}
          or{' '}
          <Link href="/privacy" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            privacy policy
          </Link>{' '}
          also go to <LegalMail address={SUPPORT_EMAIL} />.
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}
