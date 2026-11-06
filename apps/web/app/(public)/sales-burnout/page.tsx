import type { Metadata } from 'next'
import { AnswerPage } from '@/components/answers/AnswerPage'
import { LdJsonGraph } from '@/components/seo/LdJson'
import { SALES_BURNOUT, answerPageSchemas } from '@/lib/answers/pages'
import { publicPageMetadata } from '@/lib/seo/canonical'

// Unique title on purpose. This page must not inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata(SALES_BURNOUT.path, {
  title: SALES_BURNOUT.title,
  description: SALES_BURNOUT.description,
})

/**
 * Public indexable /sales-burnout. Static, under app/(public), absent from
 * the middleware matcher, so an anonymous visitor gets the HTML.
 */
export default function SalesBurnoutPage() {
  return (
    <>
      <LdJsonGraph schemas={answerPageSchemas(SALES_BURNOUT)} />
      <AnswerPage page={SALES_BURNOUT} />
    </>
  )
}
