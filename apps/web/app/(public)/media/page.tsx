import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaPortalClient, PILLAR_META } from './MediaPortalClient'
import type { MediaStory, PillarSection } from './MediaPortalClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Evolved Pros Media — Pioneer Driver',
  description: 'Sales & personal development intelligence. Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
}

const PILLAR_ORDER = ['foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution']

export default async function MediaPage() {
  const supabase = createClient()

  // Fetch all published stories
  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, is_featured, views')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const stories = (allStories ?? []) as (MediaStory & { is_featured: boolean })[]

  // 1. Featured story
  const featured = stories.find(s => s.is_featured) ?? stories[0] ?? null

  // 2. Hero sidebar stories (non-featured, most recent 4)
  const sidebar = stories
    .filter(s => s.id !== featured?.id)
    .slice(0, 4)

  // 3. Group by pillar (max 3 per pillar)
  const grouped = new Map<string, MediaStory[]>()
  for (const s of stories) {
    if (!s.pillar) continue
    const arr = grouped.get(s.pillar) ?? []
    if (arr.length < 3) arr.push(s)
    grouped.set(s.pillar, arr)
  }

  const sections: PillarSection[] = PILLAR_ORDER
    .filter(key => grouped.has(key))
    .map(key => ({
      key,
      label: PILLAR_META[key]?.label ?? key,
      color: PILLAR_META[key]?.color ?? '#7a8a96',
      stories: grouped.get(key)!,
    }))

  // 4. Trending (by views, top 5)
  const trending = [...stories]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5)

  return (
    <MediaPortalClient
      featured={featured}
      sidebar={sidebar}
      sections={sections}
      trending={trending}
    />
  )
}
