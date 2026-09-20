import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  BAKED_PROS_STILL_MARKER,
  GROK_BOT_BYLINE,
  GROK_BOT_SLUG,
  GROK_BOT_STILL_PLAIN,
  featuredHeroByline,
  lockedArticleByline,
  hasBakedProsWordmark,
  resolveStoryArtUrl,
  storyArtHeroBackground,
  storyArtHeroClass,
  storyArtImgClass,
} from './storyArt'

const here = dirname(fileURLToPath(import.meta.url))
const portal = readFileSync(
  resolve(here, '../../app/(public)/media/MediaPortalClient.tsx'),
  'utf8',
)
const article = readFileSync(
  resolve(here, '../../app/(public)/media/[pillar]/[slug]/page.tsx'),
  'utf8',
)
const magazine = readFileSync(
  resolve(here, '../../components/media/MediaSectionMagazine.tsx'),
  'utf8',
)
const thumb = readFileSync(
  resolve(here, '../../components/media/NewspaperThumb.tsx'),
  'utf8',
)
const css = readFileSync(resolve(here, '../../app/globals.css'), 'utf8')

const BAKED =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/uploads/1787201392038.png'

describe('Media story art typed byline', () => {
  it('flags only the grok-bot still that bakes a Pros wordmark', () => {
    expect(hasBakedProsWordmark(BAKED)).toBe(true)
    expect(hasBakedProsWordmark(`https://cdn.example/Branding/uploads/${BAKED_PROS_STILL_MARKER}`)).toBe(
      true,
    )
    expect(hasBakedProsWordmark('https://cdn.example/Branding/uploads/other.png')).toBe(false)
    expect(hasBakedProsWordmark(null)).toBe(false)
    expect(hasBakedProsWordmark('')).toBe(false)
  })

  it('replaces the CMS lockup still with the typed local asset', () => {
    expect(GROK_BOT_STILL_PLAIN).toBe('/brand/media/grok-bots-from-evolved-pros.png')
    expect(resolveStoryArtUrl(BAKED)).toBe(GROK_BOT_STILL_PLAIN)
    expect(resolveStoryArtUrl('/brand/city-fallback.svg')).toBe('/brand/city-fallback.svg')
    expect(resolveStoryArtUrl(null)).toBeNull()
    expect(existsSync(resolve(here, '../../public', GROK_BOT_STILL_PLAIN.replace(/^\//, '')))).toBe(
      true,
    )
  })

  it('uses a plain Grok Bots from Evolved Pros byline on the featured hero', () => {
    expect(GROK_BOT_SLUG).toBe('grok-bot-everywhere')
    expect(GROK_BOT_BYLINE).toBe('Grok Bots from Evolved Pros')
    expect(
      featuredHeroByline({
        slug: GROK_BOT_SLUG,
        featured_image_url: BAKED,
        author: 'George Leith',
      }),
    ).toBe(GROK_BOT_BYLINE)
    expect(featuredHeroByline({ slug: 'other', featured_image_url: BAKED })).toBe(GROK_BOT_BYLINE)
    expect(featuredHeroByline({ slug: 'other', author: 'Pat' })).toBe('Pat')
    expect(featuredHeroByline({ slug: 'other', author: '  ' })).toBe('George Leith')
    expect(featuredHeroByline({})).toBe('George Leith')
    expect(lockedArticleByline({ author: 'Dana Whitfield' })).toBe('Dana Whitfield')
    expect(lockedArticleByline({})).toBe('George Leith')
  })

  it('does not crop the typed still and keeps cover centering', () => {
    expect(storyArtImgClass(BAKED)).toBe('ed-story-art')
    expect(storyArtHeroClass(BAKED)).toBe('')
    expect(storyArtHeroBackground(BAKED)).toEqual({
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    })
    expect(css).not.toMatch(/ed-story-art--crop-baked-pros/)
    expect(css).not.toMatch(/media-detail-hero--crop-baked-pros/)
  })

  it('strips the red disc lockup from the typed still byline band', async () => {
    const abs = resolve(here, '../../public', GROK_BOT_STILL_PLAIN.replace(/^\//, ''))
    const { data, info } = await sharp(abs).raw().toBuffer({ resolveWithObject: true })
    expect(info.width).toBe(1536)
    expect(info.height).toBe(1024)
    let red = 0
    let navy = 0
    for (let y = 170; y < 250; y += 1) {
      for (let x = 500; x < 800; x += 1) {
        const i = (y * info.width + x) * info.channels
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (r > 180 && g < 80 && b < 90) red += 1
        if (r < 50 && 30 < g && g < 90 && 50 < b && b < 120) navy += 1
      }
    }
    expect(red).toBe(0)
    expect(navy).toBe(0)
  })

  it('wires resolve + plain byline on hub, article, and section surfaces', () => {
    expect(thumb).toContain('resolveStoryArtUrl')
    expect(thumb).toContain('storyArtImgClass')
    expect(portal).toContain('NewspaperThumb')
    expect(portal).toContain('featuredHeroByline')
    expect(portal).toContain('ed-featured-meta-byline')
    expect(portal).toContain('data-featured-byline="plain"')
    expect(portal).not.toMatch(/logo_horizontal/)
    expect(portal).not.toMatch(/MEDIA_LOCKUP_/)
    expect(article).toContain('resolveStoryArtUrl')
    expect(article).toContain('storyArtImgClass')
    expect(article).toContain('lockedArticleByline')
    expect(magazine).toContain('resolveStoryArtUrl')
    expect(magazine).toContain('storyArtImgClass')
  })
})
