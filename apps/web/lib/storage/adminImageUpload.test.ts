import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_IMAGE_MAX_BYTES, validateAdminImageUpload } from './adminImageUpload'

const state = vi.hoisted(() => ({
  uploads: [] as { bucket: string; path: string; contentType: string; upsert: boolean }[],
}))

vi.mock('@/lib/admin/helpers', () => ({
  requireAdminApi: async () => ({ userId: 'admin-1' }),
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
  },
}))

import { POST as uploadImage } from '@/app/api/admin/images/upload/route'

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const GIF = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
const HTML = new TextEncoder().encode('<!DOCTYPE html><html><script>alert(1)</script></html>')

function file(bytes: Uint8Array, name: string, type: string): File {
  const copy = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copy).set(bytes)
  return new File([copy], name, { type })
}

function form(fields: { file: File; bucket?: string; folder?: string }): FormData {
  const fd = new FormData()
  fd.set('file', fields.file)
  if (fields.bucket !== undefined) fd.set('bucket', fields.bucket)
  if (fields.folder !== undefined) fd.set('folder', fields.folder)
  return fd
}

async function post(fd: FormData): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await uploadImage(new Request('http://localhost/api/admin/images/upload', {
    method: 'POST',
    body: fd,
  }))
  return { status: res.status, body: await res.json() as Record<string, unknown> }
}

describe('validateAdminImageUpload', () => {
  it('derives the extension and content type from the byte signature', () => {
    const cases: Array<{ bytes: Uint8Array; type: string; ext: string; mime: string }> = [
      { bytes: JPEG, type: 'image/jpeg', ext: 'jpg', mime: 'image/jpeg' },
      { bytes: PNG, type: 'image/png', ext: 'png', mime: 'image/png' },
      { bytes: GIF, type: 'image/gif', ext: 'gif', mime: 'image/gif' },
      { bytes: WEBP, type: 'image/webp', ext: 'webp', mime: 'image/webp' },
    ]
    for (const sample of cases) {
      const decision = validateAdminImageUpload({
        bucket: 'Branding',
        folder: 'uploads',
        declaredType: sample.type,
        byteLength: sample.bytes.byteLength,
        bytes: sample.bytes,
        now: 1700000000000,
      })
      expect(decision, sample.type).toEqual({
        ok: true,
        bucket: 'Branding',
        path: `uploads/1700000000000.${sample.ext}`,
        contentType: sample.mime,
      })
    }
  })

  it('accepts a real jpeg when the client omits Content-Type', () => {
    const decision = validateAdminImageUpload({
      bucket: null,
      folder: null,
      declaredType: '',
      byteLength: JPEG.byteLength,
      bytes: JPEG,
      now: 42,
    })
    expect(decision).toMatchObject({ ok: true, contentType: 'image/jpeg', path: 'uploads/42.jpg' })
  })

  it('refuses a declared svg or html type even when the bytes are a jpeg', () => {
    for (const declaredType of ['image/svg+xml', 'text/html', 'IMAGE/SVG+XML']) {
      const decision = validateAdminImageUpload({
        bucket: 'Branding',
        folder: 'uploads',
        declaredType,
        byteLength: JPEG.byteLength,
        bytes: JPEG,
      })
      expect(decision, declaredType).toEqual({ ok: false, status: 415, error: 'Unsupported image type.' })
    }
  })

  it('refuses html and svg bytes labeled as jpeg', () => {
    for (const bytes of [SVG, HTML]) {
      const decision = validateAdminImageUpload({
        bucket: 'Branding',
        folder: 'uploads',
        declaredType: 'image/jpeg',
        byteLength: bytes.byteLength,
        bytes,
      })
      expect(decision).toEqual({ ok: false, status: 415, error: 'Unsupported image type.' })
    }
  })

  it('refuses a content type that does not match the signature', () => {
    const decision = validateAdminImageUpload({
      bucket: 'Branding',
      folder: 'uploads',
      declaredType: 'image/png',
      byteLength: JPEG.byteLength,
      bytes: JPEG,
    })
    expect(decision).toEqual({ ok: false, status: 415, error: 'Unsupported image type.' })
  })

  it('refuses an oversized body with 413 before it needs the bytes', () => {
    const decision = validateAdminImageUpload({
      bucket: 'Branding',
      folder: 'uploads',
      declaredType: 'image/jpeg',
      byteLength: ADMIN_IMAGE_MAX_BYTES + 1,
      bytes: null,
    })
    expect(decision).toEqual({ ok: false, status: 413, error: 'File too large (max 10MB).' })
  })

  it('refuses another bucket and a folder that leaves the uploads prefix', () => {
    expect(validateAdminImageUpload({
      bucket: 'fit-media',
      folder: 'uploads',
      declaredType: 'image/jpeg',
      byteLength: JPEG.byteLength,
      bytes: JPEG,
    })).toEqual({ ok: false, status: 400, error: 'Unsupported bucket.' })

    for (const folder of ['../fit-media', 'avatars/victim-user', 'uploads/../../banners', '..', 'uploads/evil.svg']) {
      expect(validateAdminImageUpload({
        bucket: 'Branding',
        folder,
        declaredType: 'image/jpeg',
        byteLength: JPEG.byteLength,
        bytes: JPEG,
      }), folder).toEqual({ ok: false, status: 400, error: 'Unsupported folder.' })
    }
  })

  it('keeps a hostile filename out of the object key', () => {
    const decision = validateAdminImageUpload({
      bucket: 'Branding',
      folder: 'avatars',
      declaredType: 'image/jpeg',
      byteLength: JPEG.byteLength,
      bytes: JPEG,
      now: 99,
    })
    expect(decision).toEqual({
      ok: true,
      bucket: 'Branding',
      path: 'avatars/99.jpg',
      contentType: 'image/jpeg',
    })
  })
})

