import type { Metadata } from 'next'
import { publicPageMetadata } from '@/lib/seo/canonical'
import {
  EXTENSION_PRIVACY_DESCRIPTION,
  EXTENSION_PRIVACY_PATH,
  EXTENSION_PRIVACY_SUPPORT_EMAIL,
  EXTENSION_PRIVACY_TITLE,
} from '@/lib/legal/extensionPrivacy'
import { LegalMail, LegalP, LegalPage, LegalSection } from '@/components/layout/LegalPage'

// Unique title on purpose. This page must not inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata(EXTENSION_PRIVACY_PATH, {
  title: EXTENSION_PRIVACY_TITLE,
  description: EXTENSION_PRIVACY_DESCRIPTION,
})

/**
 * Privacy policy for the WIG Tracker browser extension (by Evolved Pros).
 * The Edge Add-ons listing links here. Static, under app/(public), absent
 * from the middleware matcher, so anonymous visitors get the HTML.
 * Keep this honest: if the extension ever makes a network request, edit it.
 */
export default function ExtensionPrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="WIG Tracker extension: Privacy Policy"
      intro={
        <p style={{ margin: 0 }}>
          This policy covers the WIG Tracker browser extension by Evolved Pros.
        </p>
      }
    >
      <LegalSection title="What the extension stores">
        <LegalP>
          WIG Tracker stores the goal, numbers, leading measures, weekly commits and
          check-in dates you enter only on your device, using your browser&apos;s local
          storage. This information is never sent to Evolved Pros or anyone else.
        </LegalP>
      </LegalSection>
      <LegalSection title="What it does not do">
        <LegalP>
          The extension makes no network requests and uses no analytics, no cookies and
          no accounts. Removing the extension deletes this data.
        </LegalP>
        <LegalP>
          The link to evolvedpros.com opens in a normal browser tab, where the{' '}
          <a href="/privacy" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            Evolved Pros website privacy policy
          </a>{' '}
          applies.
        </LegalP>
      </LegalSection>
      <LegalSection title="Contact">
        <LegalP>
          Questions about the extension: <LegalMail address={EXTENSION_PRIVACY_SUPPORT_EMAIL} />
        </LegalP>
      </LegalSection>
    </LegalPage>
  )
}
