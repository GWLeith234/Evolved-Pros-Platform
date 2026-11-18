/**
 * Shared xAI image generation client. Admin image routes and media hero art
 * both read the key and model from here. Never log the key or an Authorization
 * header.
 */

export const XAI_IMAGES_URL = 'https://api.x.ai/v1/images/generations'

/**
 * xAI retired the previous image slug on 2026-11-02. Requests to that name
 * are served by this model at low quality, so callers send this id explicitly.
 */
export const DEFAULT_XAI_IMAGE_MODEL = 'grok-imagine-image-2.0'

/** Env values equal to this slug are rewritten to DEFAULT_XAI_IMAGE_MODEL. */
export const RETIRED_XAI_IMAGE_MODEL = 'grok-imagine-image-quality'

/** Drafts and exploration. Finals pass XAI_IMAGE_QUALITY_FINAL. */
export const XAI_IMAGE_QUALITY_DRAFT = 'low' as const

/** George's rule: medium for finals. */
export const XAI_IMAGE_QUALITY_FINAL = 'medium' as const

export type XaiImageQuality = typeof XAI_IMAGE_QUALITY_DRAFT | typeof XAI_IMAGE_QUALITY_FINAL

export class XaiImageError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'XaiImageError'
    this.status = status
  }
}

export function isXaiModelRefusal(err: unknown): err is XaiImageError {
  if (!(err instanceof XaiImageError)) return false
  if (err.status === 404) return true
  return err.status === 400 && /model/i.test(err.message)
}

export function xaiModelRefusalMessage(model: string): string {
  return `Model "${model}" not accessible. Set XAI_IMAGE_MODEL to a model your team has access to.`
}

export function resolveXaiImageModel(): string {
  const fromEnv = process.env.XAI_IMAGE_MODEL?.trim()
  if (!fromEnv) return DEFAULT_XAI_IMAGE_MODEL
  if (fromEnv === RETIRED_XAI_IMAGE_MODEL) {
    console.warn(
      `[xai-images] XAI_IMAGE_MODEL is set to the retired model ${RETIRED_XAI_IMAGE_MODEL}. Using ${DEFAULT_XAI_IMAGE_MODEL}.`,
    )
    return DEFAULT_XAI_IMAGE_MODEL
  }
  return fromEnv
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

/** Logs the billed ticks when xAI includes them. Never logs the rest of the payload. */
export function logXaiImageCost(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return
  const usage = (payload as { usage?: { cost_in_usd_ticks?: unknown } }).usage
  const ticks = usage?.cost_in_usd_ticks
  if (typeof ticks === 'number' && Number.isFinite(ticks)) {
    console.info(`[xai-images] usage.cost_in_usd_ticks=${ticks}`)
  }
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
  /** Defaults to low. Pass medium for finals. */
  quality?: XaiImageQuality
  apiKey?: string
  fetchImpl?: FetchLike
}): Promise<Buffer[]> {
  const apiKey = input.apiKey ?? resolveXaiApiKey()
  if (!apiKey) {
    throw new XaiImageError('XAI_API_KEY is not configured on the server', 500)
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const model = resolveXaiImageModel()
  const quality = input.quality ?? XAI_IMAGE_QUALITY_DRAFT
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
        quality,
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

  let parsed: { data?: XaiImageItem[]; usage?: { cost_in_usd_ticks?: number } }
  try {
    parsed = JSON.parse(raw) as { data?: XaiImageItem[]; usage?: { cost_in_usd_ticks?: number } }
  } catch {
    throw new XaiImageError('xAI returned a non-JSON response', 502)
  }

  logXaiImageCost(parsed)

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
