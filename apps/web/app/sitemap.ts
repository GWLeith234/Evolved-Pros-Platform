import { MetadataRoute } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { teaseFitMoves } from '@/lib/fit/moves'
import { LIVE_SPEAKING_PINS_EXTRA_KEY } from '@/lib/live/speaking-pins-shared'
import { toMediaSitemapEntries } from '@/lib/media/sitemap'
import { getPublishedEpisodes, type PublicEpisode } from '@/lib/podcast/public'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import {
  toMediaCategoryLandingSitemapEntries,
  type MediaCategoryLandingSignals,
  type MediaCategoryStoryRow,
} from '@/lib/seo/mediaCategoryLandings'
import { type PublicSitemapPath } from '@/lib/seo/publicRoutes'
import {
  COMMUNITY_LISTING_LIMIT,
  newestRowLastModified,
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  toStaticSitemapEntries,
  type SitemapDatedRow,
} from '@/lib/seo/sitemapEntries'
import {
  pillarHubLastModifiedMap,
  staticSitemapLastModified,
} from '@/lib/seo/sitemapListings'

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
  '/extension-privacy': 'yearly',
  '/sales-coaching': 'monthly',
  '/sales-quota': 'monthly',
  '/sales-burnout': 'monthly',
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
  '/extension-privacy': 0.2,
  '/sales-coaching': 0.6,
  '/sales-quota': 0.6,
  '/sales-burnout': 0.6,
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
  // render a published story or listing.
  //
  // lastModified is a stored stamp or a copy constant. A request-time clock
  // made two fetches a minute apart disagree, so nothing here reads one.
  let episodes: PublicEpisode[] = []
  try {
    episodes = await getPublishedEpisodes()
  } catch {
    // Never let a DB hiccup blank the sitemap. Static routes still emit.
  }

  let storyRows: MediaCategoryStoryRow[] = []
  try {
    const { data } = await adminClient
      .from('media_stories')
      .select('pillar, slug, section, tags, published_at, updated_at, is_published')
      .eq('is_published', true)
    storyRows = data ?? []
  } catch {
    // Same as episodes: a media query failure must not blank the sitemap.
  }

  const [fitMoves, pricingContent, liveContent, signals] = await Promise.all([
    loadPublishedFitStamps(),
    loadPricingContentDate(),
    loadLivePinsContentDate(),
    loadMediaCategoryLandingSignals(storyRows),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    ...toStaticSitemapEntries(
      base,
      SITEMAP_FREQ,
      SITEMAP_PRIORITY,
      staticSitemapLastModified({
        episodes,
        stories: storyRows,
        fitMoves,
        pricingContent,
        liveContent,
      }),
    ),
    ...toPillarHubSitemapEntries(base, pillarHubLastModifiedMap(storyRows)),
  ]

  let categoryRoutes: MetadataRoute.Sitemap = []
  try {
    categoryRoutes = toMediaCategoryLandingSitemapEntries(base, signals)
  } catch {
    // A category-landing query failure omits those URLs only.
  }

  return [
    ...staticRoutes,
    ...toEpisodeSitemapEntries(base, episodes),
    ...toMediaSitemapEntries(base, storyRows),
    ...categoryRoutes,
  ]
}

/**
 * Published fit_moves stamps. The page falls back to the fixture catalog
 * when the table is empty or the query fails, so the fixture published_at
 * values are the stamps in that case.
 */
async function loadPublishedFitStamps(): Promise<SitemapDatedRow[]> {
  // Same order as /fit's catalog query, which is the order the home
  // rotator renders (featured first). The first row is the card in the
  // initial HTML. The full list is the /fit library.
  const fixtures = teaseFitMoves().map(move => ({ published_at: move.publishedAt }))
  try {
    const { data, error } = await adminClient
      .from('fit_moves')
      .select('updated_at, published_at')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })
    if (error || !data || data.length === 0) return fixtures
    return data
  } catch {
    return fixtures
  }
}

/**
 * Membership products and their active prices. The pricing page reads
 * these amounts. A failed query leaves the copy constant in charge.
 */
async function loadPricingContentDate(): Promise<Date | undefined> {
  try {
    const { data: products, error } = await (adminClient as any)
      .from('products')
      .select('id, updated_at, tier, active')
      .in('tier', ['community', 'vip', 'pro'])
    if (error || !products) return undefined
    const active = (products as Array<{ id: string; updated_at: string | null; active: boolean | null }>)
      .filter(product => product.active !== false)
    const ids = active.map(product => product.id)
    let prices: SitemapDatedRow[] = []
    if (ids.length > 0) {
      const { data, error: priceError } = await (adminClient as any)
        .from('prices')
        .select('updated_at, active')
        .in('product_id', ids)
      if (!priceError && data) {
        prices = (data as Array<{ updated_at: string | null; active: boolean | null }>)
          .filter(price => price.active !== false)
      }
    }
    return newestRowLastModified([...active, ...prices])
  } catch {
    return undefined
  }
}

/** platform_settings row for admin-added speaking pins, when one exists. */
async function loadLivePinsContentDate(): Promise<Date | undefined> {
  try {
    const { data, error } = await adminClient
      .from('platform_settings')
      .select('updated_at')
      .eq('key', LIVE_SPEAKING_PINS_EXTRA_KEY)
      .maybeSingle()
    if (error || !data) return undefined
    return newestRowLastModified([data])
  } catch {
    return undefined
  }
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

async function loadStampRows(
  run: () => PromiseLike<{ data: SitemapDatedRow[] | null; error: unknown }>,
): Promise<SitemapDatedRow[]> {
  try {
    const { data, error } = await run()
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

async function loadPublishedEvents(): Promise<Array<SitemapDatedRow & { title: string }>> {
  try {
    const { data, error } = await adminClient
      .from('events')
      .select('title, created_at')
      .eq('is_published', true)
    if (error || !data) return []
    return data.map(row => ({ title: row.title, created_at: row.created_at }))
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
    communityListedPosts,
    communitySourcePosts,
    publishedEvents,
    publishedLessonCount,
    academyLessons,
    publishedCourseCount,
    academyCourses,
    publishedJobCount,
    publishedJobs,
  ] = await Promise.all([
    countHead(() => adminClient.from('posts').select('id', { count: 'exact', head: true })),
    loadStampRows(() =>
      adminClient
        .from('posts')
        .select('updated_at, created_at')
        .order('like_count', { ascending: false })
        .limit(COMMUNITY_LISTING_LIMIT),
    ),
    loadStampRows(() =>
      adminClient
        .from('posts')
        .select('updated_at, created_at')
        .order('updated_at', { ascending: false })
        .limit(1),
    ),
    loadPublishedEvents(),
    countHead(() =>
      adminClient.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    loadStampRows(() =>
      adminClient
        .from('lessons')
        .select('created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
    ),
    countHead(() =>
      adminClient.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ),
    loadStampRows(() =>
      adminClient.from('courses').select('created_at').eq('is_published', true),
    ),
    countHead(() =>
      adminClient.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ),
    loadStampRows(() =>
      adminClient
        .from('job_listings')
        .select('updated_at, created_at')
        .eq('status', 'published'),
    ),
  ])

  return {
    stories,
    communityPostCount,
    communityListedPosts,
    communitySourcePosts,
    publishedEventTitles: publishedEvents.map(event => event.title),
    publishedEvents,
    publishedLessonCount,
    academyLessons,
    publishedCourseCount,
    academyCourses,
    publishedJobCount,
    publishedJobs,
  }
}
