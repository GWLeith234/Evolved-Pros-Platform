import { MetadataRoute } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { getPublishedMediaStoriesForHub } from '@/lib/media/public'
import { toMediaCategoryHubEntries, toMediaSitemapEntries } from '@/lib/media/sitemap'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { PUBLIC_SITEMAP_PATHS, type PublicSitemapPath } from '@/lib/seo/publicRoutes'

// Brand-domain URLs on www. Never platform, never the Railway host.
//
// force-dynamic re-renders this route, but Next can still keep the
// media_stories GET in the Data Cache (live 2026-09-29: static lastmod was
// the request clock while the newest story loc was five days old). revalidate
// 0 + force-no-store + noStore() make that fetch follow the hub query.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
  noStore()
  const base = CANONICAL_ORIGIN

  // GATE-1 — /community, /events, /academy and /leaderboard were REMOVED from
  // this list. All four require auth, so an anonymous request is redirected to
  // /login, and Googlebot is anonymous: we were advertising four URLs that
  // never serve their advertised content. Do NOT add them back until they are
  // genuinely anon-readable — that needs anon-role RLS, not a sitemap entry.
  //
  // /live, /pricing, and /fit stay because they are in SESSION_OPTIONAL_ROUTES:
  // middleware refreshes the session but never bounces an anonymous visitor.
  // The single source of truth is PUBLIC_SITEMAP_PATHS, which is unit-tested.
  // No lastModified here. These pages have no content timestamp, and
  // new Date() would change every fetch (fake lastmod).
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map(path => ({
    url: path === '/' ? base : `${base}${path}`,
    changeFrequency: SITEMAP_FREQ[path],
    priority: SITEMAP_PRIORITY[path],
  }))

  let episodeRoutes: MetadataRoute.Sitemap = []
  try {
    const episodes = await getPublishedEpisodes()
    episodeRoutes = episodes.map(e => ({
      url: `${base}/podcast/${e.slug}`,
      ...(e.published_at ? { lastModified: new Date(e.published_at) } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Never let a DB hiccup blank the sitemap — static routes still emit.
  }

  let categoryRoutes: MetadataRoute.Sitemap = []
  let mediaRoutes: MetadataRoute.Sitemap = []
  try {
    // Same published-article query as /media (ordered, denylist applied).
    const stories = await getPublishedMediaStoriesForHub()
    categoryRoutes = toMediaCategoryHubEntries(base, stories)
    mediaRoutes = toMediaSitemapEntries(base, stories)
  } catch {
    // Same as episodes: a media query failure must not blank the sitemap.
  }

  return [...staticRoutes, ...categoryRoutes, ...episodeRoutes, ...mediaRoutes]
}
