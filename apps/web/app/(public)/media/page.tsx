import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaPortalClient, PILLAR_META } from './MediaPortalClient'
import type { MediaStory, PillarSection } from './MediaPortalClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Evolved Media \u2014 Insights for High Performers',
  description: 'Business insights, pioneer stories, and leadership thinking from the EVOLVED framework.',
}

export default async function MediaPage() {
  const supabase = createClient()

  // Fetch all published stories
  const { data: allStories } = await supabase
    .from('media_stories')
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, is_featured')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const stories = (allStories ?? []) as (MediaStory & { is_featured: boolean })[]

  // Featured story: most recent featured, or fallback to most recent
  const featured = stories.find(s => s.is_featured) ?? stories[0] ?? null

  // Latest 4 non-featured for sidebar
  const latest = stories
    .filter(s => s.id !== featured?.id)
    .slice(0, 4)

  // Group by pillar
  const pillarOrder = ['foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution']
  const grouped = new Map<string, MediaStory[]>()
  for (const s of stories) {
    if (!s.pillar) continue
    const arr = grouped.get(s.pillar) ?? []
    arr.push(s)
    grouped.set(s.pillar, arr)
  }

  const sections: PillarSection[] = pillarOrder
    .filter(key => grouped.has(key))
    .map(key => ({
      key,
      label: PILLAR_META[key]?.label ?? key,
      subtitle: PILLAR_META[key]?.subtitle ?? '',
      color: PILLAR_META[key]?.color ?? '#7a8a96',
      stories: grouped.get(key)!,
    }))

  return (
    <MediaPortalClient
      featured={featured}
      latest={latest}
      sections={sections}
    />
  )
}
