import Link from 'next/link'
import type { Metadata } from 'next'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { SPEAKING_EMAIL, SUPPORT_EMAIL } from '@/lib/layout/publicFooter'
import {
  LegalList,
  LegalMail,
  LegalP,
  LegalPage,
  LegalSection,
  LegalTodo,
} from '@/components/layout/LegalPage'

// Unique title on purpose — this page must NOT inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata('/terms', {
  title: 'Terms of Service — Evolved Pros',
  description:
    'The terms that govern membership and use of the Evolved Pros platform, operated by GWLeith Revenue Growth Solutions.',
})

/**
 * SPRINT FOOTER-1 — /terms (previously a 404).
 *
 * Sections and their order are fixed by the sprint card. Three blanks are
 * deliberately unwritten and marked `TODO GEORGE / COUNSEL`: registered office
 * / mailing address (Who we are), refund / cancellation (Plans), and governing
 * law + venue (Changes). Do not fill these in from a template — they are
 * counsel's call, and the entity is GWLeith Revenue Growth Solutions, not
 * Evolved Pros, Evolved Publishing or EvolveX360.
 *
 * The Plans section mirrors /pricing (lib/pricing.ts). If the ladder changes,
 * change both.
 */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro={
        <p style={{ margin: 0 }}>
          These terms govern your access to and use of the Evolved Pros website and
          membership platform. By creating an account or using the platform, you agree
          to them.
        </p>
      }
    >
      <LegalSection title="Who we are">
        <LegalP>Evolved Pros is operated by GWLeith Revenue Growth Solutions.</LegalP>
        <LegalP>
          &ldquo;We&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean GWLeith Revenue
          Growth Solutions. &ldquo;You&rdquo; means the person using the platform.
          &ldquo;Platform&rdquo; means evolvedpros.com and the Evolved Pros member
          application.
        </LegalP>
        <LegalTodo label="Registered office / mailing address" />
      </LegalSection>

      <LegalSection title="The service">
        <LegalP>
          The platform is a membership product for working professionals. Depending on
          your plan it includes the community feed, the Evolved Academy curriculum
          across the six pillars, the Pillar Assessment, events and LIVE dates, the
          podcast, and Evolved Media editorial.
        </LegalP>
        <LegalP>
          The platform is under active development. We may add, change, or retire
          features, and we may change how content is organised or delivered.
        </LegalP>
      </LegalSection>

      <LegalSection title="Accounts and access">
        <LegalList
          items={[
            'You need an account to reach member areas. Give accurate information when you register and keep it current.',
            'Accounts are personal and non-transferable. Do not share your login.',
            'You are responsible for keeping your credentials secure and for activity that happens under your account.',
            'You must be at least 18 years old to hold an account.',
            <>
              Tell us at <LegalMail address={SUPPORT_EMAIL} /> if you believe your
              account has been used without your permission.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Plans">
        <LegalP>
          Membership tiers, and what each one unlocks, are listed on{' '}
          <Link href="/pricing" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            the pricing page
          </Link>
          , which is the current source of truth:
        </LegalP>
        <LegalList
          items={[
            'Free — community, podcast, media, events, the Pillar Assessment, and Academy Pillar 1.',
            'VIP — $49 per month.',
            'Professional — $249 per month.',
            'Keynotes — inquire.',
          ]}
        />
        <LegalP>
          Prices are in US dollars and exclude any taxes that apply where you are. Paid
          plans renew for successive terms until they are cancelled. Payments are
          processed by Stripe.
        </LegalP>
        <LegalTodo label="Refund and cancellation terms" />
      </LegalSection>

      <LegalSection title="Acceptable use">
        <LegalP>While using the platform, do not:</LegalP>
        <LegalList
          items={[
            'Copy, resell, republish, or redistribute Academy material, podcast content, or editorial content outside the platform.',
            'Share your account, your access links, or your session with anyone else.',
            'Post content that is unlawful, harassing, hateful, defamatory, or that infringes someone else’s rights.',
            'Upload malware, scrape the platform at scale, or try to bypass access controls, rate limits, or paywalls.',
            'Impersonate another member, or misrepresent your affiliation with a person or organisation.',
          ]}
        />
        <LegalP>
          We may remove content that breaks these rules and may restrict accounts that
          repeatedly do.
        </LegalP>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <LegalP>
          The platform and its content — course material, video, written editorial, the
          podcast, the EVOLVED Architecture framework, and the Evolved Pros name and
          marks — belong to GWLeith Revenue Growth Solutions or to its licensors.
        </LegalP>
        <LegalP>
          Your membership grants a personal, non-exclusive, non-transferable, revocable
          right to access that content for your own professional development while your
          plan is active. It does not transfer ownership of anything.
        </LegalP>
        <LegalP>
          Content you post stays yours. By posting it you give us a non-exclusive,
          worldwide licence to host, store, reproduce, and display it for the purpose of
          operating and promoting the platform.
        </LegalP>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <LegalP>
          The platform and its content are provided on an &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo; basis. We do not warrant that the platform will be
          uninterrupted, error-free, or secure, or that any content will be accurate or
          complete.
        </LegalP>
        <LegalP>
          Content on the platform is educational. It is not legal, financial,
          accounting, tax, medical, or therapeutic advice, and it is not a promise of any
          particular business or personal result. Decisions you make after using it are
          yours.
        </LegalP>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <LegalP>
          To the fullest extent permitted by law, GWLeith Revenue Growth Solutions is
          not liable for indirect, incidental, special, consequential, or punitive
          damages, or for lost profits, lost revenue, lost data, or loss of goodwill,
          arising out of or relating to your use of the platform.
        </LegalP>
        <LegalP>
          To the fullest extent permitted by law, our total aggregate liability arising
          out of or relating to the platform is limited to the amount you paid us for
          membership in the twelve months before the event giving rise to the claim.
        </LegalP>
        <LegalP>
          Nothing in these terms limits liability that cannot be limited by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Termination">
        <LegalP>
          You may stop using the platform at any time, and you may cancel a paid plan as
          described on the pricing page and in your account.
        </LegalP>
        <LegalP>
          We may suspend or end your access if you break these terms, if your payment
          fails, or if we are required to by law. We may also discontinue the platform.
        </LegalP>
        <LegalP>
          When access ends, your right to use member areas and their content ends with
          it. The intellectual property, disclaimer, and limitation of liability
          sections survive.
        </LegalP>
      </LegalSection>

      <LegalSection title="Changes">
        <LegalP>
          We may update these terms as the platform changes. The current version always
          lives on this page. If a change is material we will say so here, and
          continuing to use the platform after that means you accept the updated terms.
        </LegalP>
        <LegalTodo label="Governing law and venue" />
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          Questions about these terms: <LegalMail address={SUPPORT_EMAIL} />
        </LegalP>
        <LegalP>
          Keynote and speaking inquiries: <LegalMail address={SPEAKING_EMAIL} />
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}
