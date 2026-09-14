import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BAKED_PROS_STILL_MARKER,
  hasBakedProsWordmark,
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

const BAKED =
  'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/uploads/1787201392038.png'

describe('Media story art crop', () => {
  it('flags only the grok-bot still that bakes a Pros wordmark', () => {
    expect(hasBakedProsWordmark(BAKED)).toBe(true)
    expect(hasBakedProsWordmark(`https://cdn.example/Branding/uploads/${BAKED_PROS_STILL_MARKER}`)).toBe(
      true,
    )
    expect(hasBakedProsWordmark('https://cdn.example/Branding/uploads/other.png')).toBe(false)
    expect(hasBakedProsWordmark(null)).toBe(false)
    expect(hasBakedProsWordmark('')).toBe(false)
  })

  it('returns crop classes for baked stills and a plain art class otherwise', () => {
    expect(storyArtImgClass(BAKED)).toBe('ed-story-art ed-story-art--crop-baked-pros')
    expect(storyArtImgClass('/brand/city-fallback.svg')).toBe('ed-story-art')
    expect(storyArtHeroClass(BAKED)).toBe('media-detail-hero--crop-baked-pros')
    expect(storyArtHeroClass(null)).toBe('')
    expect(storyArtHeroBackground(BAKED)).toEqual({
      backgroundSize: '134% auto',
      backgroundPosition: 'center 70%',
    })
    expect(storyArtHeroBackground(null)).toEqual({
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    })
  })

  it('wires the crop on hub, article, and section surfaces', () => {
    expect(portal).toContain('storyArtImgClass')
    expect(portal).toContain('ed-featured-meta-byline')
    expect(portal).toContain('data-featured-byline="plain"')
    expect(portal).not.toMatch(/logo_horizontal/)
    expect(portal).not.toMatch(/MEDIA_LOCKUP_/)
    expect(article).toContain('storyArtHeroClass')
    expect(article).toContain('storyArtHeroBackground')
    expect(article).toContain('storyArtImgClass')
    expect(magazine).toContain('storyArtImgClass')
  })
})
