/**
 * Bare /media/<slug> classification for the middleware redirect.
 *
 * The pillar page is ISR (revalidate 120). permanentRedirect() inside that
 * page is stored in the Full Route Cache; a later HIT keeps status 308 and
 * drops Location, leaving only the client-side redirect in the RSC payload.
 * Middleware answers before that cache: 301 with Location, or 404, both
 * no-store. Known pillars and static section folders are not candidates.
 */
import { mediaStoryHref } from '@/lib/media/paths'
import { isPillarSlug } from '@/lib/pillars'

/** Folders under app/(public)/media that own their URL. Not story slugs. */
export const MEDIA_STATIC_SECTIONS = [
  'academy',
  'ai-trends',
  'careers',
  'community',
  'events',
  'evolved-architecture',
  'leadership',
  'podcast',
  'preview',
  'wellness',
] as const

const STATIC_SECTIONS: ReadonlySet<string> = new Set(MEDIA_STATIC_SECTIONS)

/** Pillar hubs plus ORIGINAL stories, which the page serves as /media/general. */
const EXTRA_PILLARS: ReadonlySet<string> = new Set(['general'])

/** Fallback responses must not enter a shared or Next.js data cache. */
export const MEDIA_SLUG_FALLBACK_CACHE = 'private, no-store'

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export function isReservedMediaSegment(segment: string): boolean {
  return isPillarSlug(segment) || EXTRA_PILLARS.has(segment) || STATIC_SECTIONS.has(segment)
}

/**
 * The single segment of /media/<segment>, or null when this request must
 * fall through: the hub, a nested article, a known pillar, or a static section.
 * A trailing slash is ignored so /media/<slug>/ is the same lookup.
 */
export function mediaSlugCandidate(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const match = /^\/media\/([^/]+)$/.exec(path)
  if (!match) return null
  const segment = match[1]
  if (!segment || isReservedMediaSegment(segment)) return null
  return segment
}

export type PublishedStoryRef = {
  pillar: string | null
  slug: string
}

/**
 * Canonical article path for a published row. Null when the slug or pillar
 * is not a single safe path segment (no scheme, dots, or slashes).
 */
export function locationForPublishedStory(story: PublishedStoryRef): string | null {
  if (!SAFE_SEGMENT.test(story.slug)) return null
  const pillar = story.pillar && story.pillar !== 'null' ? story.pillar : null
  if (pillar && !SAFE_SEGMENT.test(pillar)) return null
  return mediaStoryHref(pillar, story.slug)
}
