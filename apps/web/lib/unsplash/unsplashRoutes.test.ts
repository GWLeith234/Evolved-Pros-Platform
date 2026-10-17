/**
 * Admin Unsplash search used to answer 200 with an empty list when
 * UNSPLASH_ACCESS_KEY was unset, so the picker looked like "no photos".
 * A missing or blank key is a 503 with a stable message. The env var name
 * stays on the server log.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => ({ userId: 'admin-1' }),
}))

import { GET as searchLegacy } from '@/app/api/admin/unsplash/route'
import { GET as searchImages } from '@/app/api/admin/images/unsplash/route'
import { GET as searchImage } from '@/app/api/admin/image/unsplash/route'
import { UNSPLASH_UNAVAILABLE, unsplashAccessKey } from '@/lib/unsplash/access'

const KEY = 'unsplash-test-secret'

const PHOTO = {
  id: 'photo-1',
  urls: {
    regular: 'https://images.unsplash.com/photo-1',
    small: 'https://images.unsplash.com/photo-1?small',
    thumb: 'https://images.unsplash.com/photo-1?thumb',
  },
  user: { name: 'Ada Lovelace', username: 'ada', links: { html: 'https://unsplash.com/@ada' } },
  links: { html: 'https://unsplash.com/photos/photo-1' },
}

function jsonResponse() {
  return { ok: true, json: async () => ({ results: [PHOTO] }) }
}

describe('Unsplash access key fail-closed', () => {
  const saved = process.env.UNSPLASH_ACCESS_KEY
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (saved === undefined) delete process.env.UNSPLASH_ACCESS_KEY
    else process.env.UNSPLASH_ACCESS_KEY = saved
    vi.unstubAllGlobals()
    errorSpy.mockRestore()
  })

  function logged(): string {
    return errorSpy.mock.calls.map(call => JSON.stringify(call)).join('\n')
  }

  async function bodyOf(res: Response): Promise<Record<string, unknown>> {
    return (await res.json()) as Record<string, unknown>
  }

  it('treats a blank key as unset and keeps a trimmed key', () => {
    delete process.env.UNSPLASH_ACCESS_KEY
    expect(unsplashAccessKey()).toBeNull()
    process.env.UNSPLASH_ACCESS_KEY = ' \n\t '
    expect(unsplashAccessKey()).toBeNull()
    process.env.UNSPLASH_ACCESS_KEY = `  ${KEY}  `
    expect(unsplashAccessKey()).toBe(KEY)
    expect(logged()).toContain('UNSPLASH_ACCESS_KEY is not set')
    expect(logged()).not.toContain(KEY)
  })

  it.each([
    ['legacy', searchLegacy, 'http://localhost/api/admin/unsplash?query=boise'],
    ['images', searchImages, 'http://localhost/api/admin/images/unsplash?query=boise'],
    ['image', searchImage, 'http://localhost/api/admin/image/unsplash?q=boise'],
  ] as const)('%s search returns 503 and does not call Unsplash when the key is missing', async (_name, handler, url) => {
    delete process.env.UNSPLASH_ACCESS_KEY
    const fetchImpl = vi.fn()
    vi.stubGlobal('fetch', fetchImpl)

    const res = await handler(new Request(url))
    const body = await bodyOf(res)

    expect(res.status).toBe(503)
    expect(body).toEqual({ error: UNSPLASH_UNAVAILABLE })
    expect(JSON.stringify(body)).not.toContain('UNSPLASH_ACCESS_KEY')
    expect(logged()).toContain('UNSPLASH_ACCESS_KEY is not set')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('still searches when the key is set and does not echo the key', async () => {
    process.env.UNSPLASH_ACCESS_KEY = KEY
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse())
    vi.stubGlobal('fetch', fetchImpl)

    const legacy = await searchLegacy(new Request('http://localhost/api/admin/unsplash?query=boise'))
    const images = await searchImages(new Request('http://localhost/api/admin/images/unsplash?query=boise'))
    const image = await searchImage(new Request('http://localhost/api/admin/image/unsplash?q=boise'))
    const legacyBody = await bodyOf(legacy)
    const imagesBody = await bodyOf(images)
    const imageBody = await bodyOf(image)

    expect(legacy.status).toBe(200)
    expect(images.status).toBe(200)
    expect(image.status).toBe(200)
    expect(legacyBody).toMatchObject({
      photos: [{ id: 'photo-1', url: PHOTO.urls.regular, credit: 'Ada Lovelace' }],
    })
    expect(imagesBody).toMatchObject({
      photos: [{ id: 'photo-1', thumb: PHOTO.urls.small, profileUrl: 'https://unsplash.com/@ada' }],
    })
    expect(imageBody).toMatchObject({
      results: [{ id: 'photo-1', user: { username: 'ada' } }],
    })

    const serialized = JSON.stringify([legacyBody, imagesBody, imageBody])
    expect(serialized).not.toContain(KEY)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    for (const call of fetchImpl.mock.calls) {
      const init = call[1] as RequestInit
      expect((init.headers as Record<string, string>).Authorization).toBe(`Client-ID ${KEY}`)
    }
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('the live stock picker surfaces a non-ok search', () => {
    const picker = readFileSync(
      resolve(__dirname, '../../components/admin/ImagePicker.tsx'),
      'utf8',
    )
    expect(picker).toContain('/api/admin/image/unsplash')
    expect(picker).toContain("if (!res.ok) throw new Error(data.error ?? 'Search failed')")
  })
})
