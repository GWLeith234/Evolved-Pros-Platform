import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_XAI_IMAGE_MODEL,
  XAI_IMAGES_URL,
  redactSecrets,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
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
  })

  it('defaults the image model to grok-imagine-image-quality', () => {
    delete process.env.XAI_IMAGE_MODEL
    expect(DEFAULT_XAI_IMAGE_MODEL).toBe('grok-imagine-image-quality')
    expect(resolveXaiImageModel()).toBe('grok-imagine-image-quality')

    process.env.XAI_IMAGE_MODEL = '   '
    expect(resolveXaiImageModel()).toBe('grok-imagine-image-quality')

    process.env.XAI_IMAGE_MODEL = 'custom-image-model'
    expect(resolveXaiImageModel()).toBe('custom-image-model')
  })

  it('posts to the images endpoint with a bearer key and does not echo the key in errors', async () => {
    delete process.env.XAI_IMAGE_MODEL
    process.env.XAI_API_KEY = 'xai-test-secret-value'
    expect(resolveXaiApiKey()).toBe('xai-test-secret-value')

    const calls: Array<{ url: string; auth: string; body: Record<string, unknown> }> = []
    const png = Buffer.from('png-bytes').toString('base64')
    await requestXaiImages({
      prompt: 'test image',
      n: 3,
      apiKey: 'xai-test-secret-value',
      fetchImpl: async (url, init) => {
        const headers = init?.headers as Record<string, string>
        calls.push({
          url,
          auth: headers.Authorization ?? '',
          body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        })
        return new Response(JSON.stringify({ data: [{ b64_json: png }] }), { status: 200 })
      },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe(XAI_IMAGES_URL)
    expect(calls[0]?.url).toBe('https://api.x.ai/v1/images/generations')
    expect(calls[0]?.auth).toBe('Bearer xai-test-secret-value')
    expect(calls[0]?.body).toMatchObject({
      model: 'grok-imagine-image-quality',
      prompt: 'test image',
      n: 3,
      aspect_ratio: '16:9',
      resolution: '2k',
      response_format: 'b64_json',
    })

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

  it('keeps the admin images generate route on the shared model helper', () => {
    const plural = readFileSync(
      resolve(here, '../../app/api/admin/images/generate/route.ts'),
      'utf8',
    )
    expect(plural).not.toContain('grok-2-image')
    expect(plural).toContain("from '@/lib/art/xaiImages'")
    expect(plural).toContain('resolveXaiApiKey')
    expect(plural).toContain('requestXaiImages')
    expect(plural).toContain('resolveXaiImageModel')
  })

  it('does not keep the legacy singular /api/admin/image tree', () => {
    expect(existsSync(resolve(here, '../../app/api/admin/image'))).toBe(false)
  })
})
