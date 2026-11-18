import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GUEST_PORTRAIT_MODEL, GUEST_PORTRAIT_QUALITY } from './guest-portrait-style'
import {
  DEFAULT_XAI_IMAGE_MODEL,
  RETIRED_XAI_IMAGE_MODEL,
  XAI_IMAGES_URL,
  XAI_IMAGE_QUALITY_DRAFT,
  XAI_IMAGE_QUALITY_FINAL,
  isXaiModelRefusal,
  redactSecrets,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
  XaiImageError,
} from './xaiImages'

const here = dirname(fileURLToPath(import.meta.url))

describe('xAI image client', () => {
  const prevModel = process.env.XAI_IMAGE_MODEL
  const prevKey = process.env.XAI_API_KEY

  afterEach(() => {
    if (prevModel === undefined) delete process.env.XAI_IMAGE_MODEL
    else process.env.XAI_IMAGE_MODEL = prevModel
    if (prevKey === undefined) delete process.env.XAI_API_KEY
    else process.env.XAI_API_KEY = prevKey
    vi.restoreAllMocks()
  })

  it('defaults the image model to grok-imagine-image-2.0', () => {
    delete process.env.XAI_IMAGE_MODEL
    expect(DEFAULT_XAI_IMAGE_MODEL).toBe('grok-imagine-image-2.0')
    expect(resolveXaiImageModel()).toBe('grok-imagine-image-2.0')

    process.env.XAI_IMAGE_MODEL = '   '
    expect(resolveXaiImageModel()).toBe('grok-imagine-image-2.0')

    process.env.XAI_IMAGE_MODEL = 'custom-image-model'
    expect(resolveXaiImageModel()).toBe('custom-image-model')
  })

  it('rewrites a retired env override and warns without printing the key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.XAI_API_KEY = 'xai-test-secret-value'
    process.env.XAI_IMAGE_MODEL = `  ${RETIRED_XAI_IMAGE_MODEL}  `

    expect(resolveXaiImageModel()).toBe(DEFAULT_XAI_IMAGE_MODEL)
    expect(warn).toHaveBeenCalledTimes(1)
    const warning = String(warn.mock.calls[0]?.[0])
    expect(warning).toContain(RETIRED_XAI_IMAGE_MODEL)
    expect(warning).toContain(DEFAULT_XAI_IMAGE_MODEL)
    expect(warning).not.toContain('xai-test-secret-value')
  })

  it('posts low quality by default and medium when a final asks for it', async () => {
    delete process.env.XAI_IMAGE_MODEL
    process.env.XAI_API_KEY = 'xai-test-secret-value'
    expect(resolveXaiApiKey()).toBe('xai-test-secret-value')

    const calls: Array<{ url: string; auth: string; body: Record<string, unknown> }> = []
    const png = Buffer.from('png-bytes').toString('base64')
    const fetchImpl = async (url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      calls.push({
        url,
        auth: headers.Authorization ?? '',
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      })
      return new Response(
        JSON.stringify({ data: [{ b64_json: png }], usage: { cost_in_usd_ticks: 400 } }),
        { status: 200 },
      )
    }

    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await requestXaiImages({
      prompt: 'test image',
      n: 3,
      apiKey: 'xai-test-secret-value',
      fetchImpl,
    })
    await requestXaiImages({
      prompt: 'final portrait',
      quality: XAI_IMAGE_QUALITY_FINAL,
      apiKey: 'xai-test-secret-value',
      fetchImpl,
    })

    expect(calls).toHaveLength(2)
    expect(calls[0]?.url).toBe(XAI_IMAGES_URL)
    expect(calls[0]?.url).toBe('https://api.x.ai/v1/images/generations')
    expect(calls[0]?.auth).toBe('Bearer xai-test-secret-value')
    expect(calls[0]?.body).toMatchObject({
      model: 'grok-imagine-image-2.0',
      prompt: 'test image',
      n: 3,
      aspect_ratio: '16:9',
      resolution: '2k',
      quality: 'low',
      response_format: 'b64_json',
    })
    expect(calls[1]?.body).toMatchObject({
      model: 'grok-imagine-image-2.0',
      prompt: 'final portrait',
      quality: 'medium',
    })
    expect(XAI_IMAGE_QUALITY_DRAFT).toBe('low')
    expect(info.mock.calls.map(call => String(call[0]))).toEqual([
      '[xai-images] usage.cost_in_usd_ticks=400',
      '[xai-images] usage.cost_in_usd_ticks=400',
    ])
    expect(JSON.stringify(info.mock.calls)).not.toContain('xai-test-secret-value')

    const leaked = safeErrorMessage(new Error('rejected xai-test-secret-value Bearer xai-test-secret-value'))
    expect(leaked).not.toContain('xai-test-secret-value')
    expect(leaked).toContain('[redacted]')
    expect(redactSecrets('Authorization: Bearer xai-test-secret-value')).not.toContain('xai-test-secret-value')

    try {
      await requestXaiImages({
        prompt: 'test image',
        apiKey: 'xai-test-secret-value',
        fetchImpl: async () => new Response('bad key xai-test-secret-value', { status: 401 }),
      })
      throw new Error('expected xAI failure')
    } catch (err) {
      const message = safeErrorMessage(err)
      expect(message).toContain('[redacted]')
      expect(message).not.toContain('xai-test-secret-value')
    }
  })

  it('does not log a cost when the response omits usage', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const png = Buffer.from('png-bytes').toString('base64')
    await requestXaiImages({
      prompt: 'draft',
      apiKey: 'xai-test-secret-value',
      fetchImpl: async () => new Response(JSON.stringify({ data: [{ b64_json: png }] }), { status: 200 }),
    })
    expect(info).not.toHaveBeenCalled()
  })

  it('treats a missing model as a refusal and a missing key as its own error', () => {
    expect(isXaiModelRefusal(new XaiImageError('nope', 404))).toBe(true)
    expect(isXaiModelRefusal(new XaiImageError('model grok-old was refused', 400))).toBe(true)
    expect(isXaiModelRefusal(new XaiImageError('prompt too long', 400))).toBe(false)
    expect(isXaiModelRefusal(new Error('model'))).toBe(false)
  })

  it('keeps finals on medium and drafts off the retired generators', () => {
    expect(GUEST_PORTRAIT_MODEL).toBe('grok-imagine-image-2.0')
    expect(GUEST_PORTRAIT_QUALITY).toBe('medium')

    const singular = readFileSync(
      resolve(here, '../../app/api/admin/image/generate/route.ts'),
      'utf8',
    )
    const plural = readFileSync(
      resolve(here, '../../app/api/admin/images/generate/route.ts'),
      'utf8',
    )
    const eventImage = readFileSync(
      resolve(here, '../../app/api/admin/generate-event-image/route.ts'),
      'utf8',
    )
    const portrait = readFileSync(
      resolve(here, '../../app/api/admin/episodes/[episodeId]/guest-portrait/route.ts'),
      'utf8',
    )
    const hero = readFileSync(resolve(here, '../media/generateHero.ts'), 'utf8')

    for (const source of [singular, plural, eventImage, portrait, hero]) {
      expect(source).not.toContain('grok-2-image')
      expect(source).not.toContain('dall-e-3')
      expect(source).not.toContain(RETIRED_XAI_IMAGE_MODEL)
    }
    for (const source of [singular, plural, eventImage]) {
      expect(source).toContain("from '@/lib/art/xaiImages'")
      expect(source).toContain('resolveXaiApiKey')
      expect(source).toContain('requestXaiImages')
      expect(source).toContain('XAI_IMAGE_QUALITY_DRAFT')
      expect(source).not.toContain('openai')
    }
    expect(singular).toContain('resolveXaiImageModel')
    expect(plural).toContain('isXaiModelRefusal')
    expect(eventImage).toContain('isXaiModelRefusal')
    expect(portrait).toContain('GUEST_PORTRAIT_QUALITY')
    expect(portrait).toContain('logXaiImageCost')
    expect(hero).not.toContain("quality: 'medium'")
    expect(hero).not.toContain('XAI_IMAGE_QUALITY_FINAL')
  })
})
