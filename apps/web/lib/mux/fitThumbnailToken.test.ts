import { generateKeyPairSync } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mux, coerceFitThumbnailTime, generateFitMuxThumbnailToken } from '@/lib/mux/client'

describe('Fit Mux thumbnail token', () => {
  beforeAll(() => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    process.env.MUX_SIGNING_KEY = 'fit-test-signing-key'
    process.env.MUX_PRIVATE_KEY = privateKey
  })

  it('signs type thumbnail with params.time and aud t', async () => {
    const spy = vi.spyOn(mux.jwt, 'signPlaybackId')
    const token = await generateFitMuxThumbnailToken('play-ready', 3.5)
    expect(token).toEqual(expect.any(String))
    expect(spy).toHaveBeenCalledWith('play-ready', {
      type: 'thumbnail',
      expiration: '15m',
      keyId: 'fit-test-signing-key',
      keySecret: process.env.MUX_PRIVATE_KEY,
      params: { time: '3.5' },
    })
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString()) as {
      aud?: string
      sub?: string
      time?: unknown
    }
    expect(payload.aud).toBe('t')
    expect(payload.sub).toBe('play-ready')
    expect(payload.time).toBe('3.5')
    spy.mockRestore()
  })

  it('omits time when the frame offset is null', async () => {
    const spy = vi.spyOn(mux.jwt, 'signPlaybackId')
    const token = await generateFitMuxThumbnailToken('play-ready', null)
    const config = spy.mock.calls[0]?.[1] as unknown as { type?: string; params?: unknown }
    expect(config.type).toBe('thumbnail')
    expect(config.params).toBeUndefined()
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString()) as {
      aud?: string
      time?: unknown
    }
    expect(payload.aud).toBe('t')
    expect(payload.time).toBeUndefined()
    spy.mockRestore()
  })

  it('treats blank and negative offsets as omitted', () => {
    expect(coerceFitThumbnailTime(null)).toBeNull()
    expect(coerceFitThumbnailTime('')).toBeNull()
    expect(coerceFitThumbnailTime(-1)).toBeNull()
    expect(coerceFitThumbnailTime('3.5')).toBe(3.5)
    expect(coerceFitThumbnailTime(0)).toBe(0)
  })

  it('returns null when the signing key is missing', async () => {
    const saved = process.env.MUX_SIGNING_KEY
    delete process.env.MUX_SIGNING_KEY
    await expect(generateFitMuxThumbnailToken('play-ready', 3.5)).resolves.toBeNull()
    process.env.MUX_SIGNING_KEY = saved
  })
})
