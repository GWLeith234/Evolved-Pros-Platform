import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_CONFIG, PILLAR_SLUGS } from '@/lib/pillars'
import { MediaPortalClient } from './MediaPortalClient'
import type { MediaStory, PillarSection } from './MediaPortalClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Evolved Pros Media — Pioneer Driver',
  description: 'Sales & personal development intelligence. Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
}

export default async function MediaPage() {
  const supabase = createClient()

  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, is_featured, views')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  // Fetch comment counts per story
  const storyIds = (allStories ?? []).map(s => s.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commentCounts } = storyIds.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (adminClient as any)
        .from('story_comments')
        .select('story_id')
        .in('story_id', storyIds)
    : { data: [] }

  const countMap = new Map<string, number>()
  for (const row of (commentCounts ?? []) as { story_id: string }[]) {
    countMap.set(row.story_id, (countMap.get(row.story_id) ?? 0) + 1)
  }

  const stories = (allStories ?? []).map(s => ({
    ...s,
    commentCount: countMap.get(s.id) ?? 0,
  })) as (MediaStory & { is_featured: boolean })[]

  const featured = stories.find(s => s.is_featured) ?? stories[0] ?? null

  const sidebar = stories
    .filter(s => s.id !== featured?.id)
    .slice(0, 4)

  const grouped = new Map<string, MediaStory[]>()
  for (const s of stories) {
    if (!s.pillar) continue
    const arr = grouped.get(s.pillar) ?? []
    if (arr.length < 3) arr.push(s)
    grouped.set(s.pillar, arr)
  }

  // Build sections using shared PILLAR_CONFIG (not from client module)
  const sections: PillarSection[] = PILLAR_SLUGS
    .filter(key => grouped.has(key))
    .map(key => ({
      key,
      label: PILLAR_CONFIG[key]?.label ?? key,
      color: PILLAR_CONFIG[key]?.color ?? '#7a8a96',
      stories: grouped.get(key)!,
    }))

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
