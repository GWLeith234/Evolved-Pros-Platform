import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { DraftPreviewRibbon } from '@/components/media/DraftPreviewRibbon'
import { PreviewIndexFrame } from '@/components/media/PreviewIndexFrame'
import { resolveStoryArtUrl } from '@/lib/media/storyArt'
import { buildPreviewToken, previewStoryPath } from '@/lib/media/previewToken'
import {
  currentUtcWeekStart,
  firstSearchParam,
  formatWeekLabel,
  parseWeekStart,
  shiftWeek,
  storyFallsInWeek,
} from '@/lib/media/previewWeek'
import { authorizeMediaPreview, listUnpublishedMediaStories } from '@/lib/media/previewStories'
import { PREVIEW_ROBOTS } from '@/lib/media/storyMeta'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Draft preview',
  robots: PREVIEW_ROBOTS,
}

function weekHref(week: string, token: string | null): string {
  const query = new URLSearchParams({ week })
  if (token) query.set('token', token)
  return `/media/preview?${query.toString()}`
}

export default async function MediaPreviewIndexPage({
  searchParams,
}: {
  searchParams: { week?: string | string[]; token?: string | string[] }
}) {
  noStore()
  const token = firstSearchParam(searchParams.token)
  const rawWeek = firstSearchParam(searchParams.week)
  const week = rawWeek ? parseWeekStart(rawWeek) : currentUtcWeekStart()
  if (!week) notFound()

  const allowed = await authorizeMediaPreview('week', week, token ?? '')
  if (!allowed) notFound()

  const stories = (await listUnpublishedMediaStories())
    .filter(story => story.slug && storyFallsInWeek(story, week))
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))

  return (
    <>
      <DraftPreviewRibbon />
      <div className="ep-media-home ep-preview-index">
        <div className="ep-media-home-inner">
          <p className="ep-media-kicker">Unpublished</p>
          <h1 className="ep-preview-index-title">Stories for the week</h1>
          <p className="ep-preview-index-range">{formatWeekLabel(week)}</p>
          <p className="ep-preview-index-note">
            Grouped by updated date, then created date. The public article stays off until publish.
          </p>
          <nav className="ep-preview-index-weeks" aria-label="Week">
            <Link href={weekHref(shiftWeek(week, -7), token)}>Previous week</Link>
            <Link href={weekHref(shiftWeek(week, 7), token)}>Next week</Link>
          </nav>
          <PreviewIndexFrame>
            {stories.length === 0 ? (
              <p className="ep-preview-index-empty">No unpublished stories in this week.</p>
            ) : (
              <ul className="ep-preview-index-list">
                {stories.map(story => {
                  const minted = buildPreviewToken({ kind: 'story', slug: story.slug })
                  const href = previewStoryPath(story.slug, minted)
                  const cardHref = minted
                    ? `/media/preview/${story.slug}/card?token=${encodeURIComponent(minted)}`
                    : `/media/preview/${story.slug}/card`
                  const thumb = resolveStoryArtUrl(story.featured_image_url)
                  return (
                    <li key={story.id}>
                      <Link href={href} className="ep-preview-index-row">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" width={480} height={320} className="ep-preview-index-thumb" />
                        ) : (
                          <span className="ep-preview-index-thumb ep-preview-index-thumb-empty" aria-hidden="true" />
                        )}
                        <span>
                          <span className="ep-preview-index-story-title">{story.title}</span>
                          {story.excerpt ? <span className="ep-preview-index-excerpt">{story.excerpt}</span> : null}
                        </span>
                      </Link>
                      <Link href={cardHref} className="ep-preview-index-card-link">Social card</Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </PreviewIndexFrame>
        </div>
      </div>
    </>
  )
}
