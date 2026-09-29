/**
 * Sitemap helpers for public media articles.
 *
 * URL shape matches /media/[pillar]/[slug]: the `media_stories.pillar`
 * column is already the route slug (foundation, identity, …), same as
 * generateStaticParams and MediaPortalClient.storyUrl. Rows missing
 * pillar or slug are skipped so we never emit a 404 path.
 */

export type MediaStorySitemapRow = {
  pillar: string | null
  slug: string | null
  published_at: string | null
  /** dateModified. Preferred over published_at for sitemap lastmod. */
  updated_at?: string | null
  is_published?: boolean | null
}

export type MediaSitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency: 'daily' | 'monthly'
  priority: number
}

/**
 * Indexable /media/<pillar> hubs. Live, self-canonical, linked from the
 * media masthead. Program order matches lib/pillars PILLARS.
 */
export const MEDIA_CATEGORY_HUB_PATHS = [
  '/media/foundation',
  '/media/identity',
  '/media/mental-toughness',
  '/media/strategy',
  '/media/accountability',
  '/media/execution',
] as const

/**
 * Unpublished stories that must never appear in the sitemap, even if a
 * query drops the is_published filter or a row is flagged true by mistake.
 */
export const UNPUBLISHED_MEDIA_PATHS = new Set([
  '/media/execution/why-elite-sales-teams-swear-by-ritual-not-motivation',
  '/media/strategy/build-repeatable-sales-strategy-framework',
])

/** Same path the live article route serves. Null if pillar or slug is missing. */
export function mediaArticlePath(
  pillar: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  const p = pillar?.trim()
  const s = slug?.trim()
  if (!p || !s) return null
  return `/media/${p}/${s}`
}

/**
 * Whether a media_stories row belongs on the public /media hub.
 * Unpublished rows, the explicit unpublished-slug denylist, and rows
 * missing pillar/slug are excluded.
 */
export function isListedPublicMediaStory(story: {
  pillar: string | null | undefined
  slug: string | null | undefined
  is_published?: boolean | null
}): boolean {
  if (story.is_published === false) return false
  const path = mediaArticlePath(story.pillar, story.slug)
  if (path === '/media/preview' || path?.startsWith('/media/preview/')) return false
  return Boolean(path && !UNPUBLISHED_MEDIA_PATHS.has(path))
}

/** Drop unpublished / denylisted / incomplete rows from a hub listing. */
export function listPublicMediaStories<T extends {
  pillar: string | null | undefined
  slug: string | null | undefined
  is_published?: boolean | null
}>(stories: T[]): T[] {
  return stories.filter(isListedPublicMediaStory)
}

function isSitemapArticle(row: MediaStorySitemapRow): boolean {
  if (row.is_published !== true) return false
  const path = mediaArticlePath(row.pillar, row.slug)
  if (!path || UNPUBLISHED_MEDIA_PATHS.has(path)) return false
  if (path === '/media/preview' || path.startsWith('/media/preview/')) return false
  return true
}

/**
 * Honest article lastmod: dateModified (`updated_at`) when the row has one,
 * otherwise datePublished. Missing or unparseable timestamps are omitted —
 * never substituted with the request clock.
 */
export function mediaSitemapLastModified(row: {
  published_at?: string | null
  updated_at?: string | null
}): Date | undefined {
  const raw = (row.updated_at ?? '').trim() || (row.published_at ?? '').trim()
  if (!raw) return undefined
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Map published media_stories rows to sitemap entries.
 * Unpublished rows, the explicit unpublished-slug denylist, and rows
 * missing pillar/slug are dropped.
 * changeFrequency / priority match podcast episode entries.
 */
export function toMediaSitemapEntries(
  base: string,
  rows: MediaStorySitemapRow[],
): MediaSitemapEntry[] {
  const entries: MediaSitemapEntry[] = []
  for (const row of rows) {
    if (!isSitemapArticle(row)) continue
    const path = mediaArticlePath(row.pillar, row.slug)
    if (!path) continue
    const lastModified = mediaSitemapLastModified(row)
    entries.push({
      url: `${base}${path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }
  return entries
}

/**
 * The six pillar hubs. Always emitted (they are real indexable routes, even
 * before the first story in that pillar). lastmod is the newest included
 * story in that pillar, not the request clock.
 */
export function toMediaCategoryHubEntries(
  base: string,
  rows: MediaStorySitemapRow[],
): MediaSitemapEntry[] {
  return MEDIA_CATEGORY_HUB_PATHS.map(path => {
    let newest: Date | undefined
    for (const row of rows) {
      if (!isSitemapArticle(row)) continue
      const articlePath = mediaArticlePath(row.pillar, row.slug)
      if (!articlePath?.startsWith(`${path}/`)) continue
      const lastModified = mediaSitemapLastModified(row)
      if (!lastModified) continue
      if (!newest || lastModified.getTime() > newest.getTime()) newest = lastModified
    }
    return {
      url: `${base}${path}`,
      ...(newest ? { lastModified: newest } : {}),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }
  })
}
