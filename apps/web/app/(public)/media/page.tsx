import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { listPublicMediaStories } from '@/lib/media/sitemap'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaPortalClient } from './MediaPortalClient'
import type { MediaStory, Episode } from './MediaPortalClient'
import { Masthead } from '@/components/media/Masthead'

export const revalidate = 60

export const metadata: Metadata = publicPageMetadata('/media', {
  title: 'Evolved Media — Sales & Personal Development Intelligence',
  description: 'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
})

export default async function MediaPage() {
  const supabase = createClient()

  // All published stories — no page-size cap. Category pills filter this
  // list client-side, so every is_published row must be reachable on /media.
  // Request client is correct here: live RLS has "Public can read published
  // stories" on media_stories and the 071 public-read policy on episodes.
  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, views')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const stories = listPublicMediaStories((allStories ?? []) as MediaStory[])

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
      <MediaPortalClient
        stories={stories}
        episodes={episodes}
      />
    </>
  )
}
