/**
 * Shared Soo/TT newspaper thumb. Home, section landings, and article rails
 * use the same 3:2 cover crop and token fallback — no per-URL crop classes.
 */
import { resolveStoryArtUrl, storyArtImgClass } from '@/lib/media/storyArt'

export type NewspaperThumbStory = {
  featured_image_url: string | null
}

export type NewspaperThumbVariant = 'hero' | 'feature' | 'list'

export function NewspaperThumb({
  story,
  ratio = '3 / 2',
  priority = false,
  variant = 'feature',
}: {
  story: NewspaperThumbStory
  ratio?: string
  priority?: boolean
  variant?: NewspaperThumbVariant
}) {
  const src = resolveStoryArtUrl(story.featured_image_url)
  return (
    <div
      className={variant === 'list' ? 'ep-media-thumb ep-media-thumb--list' : 'ep-media-thumb'}
      style={{ aspectRatio: ratio }}
      data-media-thumb={variant}
      {...(src ? {} : { 'data-media-thumb-empty': 'true' })}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={priority ? 1280 : 320}
          height={priority ? 853 : 213}
          decoding="async"
          loading={priority ? undefined : 'lazy'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          className={storyArtImgClass(story.featured_image_url)}
        />
      ) : (
        <div className="ep-media-thumb-fallback" aria-hidden="true" />
      )}
    </div>
  )
}
