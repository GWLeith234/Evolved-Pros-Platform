/**
 * /media story stills. The grok-bot CMS upload bakes a Pros LogoMark into the
 * byline. That mark cannot follow html.light-mode and fights the MEDIA masthead.
 * Display uses a local still with typed "Grok Bots from Evolved Pros". No disc
 * as O. No second MEDIA or PROS lockup on the hero. Theme lock is unchanged.
 */

export const BAKED_PROS_STILL_MARKER = '1787201392038.png' as const
export const GROK_BOT_SLUG = 'grok-bot-everywhere' as const
export const GROK_BOT_BYLINE = 'Grok Bots from Evolved Pros' as const
export const GROK_BOT_STILL_PLAIN = '/brand/media/grok-bots-from-evolved-pros.png' as const

export function hasBakedProsWordmark(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(BAKED_PROS_STILL_MARKER)
}

/** Swap the CMS lockup still for the typed-byline asset. */
export function resolveStoryArtUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (hasBakedProsWordmark(url)) return GROK_BOT_STILL_PLAIN
  return url
}

export function featuredHeroByline(story: {
  slug?: string | null
  featured_image_url?: string | null
  author?: string | null
}): string {
  if (story.slug === GROK_BOT_SLUG || hasBakedProsWordmark(story.featured_image_url)) {
    return GROK_BOT_BYLINE
  }
  const locked = story.author?.trim()
  return locked || 'George Leith'
}

/**
 * Article / card byline. George Leith or a CMS-locked guest. Never invent a
 * staff name in render.
 */
export function lockedArticleByline(story: {
  slug?: string | null
  featured_image_url?: string | null
  author?: string | null
}): string {
  return featuredHeroByline(story)
}

/** Class for <img> / next/Image fill covers on the desk. */
export function storyArtImgClass(_url?: string | null): string {
  return 'ed-story-art'
}

/** Extra class on the article wide hero (background-image). */
export function storyArtHeroClass(_url?: string | null): string {
  return ''
}

/** Default cover crop. The typed still keeps Meet the staff. in frame. */
export function storyArtHeroBackground(_url?: string | null): {
  backgroundSize: string
  backgroundPosition: string
} {
  return { backgroundSize: 'cover', backgroundPosition: 'center' }
}