describe('POST /api/admin/images/upload', () => {
  beforeEach(() => {
    state.uploads = []
  })

  it('stores a jpeg under Branding with the sniffed type, ignoring the filename', async () => {
    const { status, body } = await post(form({
      file: file(JPEG, '../../banners/victim/pwned.html', 'image/jpeg'),
      bucket: 'Branding',
      folder: 'uploads',
    }))

    expect(status).toBe(200)
    expect(state.uploads).toHaveLength(1)
    expect(state.uploads[0]).toMatchObject({
      bucket: 'Branding',
      contentType: 'image/jpeg',
      upsert: false,
    })
    expect(state.uploads[0].path).toMatch(/^uploads\/\d+\.jpg$/)
    expect(state.uploads[0].path).not.toContain('..')
    expect(body.url).toBe(`https://cdn.example/${state.uploads[0].path}`)
  })

  it('refuses an svg upload with 415 and does not write storage', async () => {
    const { status, body } = await post(form({
      file: file(SVG, 'logo.svg', 'image/svg+xml'),
    }))
    expect(status).toBe(415)
    expect(body).toEqual({ error: 'Unsupported image type.' })
    expect(state.uploads).toEqual([])
  })

  it('refuses html bytes labeled image/jpeg with 415', async () => {
    const { status, body } = await post(form({
      file: file(HTML, 'photo.jpg', 'image/jpeg'),
    }))
    expect(status).toBe(415)
    expect(body).toEqual({ error: 'Unsupported image type.' })
    expect(state.uploads).toEqual([])
  })

  it('refuses an oversized file with 413', async () => {
    const { status, body } = await post(form({
      file: file(new Uint8Array(ADMIN_IMAGE_MAX_BYTES + 1), 'big.jpg', 'image/jpeg'),
    }))
    expect(status).toBe(413)
    expect(body).toEqual({ error: 'File too large (max 10MB).' })
    expect(state.uploads).toEqual([])
  })

  it('refuses a service-role write into another bucket with 400', async () => {
    const { status, body } = await post(form({
      file: file(JPEG, 'shot.jpg', 'image/jpeg'),
      bucket: 'fit-media',
    }))
    expect(status).toBe(400)
    expect(body).toEqual({ error: 'Unsupported bucket.' })
    expect(state.uploads).toEqual([])
  })

  it('refuses a folder path that would leave the chosen prefix with 400', async () => {
    const { status, body } = await post(form({
      file: file(JPEG, 'shot.jpg', 'image/jpeg'),
      folder: 'avatars/victim-user',
    }))
    expect(status).toBe(400)
    expect(body).toEqual({ error: 'Unsupported folder.' })
    expect(state.uploads).toEqual([])
  })
})
