import { MetadataRoute } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { toMediaSitemapEntries } from '@/lib/media/sitemap'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import {
  toMediaCategoryLandingSitemapEntries,
  type MediaCategoryLandingSignals,
  type MediaCategoryStoryRow,
} from '@/lib/seo/mediaCategoryLandings'
import { type PublicSitemapPath } from '@/lib/seo/publicRoutes'
import {
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  toStaticSitemapEntries,
} from '@/lib/seo/sitemapEntries'

// Brand-domain URLs on www. Never platform, never the Railway host.
//
// Next 14.2.35 does not treat `dynamic = 'force-dynamic'` as no-store for
// fetch (vercel/next.js#65170, not shipped in any 14.2 stable). The route
// module copies this `revalidate` export onto the data cache, and a missing
// revalidate is stored as CACHE_ONE_YEAR. 60 matches the /media hub, so a
// story published today is in the sitemap within a minute.
export const dynamic = 'force-dynamic'
export const revalidate = 60

type Freq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

const SITEMAP_FREQ: Record<PublicSitemapPath, Freq> = {
  '/':        'daily',
  '/podcast': 'weekly',
  '/live':    'monthly',
  '/media':   'daily',
  '/fit':     'monthly',
  '/pricing': 'monthly',
  '/terms':   'yearly',
  '/privacy': 'yearly',
  '/contact': 'yearly',
  '/about':   'yearly',
  '/evolved': 'monthly',
}

const SITEMAP_PRIORITY: Record<PublicSitemapPath, number> = {
  '/':        1,
  '/podcast': 0.9,
  '/live':    0.7,
  '/media':   0.7,
  '/fit':     0.7,
  '/pricing': 0.8,
  '/terms':   0.3,
  '/privacy': 0.3,
  '/contact': 0.4,
  '/about':   0.4,
  '/evolved': 0.8,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = CANONICAL_ORIGIN

  // GATE-1 — /community, /events, /academy and /leaderboard were REMOVED from
  // this list. All four require auth, so an anonymous request is redirected to
  // /login, and Googlebot is anonymous: we were advertising four URLs that
  // never serve their advertised content. Do NOT add them back until they are
  // genuinely anon-readable — that needs anon-role RLS, not a sitemap entry.
  //
  // /live, /pricing, and /fit stay because they are in SESSION_OPTIONAL_ROUTES:
  // middleware refreshes the session but never bounces an anonymous visitor.
  // The single source of truth for those top-level paths is PUBLIC_SITEMAP_PATHS.
  // Pillar hubs are MEDIA_PILLAR_HUB_PATHS. Category landings are appended
  // by toMediaCategoryLandingSitemapEntries only when that landing would
  // render a published story or listing. Static pages, pillar hubs, and
  // those landings omit lastModified. A request-time clock made two fetches
  // a minute apart disagree on every static URL.
  const staticRoutes: MetadataRoute.Sitemap = [
    ...toStaticSitemapEntries(base, SITEMAP_FREQ, SITEMAP_PRIORITY),
    ...toPillarHubSitemapEntries(base),
  ]

  let episodeRoutes: MetadataRoute.Sitemap = []
  try {
    const episodes = await getPublishedEpisodes()
    episodeRoutes = toEpisodeSitemapEntries(base, episodes)
  } catch {
    // Never let a DB hiccup blank the sitemap. Static routes still emit.
  }

  let mediaRoutes: MetadataRoute.Sitemap = []
  let storyRows: MediaCategoryStoryRow[] = []
  try {
    const { data } = await adminClient
      .from('media_stories')
      .select('pillar, slug, section, tags, published_at, updated_at, is_published')
      .eq('is_published', true)
    const rows = data ?? []
    storyRows = rows
    mediaRoutes = toMediaSitemapEntries(base, rows)
  } catch {
    // Same as episodes: a media query failure must not blank the sitemap.
  }

  let categoryRoutes: MetadataRoute.Sitemap = []
  try {
    const signals = await loadMediaCategoryLandingSignals(storyRows)
    categoryRoutes = toMediaCategoryLandingSitemapEntries(base, signals)
  } catch {
    // A category-landing query failure omits those URLs only.
  }

  return [...staticRoutes, ...episodeRoutes, ...mediaRoutes, ...categoryRoutes]
}

async function countHead(
  run: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function loadPublishedEventTitles(): Promise<string[]> {
  try {
    const { data, error } = await adminClient
      .from('events')
      .select('title')
      .eq('is_published', true)
    if (error || !data) return []
    return data.map(row => row.title)
  } catch {
    return []
  }
}

/**
 * Counts mirror the category landing queries. A failed count is zero, so
 * that landing stays out instead of being advertised on a guess. Story
 * rows come from the article query above; a stories failure leaves them
 * empty and the story-backed landings stay out with the articles.
 */
async function loadMediaCategoryLandingSignals(
  stories: readonly MediaCategoryStoryRow[],
): Promise<MediaCategoryLandingSignals> {
  const [
    communityPostCount,
    publishedEventTitles,
    publishedLessonCount,
    publishedCourseCount,
    publishedJobCount,
  ] = await Promise.all([
    countHead(() => adminClient.from('posts').select('id', { count: 'exact', head: true })),
    loadPublishedEventTitles(),
    countHead(() =>
      adminClient.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    countHead(() =>
      adminClient.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    countHead(() =>
      adminClient.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ),
  ])

  return {
    stories,
    communityPostCount,
    publishedEventTitles,
    publishedLessonCount,
    publishedCourseCount,
    publishedJobCount,
  }
}
