/**
 * Pure sitemap entry builders. No Supabase, no next/cache.
 * app/sitemap.ts is the only caller that fetches. Vitest cannot import
 * that module (admin client throws at import), so the dates and the hub
 * list live here.
 */

import {
  MEDIA_PILLAR_HUB_PATHS,
  PUBLIC_SITEMAP_PATHS,
  type PublicSitemapPath,
} from './publicRoutes'

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

/** Below /media (0.7). Hubs are indexable, the desk home ranks first. */
export const MEDIA_PILLAR_HUB_SITEMAP_PRIORITY = 0.6

export const MEDIA_PILLAR_HUB_CHANGE_FREQUENCY = 'weekly' as const

/**
 * First parseable of updated_at, then published_at.
 * Returns undefined when both are missing so callers omit lastmod.
 * The clock is never read here: only a stored timestamp is parsed.
 */
export function sitemapLastModified(
  updatedAt: string | null | undefined,
  publishedAt: string | null | undefined,
): Date | undefined {
  for (const raw of [updatedAt, publishedAt]) {
    if (raw == null) continue
    const trimmed = raw.trim()
    if (!trimmed) continue
    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) continue
    return date
  }
  return undefined
}

/** Top-level public URLs. No lastModified: a request-time clock made two fetches differ. */
export function toStaticSitemapEntries(
  base: string,
  freq: Record<PublicSitemapPath, ChangeFrequency>,
  priority: Record<PublicSitemapPath, number>,
) {
  return PUBLIC_SITEMAP_PATHS.map(path => ({
    url: path === '/' ? base : `${base}${path}`,
    changeFrequency: freq[path],
    priority: priority[path],
  }))
}

/** Six pillar hubs. No lastModified. Priority stays under /media. */
export function toPillarHubSitemapEntries(base: string) {
  return MEDIA_PILLAR_HUB_PATHS.map(path => ({
    url: `${base}${path}`,
    changeFrequency: MEDIA_PILLAR_HUB_CHANGE_FREQUENCY,
    priority: MEDIA_PILLAR_HUB_SITEMAP_PRIORITY,
  }))
}

export type EpisodeSitemapRow = {
  slug: string | null | undefined
  published_at?: string | null
  updated_at?: string | null
}

/** Published episodes. lastModified is updated_at, else published_at, else omitted. */
export function toEpisodeSitemapEntries(base: string, episodes: EpisodeSitemapRow[]) {
  const entries: Array<{
    url: string
    lastModified?: Date
    changeFrequency: 'monthly'
    priority: number
  }> = []
  for (const episode of episodes) {
    const slug = episode.slug?.trim()
    if (!slug) continue
    const lastModified = sitemapLastModified(episode.updated_at, episode.published_at)
    entries.push({
      url: `${base}/podcast/${slug}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }
  return entries
}
