import { fitDocumentTitle } from '@/lib/seo/documentTitle'

/** Public /media brand lock. On-page chrome and section document titles use this. */
export const MEDIA_BRAND = 'Evolved Pros Media'

/**
 * CollectionPage JSON-LD name for /media. Kept apart from the document
 * title so the SERP title can be shortened without rewriting JSON-LD.
 */
export const MEDIA_HUB_TITLE =
  'Evolved Pros Media | Sales & Personal Development Intelligence'

/** Document <title> / og:title / twitter:title for /media. At most 60 characters. */
export const MEDIA_HUB_DOCUMENT_TITLE =
  'Evolved Pros Media | Sales & Personal Development'

export const MEDIA_HUB_DESCRIPTION =
  'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.'

/** Leftover desk line. Not rendered in the platform wordmark masthead. No em dash. */
export const MEDIA_DESK_TAGLINE =
  'The Evolved Pros desk for sales, identity, and execution stories.'

/** Article <title> only. H1 stays the stored headline. */
export function mediaStoryTitle(storyTitle: string, seoTitle?: string | null): string {
  return fitDocumentTitle(storyTitle, seoTitle)
}

export function mediaSectionTitle(section: string): string {
  return `${section} | ${MEDIA_BRAND}`
}
