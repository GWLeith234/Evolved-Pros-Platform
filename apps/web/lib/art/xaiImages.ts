/**
 * Shared xAI image generation client. Admin image routes and media hero art
 * both read the key and model from here. Never log the key or an Authorization
 * header.
 */

export const XAI_IMAGES_URL = 'https://api.x.ai/v1/images/generations'

/** Stale default was grok-2-image. Quality is the locked image model. */
export const DEFAULT_XAI_IMAGE_MODEL = 'grok-imagine-image-quality'

export class XaiImageError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'XaiImageError'
    this.status = status
  }
}

export function resolveXaiImageModel(): string {
  const fromEnv = process.env.XAI_IMAGE_MODEL?.trim()
  return fromEnv || DEFAULT_XAI_IMAGE_MODEL
}

export function resolveXaiApiKey(): string | null {
  const key = process.env.XAI_API_KEY?.trim()
  return key ? key : null
}

export function redactSecrets(text: string): string {
  let out = text
  const key = process.env.XAI_API_KEY?.trim()
  if (key) out = out.split(key).join('[redacted]')
  out = out.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
  return out
}

export function safeErrorMessage(err: unknown): string {
  const raw = err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : 'Image generation failed'
  return redactSecrets(raw).slice(0, 500)
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

interface XaiImageItem {
  url?: string
  b64_json?: string
}

export async function requestXaiImages(input: {
  prompt: string
  n?: number
  aspectRatio?: string
  resolution?: string
  apiKey?: string
  fetchImpl?: FetchLike
}): Promise<Buffer[]> {
  const apiKey = input.apiKey ?? resolveXaiApiKey()
  if (!apiKey) {
    throw new XaiImageError('XAI_API_KEY is not configured on the server', 500)
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const model = resolveXaiImageModel()
  let res: Response
  try {
    res = await fetchImpl(XAI_IMAGES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        n: input.n ?? 1,
        aspect_ratio: input.aspectRatio ?? '16:9',
        resolution: input.resolution ?? '2k',
        response_format: 'b64_json',
      }),
    })
  } catch (err) {
    throw new XaiImageError(
      `Could not reach the xAI image API: ${safeErrorMessage(err)}`,
      502,
    )
  }

  const raw = await res.text()
  if (!res.ok) {
    const detail = redactSecrets(raw).slice(0, 300)
    throw new XaiImageError(
      `xAI image generation failed (HTTP ${res.status}): ${detail}`,
      res.status,
    )
  }

  let parsed: { data?: XaiImageItem[] }
  try {
    parsed = JSON.parse(raw) as { data?: XaiImageItem[] }
  } catch {
    throw new XaiImageError('xAI returned a non-JSON response', 502)
  }

  const buffers: Buffer[] = []
  for (const item of parsed.data ?? []) {
    if (item.b64_json) {
      const buf = Buffer.from(item.b64_json, 'base64')
      if (buf.length > 0) buffers.push(buf)
      continue
    }
    if (!item.url) continue
    try {
      const dl = await fetchImpl(item.url)
      if (!dl.ok) continue
      const buf = Buffer.from(await dl.arrayBuffer())
      if (buf.length > 0) buffers.push(buf)
    } catch (err) {
      throw new XaiImageError(
        `Could not download the generated image: ${safeErrorMessage(err)}`,
        502,
      )
    }
  }

  if (buffers.length === 0) {
    throw new XaiImageError('xAI returned no image data', 502)
  }
  return buffers
}
