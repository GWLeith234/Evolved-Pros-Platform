import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_IMAGE_MAX_BYTES } from './adminImageUpload'

const state = vi.hoisted(() => ({
  uploads: [] as { bucket: string; path: string; contentType: string; upsert: boolean }[],
  storyUpdates: [] as { id: string; url: string }[],
  profileId: 'user-1',
  engagementId: '11111111-1111-4111-8111-111111111111',
}))

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => ({ userId: 'admin-1' }),
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => ({ id: state.profileId }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/guest/engagement', () => ({
  resolveGuestEngagement: async () => ({
    ok: true as const,
    engagement: { engagement_id: state.engagementId },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    storage: {
      from: (bucket: string) => ({
        upload: async (
          path: string,
          _body: Buffer,
          opts: { contentType?: string; upsert?: boolean },
        ) => {
          state.uploads.push({
            bucket,
            path,
            contentType: opts?.contentType ?? '',
            upsert: Boolean(opts?.upsert),
          })
          return { error: null }
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }),
      }),
    },
    from: () => ({
      update: (row: { featured_image_url: string }) => ({
        eq: async (_col: string, id: string) => {
          state.storyUpdates.push({ id, url: row.featured_image_url })
          return { error: null }
        },
      }),
    }),
  },
}))

import { POST as uploadAvatar } from '@/app/api/user/avatar/route'
import { POST as uploadGuestPhoto } from '@/app/api/admin/upload-guest-photo/route'
import { POST as uploadStoryImage } from '@/app/api/admin/upload-story-image/route'
import { POST as uploadGuestHeadshot } from '@/app/api/guest/upload/route'

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
const HTML = new TextEncoder().encode('<!DOCTYPE html><html><script>alert(1)</script></html>')

function file(bytes: Uint8Array, name: string, type: string): File {
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return new File([copy], name, { type })
}

async function post(
  handler: (request: Request) => Promise<Response>,
  url: string,
  fields: Record<string, string | File>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  const res = await handler(new Request(url, { method: 'POST', body: fd }))
  return { status: res.status, body: await res.json() as Record<string, unknown> }
}

