import { describe, expect, it } from 'vitest'
import {
  PUBLISH_HERO_REQUIRED,
  brandingObjectPathFromPublicUrl,
  featuredImageForPublish,
  isOwnedFeaturedImage,
  publishGuardDecision,
} from './heroPublishGuard'

const PROJECT = 'https://udbwrapkshfjkctylbmm.supabase.co'
const OWNED =
  `${PROJECT}/storage/v1/object/public/Branding/media-heroes/ai-tool/hero-16x9.png`
const UNSPLASH = 'https://images.unsplash.com/photo-123?w=1600'

describe('media story publish guard', () => {
  it('treats only this project storage public URL as owned hero art', () => {
    expect(isOwnedFeaturedImage(OWNED, PROJECT)).toBe(true)
    expect(isOwnedFeaturedImage(`  ${OWNED}  `, PROJECT)).toBe(true)
    expect(isOwnedFeaturedImage(
      `${PROJECT}/storage/v1/object/public/Branding/uploads/manual.png`,
      PROJECT,
    )).toBe(true)

    expect(isOwnedFeaturedImage(null, PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage('', PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage('   ', PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage(UNSPLASH, PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage('https://example.com/hero.png', PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage(
      'https://other-project.supabase.co/storage/v1/object/public/Branding/media-heroes/x/hero-16x9.png',
      PROJECT,
    )).toBe(false)
    expect(isOwnedFeaturedImage(`${PROJECT}/storage/v1/object/sign/Branding/secret.png`, PROJECT)).toBe(false)
    expect(isOwnedFeaturedImage(OWNED, '')).toBe(false)
    expect(isOwnedFeaturedImage('not a url', PROJECT)).toBe(false)
  })

  it('refuses publish when the featured image is empty or not owned, and allows drafts', () => {
    expect(publishGuardDecision({
      isPublished: true,
      featuredImageUrl: null,
      supabaseUrl: PROJECT,
    })).toEqual({ allow: false, error: PUBLISH_HERO_REQUIRED })

    expect(publishGuardDecision({
      isPublished: true,
      featuredImageUrl: '  ',
      supabaseUrl: PROJECT,
    })).toEqual({ allow: false, error: PUBLISH_HERO_REQUIRED })

    expect(publishGuardDecision({
      isPublished: true,
      featuredImageUrl: UNSPLASH,
      supabaseUrl: PROJECT,
    })).toEqual({ allow: false, error: PUBLISH_HERO_REQUIRED })

    expect(publishGuardDecision({
      isPublished: true,
      featuredImageUrl: OWNED,
      supabaseUrl: PROJECT,
    })).toEqual({ allow: true })

    expect(publishGuardDecision({
      isPublished: false,
      featuredImageUrl: UNSPLASH,
      supabaseUrl: PROJECT,
    })).toEqual({ allow: true })

    expect(publishGuardDecision({
      isPublished: false,
      featuredImageUrl: null,
      supabaseUrl: PROJECT,
    })).toEqual({ allow: true })
  })

  it('uses the image on the publish request, otherwise the image already stored', () => {
    expect(featuredImageForPublish({
      bodyHasImage: true,
      bodyImage: UNSPLASH,
      currentImage: OWNED,
    })).toBe(UNSPLASH)

    expect(featuredImageForPublish({
      bodyHasImage: true,
      bodyImage: '  ',
      currentImage: OWNED,
    })).toBeNull()

    expect(featuredImageForPublish({
      bodyHasImage: false,
      bodyImage: undefined,
      currentImage: `  ${OWNED}  `,
    })).toBe(OWNED)

    expect(publishGuardDecision({
      isPublished: true,
      featuredImageUrl: featuredImageForPublish({
        bodyHasImage: true,
        bodyImage: UNSPLASH,
        currentImage: OWNED,
      }),
      supabaseUrl: PROJECT,
    }).allow).toBe(false)
  })

  it('reads a Branding object path only from an owned public URL', () => {
    expect(brandingObjectPathFromPublicUrl(OWNED, PROJECT)).toBe(
      'media-heroes/ai-tool/hero-16x9.png',
    )
    expect(brandingObjectPathFromPublicUrl(UNSPLASH, PROJECT)).toBeNull()
    expect(brandingObjectPathFromPublicUrl(
      `${PROJECT}/storage/v1/object/public/Other/media-heroes/ai-tool/hero-16x9.png`,
      PROJECT,
    )).toBeNull()
    expect(brandingObjectPathFromPublicUrl(
      `${PROJECT}/storage/v1/object/public/Branding/media-heroes/../secret.png`,
      PROJECT,
    )).toBeNull()
    expect(brandingObjectPathFromPublicUrl(
      `${PROJECT}/storage/v1/object/public/Branding/media-heroes/%2e%2e/secret.png`,
      PROJECT,
    )).toBeNull()
  })
})
