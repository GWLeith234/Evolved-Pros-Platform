import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaStoryCrawlIndex } from '@/lib/media/crawlIndex'
import { getPublishedMediaStoriesForHub } from '@/lib/media/public'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaPortalClient } from './MediaPortalClient'
import type { Episode } from './MediaPortalClient'
import { Masthead } from '@/components/media/Masthead'

export const revalidate = 60

export const metadata: Metadata = publicPageMetadata('/media', {
  title: 'Evolved Media — Sales & Personal Development Intelligence',
  description: 'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
})

export default async function MediaPage() {
  const supabase = createClient()

  // adminClient, same as sitemap.ts and /media/[pillar]/[slug]. The
  // cookie-scoped request client SSRs an empty list for anonymous
  // Googlebot (live 2026-08-27: 0 article hrefs, ~50KB shell). Published
  // filter + unpublished-slug denylist still apply inside the helper.
  const stories = await getPublishedMediaStoriesForHub()

  // Fetch 3 most recent published episodes
  let episodes: Episode[] = []
  try {
    const { data } = await supabase
      .from('episodes')
      .select('id, episode_number, title, slug, thumbnail_url, duration_seconds, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
    episodes = (data ?? []) as Episode[]
  } catch {
    // episodes table may not exist yet
  }

  return (
    <>
      <Masthead />
      <MediaStoryCrawlIndex stories={stories} />
      <MediaPortalClient
        stories={stories}
        episodes={episodes}
      />
    </>
  )
}
