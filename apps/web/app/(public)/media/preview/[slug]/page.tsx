import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { DraftPreviewRibbon } from '@/components/media/DraftPreviewRibbon'
import { MediaStoryDocument } from '@/components/media/MediaStoryDocument'
import { authorizeMediaPreview, getMediaStoryBySlug } from '@/lib/media/previewStories'
import { firstSearchParam } from '@/lib/media/previewWeek'
import { isPreviewSlug } from '@/lib/media/previewToken'
import { mediaStorySocialMetadata, PREVIEW_ROBOTS } from '@/lib/media/storyMeta'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function routePillar(pillar: string | null): string {
  return pillar && pillar !== 'null' ? pillar : 'general'
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { token?: string | string[] }
}): Promise<Metadata> {
  const token = firstSearchParam(searchParams.token) ?? ''
  const allowed = isPreviewSlug(params.slug)
    && await authorizeMediaPreview('story', params.slug, token)
  if (!allowed) notFound()
  const story = await getMediaStoryBySlug(params.slug)
  if (!story) notFound()
  return mediaStorySocialMetadata(story, { robots: PREVIEW_ROBOTS })
}

export default async function MediaStoryPreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { token?: string | string[] }
}) {
  noStore()
  if (!isPreviewSlug(params.slug)) notFound()
  const token = firstSearchParam(searchParams.token) ?? ''
  const allowed = await authorizeMediaPreview('story', params.slug, token)
  if (!allowed) notFound()

  const story = await getMediaStoryBySlug(params.slug)
  if (!story) notFound()

  const cardHref = token
    ? `/media/preview/${story.slug}/card?token=${encodeURIComponent(token)}`
    : `/media/preview/${story.slug}/card`

  return (
    <>
      <DraftPreviewRibbon cardHref={cardHref} />
      <MediaStoryDocument
        story={story}
        routePillar={routePillar(story.pillar)}
        routeSlug={story.slug}
      />
    </>
  )
}
