/**
 * Pure sitemap entry builders. No Supabase, no next/cache.
 * app/sitemap.ts is the only caller that fetches. Vitest cannot import
 * that module (admin client throws at import), so the dates and the hub
 * list live here.
 *
 * lastModified is always a stored timestamp or a copy constant below.
 * Nothing in this file reads the clock.
 */

import {
  MEDIA_PILLAR_HUB_PATHS,
  PUBLIC_SITEMAP_PATHS,
  type MediaPillarHubPath,
  type PublicSitemapPath,
} from './publicRoutes'

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

/** Below /media (0.7). Hubs are indexable, the desk home ranks first. */
export const MEDIA_PILLAR_HUB_SITEMAP_PRIORITY = 0.6

export const MEDIA_PILLAR_HUB_CHANGE_FREQUENCY = 'weekly' as const

/**
 * Windows that match the pages. Home takes the first cards of an
 * already-newest-first list (HOME_CONTENT_CARDS / HOME_MEDIA_STORY_COUNT).
 * The podcast index queries `.limit(100)`. The media desk shows five
 * episodes. Pillar and magazine landings query `.limit(24)`. The community
 * landing queries `.limit(8)`.
 */
export const HOME_LISTED_EPISODES = 2
export const HOME_LISTED_STORIES = 3
export const PODCAST_INDEX_LISTING_LIMIT = 100
export const MEDIA_HUB_EPISODE_LISTING_LIMIT = 5
export const MEDIA_SECTION_LISTING_LIMIT = 24
export const COMMUNITY_LISTING_LIMIT = 8

/**
 * Copy / shell dates. Bump the ISO string when that page's copy changes.
 *
 * Git is not available when the sitemap is served: the production image
 * keeps the Next standalone server only, not `.git` or the page sources
 * (apps/web/Dockerfile runner stage). These are the committer dates of the
 * files that hold the copy, in UTC, so a request cannot move them.
 *
 * Hub paths (`/`, `/podcast`, `/media`) use the date only when the listing
 * has no stored child timestamp. Static paths use the later of this date
 * and a content-record timestamp when one exists.
 */
export const STATIC_SITEMAP_COPY_LAST_MODIFIED: Record<PublicSitemapPath, string> = {
  // lib/home/conversion.ts — shell only, when no episode/story/fit date exists.
  '/': '2026-10-15T13:58:07.000Z',
  // app/(public)/podcast/(index)/page.tsx — shell only.
  '/podcast': '2026-09-25T12:18:46.000Z',
  // components/live/LiveTestimonials.tsx + lib/live/testimonials.ts (REV2).
  // Newer than app/live/page.tsx; that file is the rendered quote copy.
  '/live': '2026-10-20T01:28:26.000Z',
  // app/(public)/media/(hub)/page.tsx — shell only.
  '/media': '2026-10-15T13:58:07.000Z',
  // app/(public)/fit/page.tsx, FitMarketing.tsx, lib/fit/copy.ts.
  '/fit': '2026-10-02T04:02:47.000Z',
  // app/(public)/pricing/page.tsx (comparison copy and hero).
  '/pricing': '2026-10-15T13:58:15.000Z',
  // app/(public)/terms/page.tsx (newer than lib/layout/legalCopy.ts).
  '/terms': '2026-10-09T19:07:13.000Z',
  // app/(public)/privacy/page.tsx.
  '/privacy': '2026-10-09T19:07:13.000Z',
  // app/(public)/contact/page.tsx.
  '/contact': '2026-10-09T19:06:50.000Z',
  // app/(public)/about/page.tsx (newer than lib/about/copy.ts).
  '/about': '2026-10-09T19:06:50.000Z',
  // app/evolved/page.tsx and lib/seo/evolvedLegalJsonLd.ts.
  '/evolved': '2026-10-09T19:07:13.000Z',
  // app/(public)/extension-privacy/page.tsx and lib/legal/extensionPrivacy.ts.
  '/extension-privacy': '2026-10-27T20:30:00.000Z',
  // lib/answers/pages.ts — public answer pages, published together.
  '/sales-coaching': '2026-10-27T22:03:00.000Z',
  '/sales-quota': '2026-10-27T22:03:00.000Z',
  '/sales-burnout': '2026-10-27T22:03:00.000Z',
}

/**
 * Empty-listing shell for a pillar hub. app/(public)/media/[pillar]/page.tsx.
 * Used only when that pillar has no stored story timestamp.
 */
export const PILLAR_HUB_SHELL_LAST_MODIFIED = '2026-10-15T13:58:15.000Z'

/**
 * Empty-listing shells for content-gated /media landings.
 * Used only when the landing is included but none of its rows have a
 * stored timestamp.
 */
