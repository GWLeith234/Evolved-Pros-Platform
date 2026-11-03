import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { mediaPillarCollectionDescription } from '@/lib/seo/mediaCollectionJsonLd'
import { MediaSectionLanding } from '@/components/media/MediaSectionLanding'
import type { NewspaperStory } from '@/components/media/newspaper'
import { sectionHubLinkPlan } from '@/lib/media/sectionHubLinks'
import { PILLAR_CONFIG, getPillarLabel } from '@/lib/pillars'

export const revalidate = 120
export const dynamicParams = true

const EXTRA_PILLARS = new Set(['general'])

function isKnownPillar(pillar: string): boolean {
  return Boolean(PILLAR_CONFIG[pillar]) || EXTRA_PILLARS.has(pillar)
}

export async function generateStaticParams() {
  return [...Object.keys(PILLAR_CONFIG), 'general'].map(pillar => ({ pillar }))
}

// Bare /media/<slug> is answered in middleware (301 Location, or 404), both
// uncached. This page is ISR; a redirect here is cached without Location.

const fetchPublishedRows = cache(async (pillar: string) => {
  const query = adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, published_at, body, author, excerpt, is_published, views, story_type')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const { data } = pillar === 'general'
    ? await query.is('pillar', null)
    : await query.eq('pillar', pillar)

  return (data ?? []) as Array<NewspaperStory & { is_published?: boolean | null }>
})

// Desk, Most Read, meta description, and JSON-LD stay on the first 24 rows.
// Older published stories are returned separately and appended to Latest.
const fetchArticles = cache(async (pillar: string): Promise<NewspaperStory[]> => {
  return sectionHubLinkPlan(await fetchPublishedRows(pillar)).articles
})

const fetchSectionOverflow = cache(async (pillar: string): Promise<NewspaperStory[]> => {
  return sectionHubLinkPlan(await fetchPublishedRows(pillar)).overflow
})

export async function generateMetadata(
  { params }: { params: { pillar: string } },
): Promise<Metadata> {
  if (!isKnownPillar(params.pillar)) notFound()
  const label = params.pillar === 'general' ? 'Original' : getPillarLabel(params.pillar)
  const articles = await fetchArticles(params.pillar)
  return publicPageMetadata(`/media/${params.pillar}`, {
    title: mediaSectionTitle(label),
    description: mediaPillarCollectionDescription(label, articles.map(article => article.title)),
    ...mediaListingRobots(articles.length),
  })
}

export default async function MediaPillarPage({
  params,
}: {
  params: { pillar: string }
}) {
  if (!isKnownPillar(params.pillar)) return notFound()
  const articles = await fetchArticles(params.pillar)
  const overflow = await fetchSectionOverflow(params.pillar)
  const label = params.pillar === 'general' ? 'Original' : getPillarLabel(params.pillar)
  return (
    <MediaSectionLanding
      sectionId={params.pillar}
      title={label}
      articles={articles}
      overflow={overflow}
    />
  )
}
