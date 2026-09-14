/**
 * /media story stills. Some CMS uploads bake a static Pros wordmark into the
 * art. That mark cannot follow html.light-mode, so display code crops to the
 * photography and keeps type in HTML (plain text). Do not treat the still as
 * chrome. Do not invent a second brand lockup on the hero.
 */

export const BAKED_PROS_STILL_MARKER = '1787201392038.png' as const

const BAKED_PROS_STILL_MARKERS = [BAKED_PROS_STILL_MARKER] as const

export function hasBakedProsWordmark(url: string | null | undefined): boolean {
  if (!url) return false
  return BAKED_PROS_STILL_MARKERS.some(marker => url.includes(marker))
}

/** Class for <img> / next/Image fill covers on the desk. */
export function storyArtImgClass(url: string | null | undefined): string {
  return hasBakedProsWordmark(url)
    ? 'ed-story-art ed-story-art--crop-baked-pros'
    : 'ed-story-art'
}

/** Extra class on the article wide hero (background-image). */
export function storyArtHeroClass(url: string | null | undefined): string {
  return hasBakedProsWordmark(url) ? 'media-detail-hero--crop-baked-pros' : ''
}

/** Inline bg crop. Beats the default cover/center on the detail hero. */
export function storyArtHeroBackground(url: string | null | undefined): {
  backgroundSize: string
  backgroundPosition: string
} {
  if (hasBakedProsWordmark(url)) {
    return { backgroundSize: '134% auto', backgroundPosition: 'center 70%' }
  }
  return { backgroundSize: 'cover', backgroundPosition: 'center' }
}