export const CATEGORY_LANDING_SHELL_LAST_MODIFIED: Record<string, string> = {
  // app/(public)/media/evolved-architecture/page.tsx
  '/media/evolved-architecture': '2026-10-09T19:06:02.000Z',
  // app/(public)/media/community/page.tsx
  '/media/community': '2026-10-06T15:08:17.000Z',
  // app/(public)/media/academy/page.tsx
  '/media/academy': '2026-10-06T15:08:17.000Z',
  // app/(public)/media/events/page.tsx
  '/media/events': '2026-10-06T15:08:17.000Z',
  // app/(public)/media/ai-trends/page.tsx
  '/media/ai-trends': '2026-10-09T19:06:02.000Z',
  // app/(public)/media/leadership/page.tsx
  '/media/leadership': '2026-10-09T19:06:02.000Z',
  // app/(public)/media/wellness/page.tsx
  '/media/wellness': '2026-10-09T19:06:02.000Z',
  // app/(public)/media/careers/page.tsx
  '/media/careers': '2026-10-09T19:06:02.000Z',
  // general is the [pillar] route with pillar=general.
  '/media/general': PILLAR_HUB_SHELL_LAST_MODIFIED,
}

export const CATEGORY_LANDING_SHELL_DEFAULT = '2026-10-09T19:06:02.000Z'

export type SitemapDatedRow = {
  updated_at?: string | null
  published_at?: string | null
  created_at?: string | null
}

/**
 * First parseable of updated_at, then published_at.
 * Returns undefined when both are missing so callers omit lastmod
 * on a single article or episode that has no stored timestamp.
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

/** updated_at, else published_at, else created_at. Never the clock. */
export function rowLastModified(row: SitemapDatedRow): Date | undefined {
  return sitemapLastModified(row.updated_at, row.published_at ?? row.created_at)
}

export function newestRowLastModified(rows: readonly SitemapDatedRow[]): Date | undefined {
  let best: Date | undefined
  for (const row of rows) {
    const date = rowLastModified(row)
    if (!date) continue
    if (!best || date.getTime() > best.getTime()) best = date
  }
  return best
}

/**
 * Newest stored date among the rows the page lists.
 * When none of those parse, the newest date in the wider source.
 */
export function listingLastModified(
  listed: readonly SitemapDatedRow[],
  source: readonly SitemapDatedRow[] = listed,
): Date | undefined {
  return newestRowLastModified(listed) ?? newestRowLastModified(source)
}

export function copyLastModified(path: PublicSitemapPath): Date {
  return new Date(STATIC_SITEMAP_COPY_LAST_MODIFIED[path])
}

/**
 * Static page: the content-record date when it is later than the copy
 * constant, otherwise the constant. A missing record is the constant.
 */
export function staticPageLastModified(
  path: PublicSitemapPath,
  content?: Date,
): Date {
  const copy = copyLastModified(path)
  if (!content || Number.isNaN(content.getTime())) return copy
  return content.getTime() >= copy.getTime() ? content : copy
}

/** Listing page: the child date, or the shell constant when no child has one. */
export function hubLastModified(content: Date | undefined, shellIso: string): Date {
  if (content && !Number.isNaN(content.getTime())) return content
  return new Date(shellIso)
}

export function categoryLandingShell(path: string): string {
  return CATEGORY_LANDING_SHELL_LAST_MODIFIED[path] ?? CATEGORY_LANDING_SHELL_DEFAULT
}

/** ISO-8601 strings sort chronologically. Missing dates sort last. */
export function byPublishedDesc(
  a: { published_at?: string | null },
  b: { published_at?: string | null },
): number {
  return (b.published_at ?? '').localeCompare(a.published_at ?? '')
}

export function byCreatedDesc(
  a: SitemapDatedRow,
  b: SitemapDatedRow,
): number {
  const av = a.created_at ?? a.published_at ?? a.updated_at ?? ''
  const bv = b.created_at ?? b.published_at ?? b.updated_at ?? ''
  return bv.localeCompare(av)
}

/** Top-level public URLs. lastModified is the map the caller resolved. */
export function toStaticSitemapEntries(
  base: string,
  freq: Record<PublicSitemapPath, ChangeFrequency>,
  priority: Record<PublicSitemapPath, number>,
  lastModified: Record<PublicSitemapPath, Date>,
) {
  return PUBLIC_SITEMAP_PATHS.map(path => ({
    url: path === '/' ? base : `${base}${path}`,
    lastModified: lastModified[path],
    changeFrequency: freq[path],
    priority: priority[path],
  }))
}

/**
 * Six pillar hubs. lastModified is the date for that path, or the pillar
 * shell when the map has none. Priority stays under /media.
 */
export function toPillarHubSitemapEntries(
  base: string,
  lastModifiedByPath: Partial<Record<MediaPillarHubPath, Date | undefined>> = {},
) {
  return MEDIA_PILLAR_HUB_PATHS.map(path => ({
    url: `${base}${path}`,
    lastModified: hubLastModified(lastModifiedByPath[path], PILLAR_HUB_SHELL_LAST_MODIFIED),
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
