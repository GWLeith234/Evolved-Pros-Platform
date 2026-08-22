import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
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

  // Look up author avatars from users table by full_name.
  //
  // Service role, not the request client: this page is reachable logged-out, so
  // `createClient()` here is an anonymous PostgREST context. public.users must
  // not be readable by anon (S1 — users_select_for_joins), so the avatar join
  // runs server-side under the service key. Column allowlist stays narrow.
  const authorNames = [...new Set(stories.map(s => s.author).filter(Boolean) as string[])]
  const authorAvatars: Record<string, string> = {}
  if (authorNames.length > 0) {
    try {
      const { data: profiles } = await adminClient
        .from('users')
        .select('full_name, avatar_url')
        .in('full_name', authorNames)
      for (const u of profiles ?? []) {
        if (u.full_name && u.avatar_url) authorAvatars[u.full_name] = u.avatar_url
      }
    } catch {
      // users table lookup failed — fall back to initials
    }
  }

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
        authorAvatars={authorAvatars}
      />
    </>
  )
}
