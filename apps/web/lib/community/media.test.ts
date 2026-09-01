import { describe, it, expect } from 'vitest'
import {
  BUCKET_MAX_BYTES,
  BUCKET_MIME_TYPES,
  COMMUNITY_MEDIA_BUCKET,
  IMAGE_ACCEPT_ATTR,
  MAX_IMAGE_BYTES,
  buildMediaPath,
  buildPermalink,
  formatBytes,
  toPermalinkPayload,
  toPostMedia,
  validateImageUpload,
} from './media'

const MB = 1024 * 1024

describe('validateImageUpload — mime rejection', () => {
  it('accepts the three CM-1 image types', () => {
    for (const mime of ['image/png', 'image/jpeg', 'image/webp']) {
      const result = validateImageUpload({ type: mime, size: 1024 })
      expect(result.ok, mime).toBe(true)
      if (result.ok) expect(result.kind).toBe('image')
    }
  })

  it('maps each accepted mime to the right extension', () => {
    const ext = (type: string) => {
      const r = validateImageUpload({ type, size: 1024 })
      return r.ok ? r.ext : null
    }
    expect(ext('image/png')).toBe('png')
    expect(ext('image/jpeg')).toBe('jpg')
    expect(ext('image/webp')).toBe('webp')
  })

  it('rejects video in CM-1 even though the bucket allows it (CM-2 owns video)', () => {
    const result = validateImageUpload({ type: 'video/mp4', size: 1024 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(415)
      expect(result.error).toContain('video/mp4')
    }
  })

  it('rejects gif, svg, pdf and other non-allowlisted types', () => {
    for (const mime of ['image/gif', 'image/svg+xml', 'application/pdf', 'text/html']) {
      const result = validateImageUpload({ type: mime, size: 1024 })
      expect(result.ok, mime).toBe(false)
      if (!result.ok) expect(result.status).toBe(415)
    }
  })

  it('rejects a missing or empty mime rather than guessing', () => {
    for (const type of [undefined, null, '']) {
      const result = validateImageUpload({ type, size: 1024 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.status).toBe(415)
    }
  })

  it('ignores charset parameters and casing on the mime', () => {
    expect(validateImageUpload({ type: 'IMAGE/PNG', size: 1024 }).ok).toBe(true)
    expect(validateImageUpload({ type: 'image/jpeg; charset=binary', size: 1024 }).ok).toBe(true)
  })

  it('carries a human-readable message on every rejection', () => {
    const result = validateImageUpload({ type: 'image/gif', size: 1024 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.length).toBeGreaterThan(10)
  })
})

describe('validateImageUpload — size rejection', () => {
  it('accepts a file exactly at the 10 MB cap', () => {
    expect(validateImageUpload({ type: 'image/png', size: MAX_IMAGE_BYTES }).ok).toBe(true)
  })

  it('rejects one byte over the cap with 413', () => {
    const result = validateImageUpload({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(413)
  })

  it('names the actual size and the limit in the message', () => {
    const result = validateImageUpload({ type: 'image/png', size: 14 * MB })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('14.0 MB')
      expect(result.error).toContain('10.0 MB')
    }
  })

  it('rejects an empty file', () => {
    const result = validateImageUpload({ type: 'image/png', size: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(422)
  })

  it('reports the type problem first when a file is both wrong-type and oversize', () => {
    const result = validateImageUpload({ type: 'video/mp4', size: 60 * MB })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(415)
  })

  it('caps images well below the bucket ceiling — the bucket is the backstop', () => {
    expect(MAX_IMAGE_BYTES).toBeLessThan(BUCKET_MAX_BYTES)
    expect(BUCKET_MAX_BYTES).toBe(104857600)
  })
})

describe('bucket + storage path', () => {
  it('targets community-media, never Branding', () => {
    expect(COMMUNITY_MEDIA_BUCKET).toBe('community-media')
    expect(COMMUNITY_MEDIA_BUCKET).not.toBe('Branding')
  })

  it('prefixes every object with the uploader auth.uid(), matching the RLS policy', () => {
    const uid = '3f7c1e2a-0000-4000-8000-000000000001'
    const path = buildMediaPath(uid, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'png')
    expect(path.startsWith(`${uid}/`)).toBe(true)
    expect(path).toBe(`${uid}/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png`)
  })

  it('never reuses a key — a fresh uuid means no overwrite', () => {
    const uid = 'uid-1'
    expect(buildMediaPath(uid, 'uuid-a', 'png')).not.toBe(buildMediaPath(uid, 'uuid-b', 'png'))
  })

  it('advertises exactly the bucket allowlist', () => {
    expect([...BUCKET_MIME_TYPES]).toEqual([
      'image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm',
    ])
  })

  it('offers only image types to the file input in CM-1', () => {
    expect(IMAGE_ACCEPT_ATTR).toBe('image/png,image/jpeg,image/webp')
    expect(IMAGE_ACCEPT_ATTR).not.toContain('video')
  })
})

describe('toPostMedia — text-only path is unchanged', () => {
  it('returns null for a pre-079 row with no media columns at all', () => {
    expect(toPostMedia({})).toBeNull()
  })

  it('returns null when every media column is null', () => {
    expect(toPostMedia({
      media_url: null, media_kind: null, media_width: null, media_height: null,
    })).toBeNull()
  })

  it('returns null for a null or undefined row', () => {
    expect(toPostMedia(null)).toBeNull()
    expect(toPostMedia(undefined)).toBeNull()
  })

  it('returns null for a half-written row rather than a broken image', () => {
    expect(toPostMedia({ media_url: 'https://x/y.png', media_kind: null })).toBeNull()
    expect(toPostMedia({ media_url: null, media_kind: 'image' })).toBeNull()
    expect(toPostMedia({ media_url: 'https://x/y.png', media_kind: 'bogus' })).toBeNull()
  })

  it('maps a complete image row', () => {
    expect(toPostMedia({
      media_url: 'https://cdn.test/a.png',
      media_kind: 'image',
      media_width: 1080,
      media_height: 1080,
    })).toEqual({ kind: 'image', url: 'https://cdn.test/a.png', width: 1080, height: 1080 })
  })

  it('tolerates missing dimensions without dropping the image', () => {
    expect(toPostMedia({ media_url: 'https://cdn.test/a.png', media_kind: 'image' }))
      .toEqual({ kind: 'image', url: 'https://cdn.test/a.png', width: null, height: null })
  })

  it('passes video through so CM-2 needs no change here', () => {
    const media = toPostMedia({
      media_url: 'https://cdn.test/a.mp4', media_kind: 'video', media_width: 1920, media_height: 1080,
    })
    expect(media?.kind).toBe('video')
  })
})

describe('permalink payload shape', () => {
  const row = {
    id: 'ba5eba11-0000-4000-8000-00000000cafe',
    body: 'Episode quote card from this week.',
    created_at: '2026-08-18T12:00:00.000Z',
    media_url: 'https://cdn.test/quote.png',
    media_kind: 'image',
    media_width: 1080,
    media_height: 1080,
    users: {
      id: 'user-1',
      display_name: 'gleith',
      full_name: 'George Leith',
      avatar_url: 'https://cdn.test/me.png',
      tier: 'pro',
    },
  }

  it('builds /community/{id}', () => {
    expect(buildPermalink('abc')).toBe('/community/abc')
    expect(toPermalinkPayload(row).permalink).toBe(`/community/${row.id}`)
  })

  it('returns exactly the documented keys — no more, no less', () => {
    expect(Object.keys(toPermalinkPayload(row)).sort())
      .toEqual(['author', 'body', 'created_at', 'id', 'media', 'permalink'].sort())
  })

  it('nests media as { kind, url, width, height }', () => {
    expect(toPermalinkPayload(row).media)
      .toEqual({ kind: 'image', url: 'https://cdn.test/quote.png', width: 1080, height: 1080 })
  })

  it('returns media: null for a text-only post', () => {
    const { media_url: _u, media_kind: _k, media_width: _w, media_height: _h, ...textOnly } = row
    expect(toPermalinkPayload(textOnly).media).toBeNull()
  })

  it('prefers full_name, falls back to display_name, then to Member', () => {
    expect(toPermalinkPayload(row).author.displayName).toBe('George Leith')
    expect(toPermalinkPayload({ ...row, users: { ...row.users, full_name: null } }).author.displayName)
      .toBe('gleith')
    expect(toPermalinkPayload({ ...row, users: null }).author.displayName).toBe('Member')
  })

  it('never leaks the author email or any column beyond the four author keys', () => {
    expect(Object.keys(toPermalinkPayload(row).author).sort())
      .toEqual(['avatarUrl', 'displayName', 'id', 'tier'].sort())
  })
})

describe('formatBytes', () => {
  it('formats across the unit boundaries', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(10 * MB)).toBe('10.0 MB')
  })
})
