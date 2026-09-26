export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import OpenAI from 'openai'
import {
  XaiImageError,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
} from '@/lib/art/xaiImages'

type BrandStyle = 'photorealistic' | 'cinematic' | 'dark editorial'

const STYLE_PREFIX: Record<BrandStyle, string> = {
  photorealistic: 'Professional photorealistic photography,',
  cinematic: 'Cinematic film still,',
  'dark editorial': 'Dark editorial photography,',
}

const BRAND_SUFFIX =
  ' Evolved Pros brand aesthetic, dark navy background #0A0F18, gold accent lighting #C9A84C, professional business environment, high contrast, sharp focus.'

function buildPrompt(prompt: string, styleRaw: string): string {
  const styleKey = styleRaw.trim().toLowerCase()
  if (styleKey in STYLE_PREFIX) {
    const style = styleKey as BrandStyle
    return `${STYLE_PREFIX[style]}${BRAND_SUFFIX} ${prompt}`
  }
  const style = styleRaw.trim() || 'cinematic'
  return `${prompt}. ${style} style, professional quality, no text overlays`
}

function resolveCount(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.min(3, Math.max(1, Math.round(raw)))
  }
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw)
    if (Number.isFinite(n)) return Math.min(3, Math.max(1, Math.round(n)))
  }
  // Default 3 keeps the UI ImagePicker gallery behaviour.
  return 3
}

async function generateOne(prompt: string): Promise<Buffer | null> {
  if (resolveXaiApiKey()) {
    try {
      const images = await requestXaiImages({ prompt, n: 1 })
      if (images[0]) return images[0]
    } catch (err) {
      console.error('[images/generate] Grok failed, trying DALL-E:', safeErrorMessage(err))
      if (err instanceof XaiImageError && err.status === 404) throw err
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey })
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: '1792x1024',
        quality: 'standard',
        n: 1,
      })
      const url = res.data?.[0]?.url
      if (!url) return null
      const dl = await fetch(url)
      if (!dl.ok) return null
      return Buffer.from(await dl.arrayBuffer())
    } catch (err) {
      console.error('[images/generate] DALL-E failed:', safeErrorMessage(err))
    }
  }

  return null
}

async function persistToStorage(image: Buffer, index: number): Promise<string | null> {
  try {
    const path = `ai-generated/${Date.now()}-${index}.png`
    const { error } = await adminClient.storage
      .from('Branding')
      .upload(path, image, { contentType: 'image/png', upsert: true })

    if (error) {
      console.error('[images/generate] Storage upload failed:', error.message)
      return null
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    return publicUrl
  } catch (err) {
    console.error('[images/generate] Storage upload failed:', safeErrorMessage(err))
    return null
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminApi()
    if (guard instanceof Response) return guard

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const style = typeof body.style === 'string' ? body.style : 'cinematic'
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

    if (!resolveXaiApiKey() && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'No AI image API keys configured' }, { status: 500 })
    }

    const fullPrompt = buildPrompt(prompt, style)
    const count = resolveCount(body.count)
    const model = resolveXaiImageModel()

    let rawImages: Array<Buffer | null>
    try {
      rawImages = await Promise.all(
        Array.from({ length: count }, () => generateOne(fullPrompt)),
      )
    } catch (err) {
      if (err instanceof XaiImageError && err.status === 404) {
        return NextResponse.json(
          {
            error: 'Image generation unavailable',
            code: 404,
            detail: `Model "${model}" not accessible. Set XAI_IMAGE_MODEL to a model your team has access to.`,
            images: [],
          },
          { status: 422 },
        )
      }
      throw err
    }

    const persistedUrls = await Promise.all(
      rawImages.map((image, i) => (image ? persistToStorage(image, i) : Promise.resolve(null))),
    )

    const images = persistedUrls.filter(Boolean) as string[]
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Image generation unavailable', code: 404, images: [] },
        { status: 422 },
      )
    }
    // `url` keeps the former singular /api/admin/image/generate contract.
    return NextResponse.json({ images, url: images[0] })
  } catch (err) {
    const message = safeErrorMessage(err)
    console.error('[images/generate] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
