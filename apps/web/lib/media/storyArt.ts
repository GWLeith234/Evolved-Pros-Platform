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

/**
 * Hub stills that used to hotlink images.unsplash.com.
 * Files live in public/media/stills. The Unsplash License does not require
 * photographer credit, and the CMS URLs did not store photographer names.
 * See public/media/stills/CREDITS.txt.
 */
export const LOCAL_UNSPLASH_STILL_DIR = '/media/stills' as const

export const LOCAL_UNSPLASH_STILL_IDS = [
  'photo-1460925895917-afdab827c52f',
  'photo-1478737270239-2f02b77fc618',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1507099985932-87a4520ed1d5',
  'photo-1512941937669-90a1b58e7e9c',
  'photo-1517048676732-d65bc937f952',
  'photo-1519389950473-47ba0277781c',
  'photo-1529119368496-2dfda6ec2804',
  'photo-1532968899863-5b52ef155913',
  'photo-1534616042650-80f5c9b61f09',
  'photo-1542744173-8e7e53415bb0',
  'photo-1546437593-3d0258c28037',
  'photo-1549923746-c502d488b3ea',
  'photo-1551836022-d5d88e9218df',
  'photo-1556761175-4b46a572b786',
  'photo-1560472354-b33ff0c44a43',
  'photo-1564510714747-69c3bc1fab41',
  'photo-1573496359142-b8d87734a5a2',
  'photo-1575909812264-6902b55846ad',
  'photo-1589880768855-b106592ac541',
  'photo-1593784991251-92ded75ea290',
  'photo-1600880292203-757bb62b4baf',
  'photo-1617326021886-53d6be1d7154',
  'photo-1617611647086-bccca8c2cf84',
  'photo-1626863905121-3b0c0ed7b94c',
  'photo-1630797160666-38e8c5ba44c1',
  'photo-1635779503036-27cbbdcdbbd1',
  'photo-1641286957728-474df62d5223',
  'photo-1653463174231-3911539cfdd9',
  'photo-1672380135241-c024f7fbfa13',
  'photo-1673767298248-b128f17f89af',
  'photo-1685633224180-7664d8b4e5b9',
  'photo-1695370992830-8cb4f259c068',
  'photo-1745270917449-c2e2c5806586',
  'photo-1783115259399-3a5a3e0e4592',
  'photo-1783419752280-46a2073ef7dc',
] as const

const LOCAL_UNSPLASH_STILL_ID_SET = new Set<string>(LOCAL_UNSPLASH_STILL_IDS)

export function unsplashPhotoId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.hostname !== 'images.unsplash.com') return null
  const match = parsed.pathname.match(/\/(photo-[A-Za-z0-9_-]+)/)
  return match?.[1] ?? null
}

export function localUnsplashStillPath(id: string): string {
  return `${LOCAL_UNSPLASH_STILL_DIR}/${id}.webp`
}

export function hasBakedProsWordmark(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes(BAKED_PROS_STILL_MARKER)
}

/** Swap the CMS lockup still, and known Unsplash hotlinks, for repo files. */
export function resolveStoryArtUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (hasBakedProsWordmark(url)) return GROK_BOT_STILL_PLAIN
  const unsplashId = unsplashPhotoId(url)
  if (unsplashId && LOCAL_UNSPLASH_STILL_ID_SET.has(unsplashId)) {
    return localUnsplashStillPath(unsplashId)
  }
  return url
}

/** JSON-LD and other absolute consumers. Next metadataBase covers OG tags. */
export function absolutePublicArtUrl(src: string | null | undefined, origin: string): string | null {
  if (!src) return null
  if (src.startsWith('/')) return `${origin.replace(/\/+$/, '')}${src}`
  return src
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

/**
 * Soo/TT large-thumb crop. Hero, featured 2-up, list rails, and article
 * stills share 3:2 so Unsplash and Supabase Branding uploads fill the same
 * frame. Video podcast stills stay 16:9 elsewhere.
 */
export const MEDIA_STORY_THUMB_RATIO = '3 / 2' as const

export function storyThumbIntrinsic(priority = false): { width: number; height: number } {
  return priority ? { width: 1200, height: 800 } : { width: 480, height: 320 }
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
