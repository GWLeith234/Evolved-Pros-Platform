import type { Metadata } from 'next'
import { AnswerPage } from '@/components/answers/AnswerPage'
import { LdJsonGraph } from '@/components/seo/LdJson'
import { SALES_COACHING, answerPageSchemas } from '@/lib/answers/pages'
import { publicPageMetadata } from '@/lib/seo/canonical'

// Unique title on purpose. This page must not inherit the homepage meta.
export const metadata: Metadata = publicPageMetadata(SALES_COACHING.path, {
  title: SALES_COACHING.title,
  description: SALES_COACHING.description,
})

/**
 * Public indexable /sales-coaching. Static, under app/(public), absent from
 * the middleware matcher, so an anonymous visitor gets the HTML.
 */
export default function SalesCoachingPage() {
  return (
    <>
      <LdJsonGraph schemas={answerPageSchemas(SALES_COACHING)} />
      <AnswerPage page={SALES_COACHING} />
    </>
  )
}
