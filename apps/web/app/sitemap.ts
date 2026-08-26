import { MetadataRoute } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { toMediaSitemapEntries } from '@/lib/media/sitemap'
import { getPublishedEpisodes } from '@/lib/podcast/public'
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical'
import { PUBLIC_SITEMAP_PATHS, type PublicSitemapPath } from '@/lib/seo/publicRoutes'

// Brand-domain URLs on www. Never platform, never the Railway host.
export const dynamic = 'force-dynamic'

type Freq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

const SITEMAP_FREQ: Record<PublicSitemapPath, Freq> = {
  '/':        'daily',
  '/podcast': 'weekly',
  '/live':    'monthly',
  '/media':   'daily',
  '/pricing': 'monthly',
}

const SITEMAP_PRIORITY: Record<PublicSitemapPath, number> = {
  '/':        1,
  '/podcast': 0.9,
  '/live':    0.7,
  '/media':   0.7,
  '/pricing': 0.8,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = CANONICAL_ORIGIN

  // GATE-1 — /community, /events, /academy and /leaderboard were REMOVED from
  // this list. All four require auth, so an anonymous request is redirected to
  // /login, and Googlebot is anonymous: we were advertising four URLs that
  // never serve their advertised content. Do NOT add them back until they are
  // genuinely anon-readable — that needs anon-role RLS, not a sitemap entry.
  //
  // /live and /pricing stay because both are in SESSION_OPTIONAL_ROUTES:
  // middleware refreshes the session but never bounces an anonymous visitor.
  // The single source of truth is PUBLIC_SITEMAP_PATHS, which is unit-tested.
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map(path => ({
    url: path === '/' ? base : `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: SITEMAP_FREQ[path],
    priority: SITEMAP_PRIORITY[path],
  }))

  let episodeRoutes: MetadataRoute.Sitemap = []
  try {
    const episodes = await getPublishedEpisodes()
    episodeRoutes = episodes.map(e => ({
      url: `${base}/podcast/${e.slug}`,
      lastModified: e.published_at ? new Date(e.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Never let a DB hiccup blank the sitemap — static routes still emit.
  }

  let mediaRoutes: MetadataRoute.Sitemap = []
  try {
    const { data } = await adminClient
      .from('media_stories')
      .select('pillar, slug, published_at, is_published')
      .eq('is_published', true)
    mediaRoutes = toMediaSitemapEntries(base, data ?? [])
  } catch {
    // Same as episodes: a media query failure must not blank the sitemap.
  }

  return [...staticRoutes, ...episodeRoutes, ...mediaRoutes]
}
