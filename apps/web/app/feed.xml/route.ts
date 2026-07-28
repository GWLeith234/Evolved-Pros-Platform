import { SITE_URL, getPublishedEpisodes } from '@/lib/podcast/public'
import { buildPodcastRssXml, RSS_HEADERS } from '@/lib/podcast/rss'

// Canonical RSS 2.0 + iTunes podcast feed at /feed.xml (SPRINT M, Task 5).
// URLs are built from the SEO-only siteUrl (evolvedpros.com), never the auth
// host. Shares its builder with the legacy /podcast/rss.xml alias.
export const dynamic = 'force-dynamic'

export async function GET() {
  const episodes = await getPublishedEpisodes()
  const xml = buildPodcastRssXml(episodes, `${SITE_URL}/feed.xml`)
  return new Response(xml, { headers: RSS_HEADERS })
}
