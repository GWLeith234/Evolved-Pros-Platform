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
  is_published?: boolean | null
}

export type MediaSitemapEntry = {
  url: string
  lastModified: Date
  changeFrequency: 'monthly'
  priority: number
}

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
 * Map published media_stories rows to sitemap entries.
 * Unpublished rows and rows missing pillar/slug are dropped.
 * lastmod / changeFrequency / priority match podcast episode entries.
 */
export function toMediaSitemapEntries(
  base: string,
  rows: MediaStorySitemapRow[],
): MediaSitemapEntry[] {
  const entries: MediaSitemapEntry[] = []
  for (const row of rows) {
    if (row.is_published !== true) continue
    const path = mediaArticlePath(row.pillar, row.slug)
    if (!path) continue
    entries.push({
      url: `${base}${path}`,
      lastModified: row.published_at ? new Date(row.published_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }
  return entries
}
