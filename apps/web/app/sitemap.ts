import { MetadataRoute } from 'next'
import { adminClient } from '@/lib/supabase/admin'
import { toMediaSitemapEntries } from '@/lib/media/sitemap'
import { SITE_URL, getPublishedEpisodes } from '@/lib/podcast/public'

// Brand-domain URLs via NEXT_PUBLIC_SITE_URL (SITE_URL). Never the Railway host.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/podcast`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/community`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/academy`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/live`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/media`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.6 },
  ]

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
