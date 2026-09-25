import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { DraftPreviewRibbon } from '@/components/media/DraftPreviewRibbon'
import { MediaSocialCard } from '@/components/media/MediaSocialCard'
import { authorizeMediaPreview, getMediaStoryBySlug } from '@/lib/media/previewStories'
import { firstSearchParam } from '@/lib/media/previewWeek'
import { isPreviewSlug } from '@/lib/media/previewToken'
import { mediaStoryHead, mediaStorySocialMetadata, PREVIEW_ROBOTS } from '@/lib/media/storyMeta'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
  if (!allowed) return { title: 'Not found', robots: PREVIEW_ROBOTS }
  const story = await getMediaStoryBySlug(params.slug)
  if (!story) return { title: 'Not found', robots: PREVIEW_ROBOTS }
  return mediaStorySocialMetadata(story, { robots: PREVIEW_ROBOTS })
}

export default async function MediaStoryCardPreviewPage({
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
  const head = mediaStoryHead(story)
  const articleHref = token
    ? `/media/preview/${story.slug}?token=${encodeURIComponent(token)}`
    : `/media/preview/${story.slug}`

  return (
    <>
      <DraftPreviewRibbon />
      <div className="ep-media-home ep-preview-card-page">
        <div className="ep-media-home-inner">
          <p className="ep-media-kicker">Social card</p>
          <h1 className="ep-preview-index-title">{story.title}</h1>
          <p className="ep-preview-index-note">
            <Link href={articleHref}>Back to the draft</Link>
          </p>
          <MediaSocialCard
            title={head.title}
            description={head.description}
            image={head.image}
            imageAlt={story.title}
          />
        </div>
      </div>
    </>
  )
}
