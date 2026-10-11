/**
 * Indexing rule for a /media listing that renders a published collection.
 *
 * Count 0 → noindex, follow. Next.js serializes
 * `{ index: false, follow: true }` to
 * `<meta name="robots" content="noindex, follow">`.
 * A positive count returns {} so the document emits no robots meta and
 * stays indexable. Callers pass the length of the list that route
 * already renders. There is no slug list.
 */

export const EMPTY_MEDIA_LISTING_ROBOTS = {
  index: false,
  follow: true,
} as const

export function mediaListingRobots(
  publishedCount: number,
): { robots?: typeof EMPTY_MEDIA_LISTING_ROBOTS } {
  if (publishedCount === 0) return { robots: EMPTY_MEDIA_LISTING_ROBOTS }
  return {}
}
