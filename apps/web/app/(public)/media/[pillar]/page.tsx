import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { mediaListingRobots } from '@/lib/seo/mediaListingRobots'
import { mediaPillarCollectionDescription } from '@/lib/seo/mediaCollectionJsonLd'
import { MediaSectionLanding } from '@/components/media/MediaSectionLanding'
import type { NewspaperStory } from '@/components/media/newspaper'
import { PILLAR_CONFIG, getPillarLabel } from '@/lib/pillars'
import { listPublicMediaStories } from '@/lib/media/sitemap'

export const revalidate = 120
export const dynamicParams = true

const EXTRA_PILLARS = new Set(['general'])

function isKnownPillar(pillar: string): boolean {
  return Boolean(PILLAR_CONFIG[pillar]) || EXTRA_PILLARS.has(pillar)
}

export async function generateStaticParams() {
  return [...Object.keys(PILLAR_CONFIG), 'general'].map(pillar => ({ pillar }))
}

// /media/<slug> fallback: known pillars always win; otherwise treat the segment
// as a story slug and permanently redirect to its canonical /media/<pillar>/<slug>.
const findStoryPathBySlug = cache(async (slug: string): Promise<string | null> => {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('slug', slug)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()
  if (!data?.slug) return null
  return `/media/${data.pillar ? String(data.pillar) : 'general'}/${String(data.slug)}`
})

async function redirectSlugOrNotFound(segment: string): Promise<never> {
  const path = await findStoryPathBySlug(segment)
  if (path) permanentRedirect(path)
  notFound()
}

const fetchArticles = cache(async (pillar: string): Promise<NewspaperStory[]> => {
  const query = adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, published_at, body, author, excerpt, is_published, views, story_type')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(24)

  const { data } = pillar === 'general'
    ? await query.is('pillar', null)
    : await query.eq('pillar', pillar)

  return listPublicMediaStories((data ?? []) as Array<NewspaperStory & { is_published?: boolean | null }>)
})

export async function generateMetadata(
  { params }: { params: { pillar: string } },
): Promise<Metadata> {
  if (!isKnownPillar(params.pillar)) return redirectSlugOrNotFound(params.pillar)
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
  if (!isKnownPillar(params.pillar)) return redirectSlugOrNotFound(params.pillar)
  const articles = await fetchArticles(params.pillar)
  const label = params.pillar === 'general' ? 'Original' : getPillarLabel(params.pillar)
  return (
    <MediaSectionLanding
      sectionId={params.pillar}
      title={label}
      articles={articles}
    />
  )
}
