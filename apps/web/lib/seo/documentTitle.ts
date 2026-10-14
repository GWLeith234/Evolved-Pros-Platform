/**
 * Document <title> length for Google SERP display.
 *
 * Google truncates titles past about 60 characters. This helper is for the
 * <title> element (and og:title / twitter:title when they share that string).
 * It does not rewrite H1s, JSON-LD names, descriptions, or stored headlines.
 *
 * Headlines that do not fit use SHORT_DOCUMENT_TITLES. A word-boundary cut
 * is only a last resort, and the sitemap title test fails when one is needed.
 */

import { SHORT_DOCUMENT_TITLES } from './shortDocumentTitles'

export const DOCUMENT_TITLE_LIMIT = 60

/** Short brand suffix. Replaces " | The Evolved Pros Podcast" and " | Evolved Pros Media". */
export const DOCUMENT_TITLE_SUFFIX = ' | Evolved Pros'

const LEGACY_DOCUMENT_SUFFIXES = [
  ' | Evolved Pros Media',
  ' | The Evolved Pros Podcast',
] as const

/**
 * Words that should not end a cut title. Dropped only after a length cut,
 * and only from the tail, so a headline that already fits is left alone.
 */
const DANGLING_LAST_WORD = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'nor',
  'for',
  'with',
  'of',
  'to',
  'into',
  'on',
  'in',
  'from',
  'by',
  'as',
  'at',
  'that',
  "they're",
  "it’s",
  "it's",
  "that's",
  "that’s",
  'who',
  'whom',
  'whose',
])

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripDanglingTail(value: string): string {
  let next = value.replace(/[\s,;:&|/\-]+$/u, '').trim()
  next = next.replace(/\s+\([^)]*$/u, '').trim()
  const words = next.split(' ')
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase().replace(/[.,;:&|/?]+$/u, '')
    if (!DANGLING_LAST_WORD.has(last)) break
    words.pop()
  }
  return words.join(' ').replace(/[\s,;:&|/\-]+$/u, '').trim()
}

/** Cut on a word boundary. No ellipsis. Result length is at most `limit`. */
export function truncateDocumentTitle(text: string, limit = DOCUMENT_TITLE_LIMIT): string {
  const clean = normalize(text)
  if (clean.length <= limit) return clean
  const window = clean.slice(0, limit)
  const space = window.lastIndexOf(' ')
  const cut = stripDanglingTail(space > 0 ? window.slice(0, space) : window)
  if (cut.length > 0 && cut.length <= limit) return cut
  return window.trim()
}

function isLegacyTemplate(seo: string, headline: string): boolean {
  if (seo === `${headline}${DOCUMENT_TITLE_SUFFIX}`) return true
  return LEGACY_DOCUMENT_SUFFIXES.some(suffix => seo === `${headline}${suffix}`)
}

/**
 * A stored seo_title is usable when it is its own short title.
 * A mid-word chop of the headline (a strict prefix) is not.
 */
function usableSeoTitle(seoTitle: string | null | undefined, headline: string): string | null {
  if (!seoTitle) return null
  const seo = normalize(seoTitle)
  if (!seo || seo.length > DOCUMENT_TITLE_LIMIT) return null
  if (seo === headline) return null
  if (isLegacyTemplate(seo, headline)) return null
  if (seo.length >= headline.length) return null
  if (headline.startsWith(seo)) return null
  return seo
}

/**
 * A hand-written short title is used only when it is a complete title of
 * 60 characters or less. Longer entries are ignored.
 */
export function acceptedShortTitle(value: string | null | undefined): string | null {
  if (!value) return null
  const clean = normalize(value)
  if (!clean || clean.length > DOCUMENT_TITLE_LIMIT) return null
  return clean
}

export function shortTitleForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null
  return acceptedShortTitle(SHORT_DOCUMENT_TITLES[slug])
}

export type DocumentTitleResolution = {
  title: string
  /** True when the title was cut on a word boundary. Sitemap titles must not set this. */
  truncated: boolean
}

function withBrandWhenItFits(text: string): string {
  const withBrand = `${text}${DOCUMENT_TITLE_SUFFIX}`
  return withBrand.length <= DOCUMENT_TITLE_LIMIT ? withBrand : text
}

/**
 * Headline plus " | Evolved Pros" when that fits in 60 characters.
 * Otherwise the headline alone, then a hand-written short title for the
 * slug (also with the suffix when it fits), then a distinct seo_title
 * that fits, then a word-boundary cut of the headline.
 */
export function resolveDocumentTitle(
  headline: string,
  seoTitle?: string | null,
  slug?: string | null,
): DocumentTitleResolution {
  const head = normalize(headline)
  if (!head) {
    const manual = shortTitleForSlug(slug)
    if (manual) return { title: withBrandWhenItFits(manual), truncated: false }
    const seo = usableSeoTitle(seoTitle, head)
    return { title: seo ?? '', truncated: false }
  }
  const withBrand = `${head}${DOCUMENT_TITLE_SUFFIX}`
  if (withBrand.length <= DOCUMENT_TITLE_LIMIT) return { title: withBrand, truncated: false }
  if (head.length <= DOCUMENT_TITLE_LIMIT) return { title: head, truncated: false }
  const manual = shortTitleForSlug(slug)
  if (manual) return { title: withBrandWhenItFits(manual), truncated: false }
  const seo = usableSeoTitle(seoTitle, head)
  if (seo) return { title: seo, truncated: false }
  return { title: truncateDocumentTitle(head), truncated: true }
}

export function fitDocumentTitle(
  headline: string,
  seoTitle?: string | null,
  slug?: string | null,
): string {
  return resolveDocumentTitle(headline, seoTitle, slug).title
}
