export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import OpenAI from 'openai'
import {
  requestXaiImages,
  resolveXaiApiKey,
  safeErrorMessage,
} from '@/lib/art/xaiImages'

async function generateOne(prompt: string): Promise<Buffer | null> {
  // Grok first. Model id is env-overrideable so a rename or access change
  // can be patched without a code deploy. Default is grok-imagine-image-quality.
  if (resolveXaiApiKey()) {
    try {
      const images = await requestXaiImages({ prompt, n: 1 })
      if (images[0]) return images[0]
    } catch (err) {
      console.error('[images/generate] Grok failed, trying DALL-E:', safeErrorMessage(err))
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
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const style = typeof body.style === 'string' ? body.style.trim() : 'cinematic'
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

    if (!resolveXaiApiKey() && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'No AI image API keys configured' }, { status: 500 })
    }

    const fullPrompt = `${prompt}. ${style} style, professional quality, no text overlays`

    const rawImages = await Promise.all([
      generateOne(fullPrompt),
      generateOne(fullPrompt),
      generateOne(fullPrompt),
    ])

    const persistedUrls = await Promise.all(
      rawImages.map((image, i) => image ? persistToStorage(image, i) : Promise.resolve(null))
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
