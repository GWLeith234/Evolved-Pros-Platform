import type { Metadata } from 'next'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { SUPPORT_EMAIL } from '@/lib/layout/publicFooter'
import { REGISTERED_OFFICE_LINES } from '@/lib/layout/legalCopy'
import {
  LegalAddress,
  LegalList,
  LegalMail,
  LegalP,
  LegalPage,
  LegalSection,
} from '@/components/layout/LegalPage'

// Unique title on purpose — this page must NOT inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata('/privacy', {
  title: 'Privacy Policy — Evolved Pros',
  description:
    'What Evolved Pros collects, how it is used, who processes it, and how to reach us about your data.',
})

/**
 * SPRINT FOOTER-1 — /privacy (previously a 404).
 *
 * Sections are fixed by the sprint card. The registered office lives in
 * lib/layout/legalCopy.ts (same block as /terms). The Payments section says
 * only that payments are processed by Stripe — refund and cancellation
 * language lives on /terms. Do not add a privacy-law treatise here.
 *
 * The processor list mirrors what the app actually calls: Supabase (auth +
 * database), Stripe (payments), Resend (email), Mux (video), Google Analytics
 * and Microsoft Clarity (both optional, see lib/analytics/public-ids.ts). Keep
 * it honest — if a processor is added or dropped, edit this list.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <p style={{ margin: 0 }}>
          This policy explains what we collect when you use Evolved Pros, why we collect
          it, who processes it on our behalf, and how to reach us about it.
        </p>
      }
    >
      <LegalSection title="Who we are">
        <LegalP>Evolved Pros is operated by GWLeith Revenue Growth Solutions.</LegalP>
        <LegalP>
          GWLeith Revenue Growth Solutions is the party responsible for the personal
          information described on this page.
        </LegalP>
        <LegalAddress lines={REGISTERED_OFFICE_LINES} />
      </LegalSection>

      <LegalSection title="What we collect">
        <LegalList
          items={[
            'Account information — the name and email address you register with, and your authentication credentials.',
            'Profile information — anything you choose to add to your profile, such as a photo, title, company, or bio.',
            'Membership information — your plan, tier, and membership status.',
            'Content you create — community posts, comments, messages, event registrations, assessment answers, and course progress.',
            'Support correspondence — the messages you send us and our replies.',
            'Technical and usage data — IP address, browser and device type, pages viewed, and referring page.',
          ]}
        />
        <LegalP>
          We use this information to run your account, deliver the parts of the platform
          your plan includes, keep the service secure, respond to you, and improve how
          the platform works.
        </LegalP>
      </LegalSection>

      <LegalSection title="Payments">
        <LegalP>Payments are processed by Stripe.</LegalP>
      </LegalSection>

      <LegalSection title="Cookies and analytics">
        <LegalP>
          We use cookies and similar browser storage to keep you signed in, remember
          your theme preference, and keep the platform secure. These are necessary for
          the platform to work.
        </LegalP>
        <LegalP>
          We also use analytics to understand how the site is used in aggregate —
          Google Analytics and Microsoft Clarity. These are enabled only when they are
          configured for the environment you are visiting, and we use them to measure
          traffic and diagnose usability problems, not to build advertising profiles.
        </LegalP>
        <LegalP>
          Your browser can block or clear cookies. Blocking the necessary ones will sign
          you out and stop member areas from working.
        </LegalP>
      </LegalSection>

      <LegalSection title="Retention, sharing, and your rights">
        <LegalP>
          <strong style={{ color: 'var(--text-primary)' }}>Retention.</strong> We keep
          account and content data for as long as your account is open, and afterwards
          only as long as we need it to meet legal, accounting, or security obligations.
        </LegalP>
        <LegalP>
          <strong style={{ color: 'var(--text-primary)' }}>Sharing.</strong> We do not
          sell your personal information. We share it only with the service providers
          that run the platform for us, and only so they can do that work:
        </LegalP>
        <LegalList
          items={[
            'Supabase — authentication, database, and file storage.',
            'Stripe — payment processing.',
            'Resend — transactional and membership email.',
            'Mux — video hosting and playback.',
            'Google Analytics and Microsoft Clarity — site analytics, where enabled.',
          ]}
        />
        <LegalP>
          We may also disclose information if we are legally required to, or to protect
          the rights and safety of our members and the platform.
        </LegalP>
        <LegalP>
          <strong style={{ color: 'var(--text-primary)' }}>Your rights.</strong> You can
          ask us to give you a copy of the personal information we hold about you,
          correct it, or delete it, and you can ask us to stop sending marketing email —
          every marketing email also carries an unsubscribe link. Write to{' '}
          <LegalMail address={SUPPORT_EMAIL} /> and we will action the request.
        </LegalP>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          Privacy questions and data requests: <LegalMail address={SUPPORT_EMAIL} />
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}