describe('image upload routes', () => {
  beforeEach(() => {
    state.uploads = []
    state.storyUpdates = []
    state.profileId = 'user-1'
    state.engagementId = '11111111-1111-4111-8111-111111111111'
  })

  describe('POST /api/user/avatar', () => {
    const url = 'http://localhost/api/user/avatar'

    it('stores a jpeg under the signed-in user and ignores the filename', async () => {
      const { status, body } = await post(uploadAvatar, url, {
        file: file(JPEG, '../../banners/pwned.html', 'image/jpeg'),
      })
      expect(status).toBe(200)
      expect(state.uploads).toHaveLength(1)
      expect(state.uploads[0]).toMatchObject({
        bucket: 'Branding',
        contentType: 'image/jpeg',
        upsert: true,
      })
      expect(state.uploads[0].path).toMatch(/^avatars\/user-1\/\d+\.jpg$/)
      expect(state.uploads[0].path).not.toContain('..')
      expect(body.url).toBe(`https://cdn.example/${state.uploads[0].path}`)
    })

    it('accepts image/jpg and application/octet-stream when the bytes are a jpeg', async () => {
      for (const type of ['image/jpg', 'application/octet-stream']) {
        state.uploads = []
        const { status } = await post(uploadAvatar, url, {
          file: file(JPEG, 'me.jpg', type),
        })
        expect(status, type).toBe(200)
        expect(state.uploads[0].contentType).toBe('image/jpeg')
        expect(state.uploads[0].path).toMatch(/\.jpg$/)
      }
    })

    it('refuses svg, html bytes, and an oversized file without writing', async () => {
      const svg = await post(uploadAvatar, url, { file: file(SVG, 'a.svg', 'image/svg+xml') })
      expect(svg.status).toBe(415)
      expect(svg.body).toEqual({ error: 'Unsupported image type.' })

      const html = await post(uploadAvatar, url, { file: file(HTML, 'a.jpg', 'image/jpeg') })
      expect(html.status).toBe(415)

      const big = await post(uploadAvatar, url, {
        file: file(new Uint8Array(ADMIN_IMAGE_MAX_BYTES + 1), 'big.jpg', 'image/jpeg'),
      })
      expect(big.status).toBe(413)
      expect(big.body).toEqual({ error: 'File too large (max 10MB).' })
      expect(state.uploads).toEqual([])
    })
  })

  describe('POST /api/admin/upload-guest-photo', () => {
    const url = 'http://localhost/api/admin/upload-guest-photo'

    it('keeps the slug overwrite path for a real jpeg', async () => {
      const { status, body } = await post(uploadGuestPhoto, url, {
        file: file(JPEG, '../secret.html', 'image/jpeg'),
        slug: 'salesman-on-fire',
      })
      expect(status).toBe(200)
      expect(state.uploads).toEqual([{
        bucket: 'Branding',
        path: 'episodes/guest-salesman-on-fire.jpg',
        contentType: 'image/jpeg',
        upsert: true,
      }])
      expect(body.url).toBe('https://cdn.example/episodes/guest-salesman-on-fire.jpg')
    })

    it('uses a safe episode id when no slug is sent, and stores a png by its signature', async () => {
      const { status } = await post(uploadGuestPhoto, url, {
        file: file(PNG, 'shot.png', 'image/png'),
        episodeId: '22222222-2222-4222-8222-222222222222',
      })
      expect(status).toBe(200)
      expect(state.uploads[0].path).toBe('episodes/guest-22222222-2222-4222-8222-222222222222.png')
      expect(state.uploads[0].contentType).toBe('image/png')
    })

    it('refuses a slug or extension that leaves episodes/', async () => {
      const slug = await post(uploadGuestPhoto, url, {
        file: file(JPEG, 'shot.jpg', 'image/jpeg'),
        slug: '../../avatars/victim',
      })
      expect(slug.status).toBe(400)
      expect(slug.body).toEqual({ error: 'Invalid upload path.' })

      const episode = await post(uploadGuestPhoto, url, {
        file: file(JPEG, 'shot.jpg', 'image/jpeg'),
        episodeId: 'ep/../../banners',
      })
      expect(episode.status).toBe(400)
      expect(state.uploads).toEqual([])
    })

    it('refuses a non-image and an oversized file', async () => {
      const svg = await post(uploadGuestPhoto, url, {
        file: file(SVG, 'logo.svg', 'image/svg+xml'),
        slug: 'salesman-on-fire',
      })
      expect(svg.status).toBe(415)
      expect(svg.body).toEqual({ error: 'Unsupported image type.' })

      const big = await post(uploadGuestPhoto, url, {
        file: file(new Uint8Array(ADMIN_IMAGE_MAX_BYTES + 1), 'big.jpg', 'image/jpeg'),
        slug: 'salesman-on-fire',
      })
      expect(big.status).toBe(413)
      expect(state.uploads).toEqual([])
    })
  })

  describe('POST /api/admin/upload-story-image', () => {
    const url = 'http://localhost/api/admin/upload-story-image'
    const storyId = '33333333-3333-4333-8333-333333333333'

    it('stores a jpeg under media/{id}-timestamp and updates that story', async () => {
      const { status, body } = await post(uploadStoryImage, url, {
        file: file(JPEG, '../../evil.html', 'image/jpeg'),
        storyId,
      })
      expect(status).toBe(200)
      expect(state.uploads).toHaveLength(1)
      expect(state.uploads[0].path).toMatch(new RegExp(`^media/${storyId}-\\d+\\.jpg$`))
      expect(state.uploads[0].contentType).toBe('image/jpeg')
      expect(state.uploads[0].path).not.toContain('..')
      expect(state.storyUpdates).toEqual([{
        id: storyId,
        url: `https://cdn.example/${state.uploads[0].path}`,
      }])
      expect(body.url).toBe(state.storyUpdates[0].url)
    })

    it('refuses a story id that leaves media/ and does not update the row', async () => {
      const { status, body } = await post(uploadStoryImage, url, {
        file: file(JPEG, 'shot.jpg', 'image/jpeg'),
        storyId: '../avatars/victim',
      })
      expect(status).toBe(400)
      expect(body).toEqual({ error: 'Invalid upload path.' })
      expect(state.uploads).toEqual([])
      expect(state.storyUpdates).toEqual([])
    })

    it('refuses html bytes labeled as a jpeg', async () => {
      const { status, body } = await post(uploadStoryImage, url, {
        file: file(HTML, 'photo.jpg', 'image/jpeg'),
        storyId,
      })
      expect(status).toBe(415)
      expect(body).toEqual({ error: 'Unsupported image type.' })
      expect(state.uploads).toEqual([])
      expect(state.storyUpdates).toEqual([])
    })
  })

  describe('POST /api/guest/upload', () => {
    const url = 'http://localhost/api/guest/upload'

    it('stores a headshot under the engagement id', async () => {
      const { status, body } = await post(uploadGuestHeadshot, url, {
        token: 'guest-token',
        file: file(JPEG, '../pwned.html', 'image/jpeg'),
      })
      expect(status).toBe(200)
      expect(state.uploads).toEqual([{
        bucket: 'Branding',
        path: `guests/headshot-${state.engagementId}.jpg`,
        contentType: 'image/jpeg',
        upsert: true,
      }])
      expect(body.url).toBe(`https://cdn.example/guests/headshot-${state.engagementId}.jpg`)
    })

    it('accepts image/jpg bytes and refuses svg and files over 8MB', async () => {
      const jpg = await post(uploadGuestHeadshot, url, {
        token: 'guest-token',
        file: file(JPEG, 'headshot.jpg', 'image/jpg'),
      })
      expect(jpg.status).toBe(200)
      expect(state.uploads[0].contentType).toBe('image/jpeg')

      state.uploads = []
      const svg = await post(uploadGuestHeadshot, url, {
        token: 'guest-token',
        file: file(SVG, 'headshot.svg', 'image/svg+xml'),
      })
      expect(svg.status).toBe(415)
      expect(svg.body).toEqual({ error: 'Unsupported image type.' })

      const big = await post(uploadGuestHeadshot, url, {
        token: 'guest-token',
        file: file(new Uint8Array(8 * 1024 * 1024 + 1), 'big.jpg', 'image/jpeg'),
      })
      expect(big.status).toBe(413)
      expect(big.body).toEqual({ error: 'Image too large (max 8MB).' })
      expect(state.uploads).toEqual([])
    })
  })
})
