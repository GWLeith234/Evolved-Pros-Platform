import { describe, expect, it, vi } from 'vitest'
import { PUBLISH_HERO_REQUIRED } from './heroPublishGuard'
import { heroImageReachable, heroLoadError, publishHeroGate } from './heroReachable'

const PROJECT = 'https://udbwrapkshfjkctylbmm.supabase.co'
const OWNED =
  `${PROJECT}/storage/v1/object/public/Branding/media-heroes/ai-tool/hero-16x9.png`
const UNSPLASH = 'https://images.unsplash.com/photo-123?w=1600'

function head(status: number, contentType?: string): typeof fetch {
  return vi.fn(async () => new Response(null, {
    status,
    headers: contentType ? { 'content-type': contentType } : undefined,
  })) as unknown as typeof fetch
}

describe('hero image HEAD check', () => {
  it('accepts HTTP 200 with an image content-type', async () => {
    const fetchImpl = head(200, 'image/png')
    await expect(heroImageReachable(OWNED, fetchImpl)).resolves.toEqual({
      ok: true,
      contentType: 'image/png',
    })
    expect(fetchImpl).toHaveBeenCalledWith(OWNED, expect.objectContaining({ method: 'HEAD' }))
  })

  it('accepts image types that carry a parameter', async () => {
    const fetchImpl = head(200, 'Image/JPEG; charset=binary')
    await expect(heroImageReachable(OWNED, fetchImpl)).resolves.toMatchObject({
      ok: true,
      contentType: 'image/jpeg',
    })
  })

  it('refuses a non-200 response with the publish error', async () => {
    const fetchImpl = head(404, 'image/png')
    await expect(heroImageReachable(OWNED, fetchImpl)).resolves.toEqual({
      ok: false,
      status: 404,
      error: heroLoadError(404),
    })
    expect(heroLoadError(404)).toBe('Hero image does not load (HTTP 404)')
  })

  it('refuses HTTP 200 when the body is not an image', async () => {
    const fetchImpl = head(200, 'text/html')
    await expect(heroImageReachable(OWNED, fetchImpl)).resolves.toEqual({
      ok: false,
      status: 200,
      error: 'Hero image does not load (HTTP 200)',
    })
  })

  it('refuses a network failure as HTTP 0', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED')
    }) as unknown as typeof fetch
    await expect(heroImageReachable(OWNED, fetchImpl)).resolves.toEqual({
      ok: false,
      status: 0,
      error: 'Hero image does not load (HTTP 0)',
    })
  })
})

describe('publish hero gate', () => {
  it('does not HEAD a draft or an unowned URL', async () => {
    const fetchImpl = head(200, 'image/png')
    await expect(publishHeroGate({
      isPublished: false,
      featuredImageUrl: null,
      supabaseUrl: PROJECT,
      fetchImpl,
    })).resolves.toEqual({ allow: true })
    await expect(publishHeroGate({
      isPublished: true,
      featuredImageUrl: UNSPLASH,
      supabaseUrl: PROJECT,
      fetchImpl,
    })).resolves.toEqual({ allow: false, error: PUBLISH_HERO_REQUIRED })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('publishes only when the owned URL loads as an image', async () => {
    await expect(publishHeroGate({
      isPublished: true,
      featuredImageUrl: OWNED,
      supabaseUrl: PROJECT,
      fetchImpl: head(200, 'image/webp'),
    })).resolves.toEqual({ allow: true })

    await expect(publishHeroGate({
      isPublished: true,
      featuredImageUrl: `  ${OWNED}  `,
      supabaseUrl: PROJECT,
      fetchImpl: head(503, 'image/png'),
    })).resolves.toEqual({
      allow: false,
      error: 'Hero image does not load (HTTP 503)',
    })
  })
})
