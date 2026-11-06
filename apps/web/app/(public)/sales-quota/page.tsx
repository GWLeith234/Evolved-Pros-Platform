import type { Metadata } from 'next'
import { AnswerPage } from '@/components/answers/AnswerPage'
import { LdJsonGraph } from '@/components/seo/LdJson'
import { SALES_QUOTA, answerPageSchemas } from '@/lib/answers/pages'
import { publicPageMetadata } from '@/lib/seo/canonical'

// Unique title on purpose. This page must not inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata(SALES_QUOTA.path, {
  title: SALES_QUOTA.title,
  description: SALES_QUOTA.description,
})

/**
 * Public indexable /sales-quota. Static, under app/(public), absent from
 * the middleware matcher, so an anonymous visitor gets the HTML.
 */
export default function SalesQuotaPage() {
  return (
    <>
      <LdJsonGraph schemas={answerPageSchemas(SALES_QUOTA)} />
      <AnswerPage page={SALES_QUOTA} />
    </>
  )
}
