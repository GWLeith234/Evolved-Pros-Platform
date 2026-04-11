import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MediaPortalClient, PILLAR_META } from './MediaPortalClient'
import type { MediaStory, PillarSection } from './MediaPortalClient'

export const revalidate = 60

export const metadata: Metadata = {
<<<<<<< HEAD
  title: 'Evolved Media \u2014 Insights for High Performers',
  description: 'Business insights, pioneer stories, and leadership thinking from the EVOLVED framework.',
}

=======
  title: 'Evolved Pros Media — Pioneer Driver',
  description: 'Sales & personal development intelligence. Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.',
}

const PILLAR_ORDER = ['foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution']

>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
export default async function MediaPage() {
  const supabase = createClient()

  // Fetch all published stories
  const { data: allStories } = await supabase
    .from('media_stories')
<<<<<<< HEAD
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, is_featured')
=======
    .select('id, title, slug, excerpt, pillar, story_type, featured_image_url, author, published_at, body, is_featured, views')
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const stories = (allStories ?? []) as (MediaStory & { is_featured: boolean })[]

<<<<<<< HEAD
  // Featured story: most recent featured, or fallback to most recent
  const featured = stories.find(s => s.is_featured) ?? stories[0] ?? null

  // Latest 4 non-featured for sidebar
  const latest = stories
    .filter(s => s.id !== featured?.id)
    .slice(0, 4)

  // Group by pillar
  const pillarOrder = ['foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution']
=======
  // 1. Featured story
  const featured = stories.find(s => s.is_featured) ?? stories[0] ?? null

  // 2. Hero sidebar stories (non-featured, most recent 4)
  const sidebar = stories
    .filter(s => s.id !== featured?.id)
    .slice(0, 4)

  // 3. Group by pillar (max 3 per pillar)
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
  const grouped = new Map<string, MediaStory[]>()
  for (const s of stories) {
    if (!s.pillar) continue
    const arr = grouped.get(s.pillar) ?? []
<<<<<<< HEAD
    arr.push(s)
    grouped.set(s.pillar, arr)
  }

  const sections: PillarSection[] = pillarOrder
=======
    if (arr.length < 3) arr.push(s)
    grouped.set(s.pillar, arr)
  }

  const sections: PillarSection[] = PILLAR_ORDER
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
    .filter(key => grouped.has(key))
    .map(key => ({
      key,
      label: PILLAR_META[key]?.label ?? key,
<<<<<<< HEAD
      subtitle: PILLAR_META[key]?.subtitle ?? '',
=======
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
      color: PILLAR_META[key]?.color ?? '#7a8a96',
      stories: grouped.get(key)!,
    }))

<<<<<<< HEAD
  return (
    <MediaPortalClient
      featured={featured}
      latest={latest}
      sections={sections}
=======
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
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
    />
  )
}
