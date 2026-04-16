import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaPortalClient } from './MediaPortalClient'
import type { MediaStory, Episode } from './MediaPortalClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Evolved Media — Sales & Personal Development Intelligence',
  description: 'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
}

export default async function MediaPage() {
  const supabase = createClient()

  // Fetch 10 most recent published stories
  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, views')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10)

  const stories = (allStories ?? []) as MediaStory[]

  const featured = stories[0] ?? null
  const sidebar = stories.slice(1, 4)
  const grid = stories.slice(4, 10)

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
    <MediaPortalClient
      featured={featured}
      sidebar={sidebar}
      grid={grid}
      episodes={episodes}
    />
  )
}
