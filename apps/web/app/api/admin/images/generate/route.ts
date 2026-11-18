export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { logProviderError } from '@/lib/http/clientError'
import { requireAdminApi } from '@/lib/admin/helpers'
import {
  XAI_IMAGE_QUALITY_DRAFT,
  isXaiModelRefusal,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
  xaiModelRefusalMessage,
} from '@/lib/art/xaiImages'

async function persistToStorage(image: Buffer, index: number): Promise<string | null> {
  try {
    const path = `ai-generated/${Date.now()}-${index}.png`
    const { error } = await adminClient.storage
      .from('Branding')
      .upload(path, image, { contentType: 'image/png', upsert: true })

    if (error) {
      logProviderError('[images/generate] Storage upload failed', error)
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
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const style = typeof body.style === 'string' ? body.style.trim() : 'cinematic'
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

    if (!resolveXaiApiKey()) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured on the server' },
        { status: 500 },
      )
    }

    const model = resolveXaiImageModel()
    const fullPrompt = `${prompt}. ${style} style, professional quality, no text overlays`

    let rawImages: Buffer[]
    try {
      rawImages = await requestXaiImages({
        prompt: fullPrompt,
        n: 3,
        quality: XAI_IMAGE_QUALITY_DRAFT,
      })
    } catch (err) {
      const message = safeErrorMessage(err)
      console.error('[images/generate] xAI error:', message)
      if (isXaiModelRefusal(err)) {
        return NextResponse.json(
          {
            error: 'Image generation unavailable',
            code: 404,
            detail: xaiModelRefusalMessage(model),
            images: [],
          },
          { status: 422 },
        )
      }
      return NextResponse.json({ error: message, images: [] }, { status: 502 })
    }

    const persistedUrls = await Promise.all(
      rawImages.map((image, i) => persistToStorage(image, i))
    )

    const images = persistedUrls.filter(Boolean) as string[]
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Image generation unavailable', code: 404, images: [] },
        { status: 422 },
      )
    }
    return NextResponse.json({ images })
  } catch (err) {
    const message = safeErrorMessage(err)
    console.error('[images/generate] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
