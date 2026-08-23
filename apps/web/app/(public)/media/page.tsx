import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaPortalClient } from './MediaPortalClient'
import type { MediaStory, Episode } from './MediaPortalClient'
import { Masthead } from '@/components/media/Masthead'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Evolved Media — Sales & Personal Development Intelligence',
  description: 'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
}

export default async function MediaPage() {
  const supabase = createClient()

  // Fetch a wider window so the client can filter by category without
  // a refetch round-trip.
  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, views')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(30)

  const stories = (allStories ?? []) as MediaStory[]

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
