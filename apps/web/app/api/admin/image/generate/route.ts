export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

const BRAND_PREFIX =
  'Professional dark editorial photography, Evolved Pros brand, dark navy background, gold accents, sales leadership theme. '

const STYLE_SUFFIX: Record<string, string> = {
  Photorealistic: ' Photorealistic, sharp detail, natural lighting.',
  Cinematic: ' Cinematic composition, dramatic lighting, shallow depth of field.',
  'Dark editorial': ' Dark editorial mood, moody contrast, magazine-grade composition.',
}

async function generateOnce(prompt: string): Promise<string | null> {
  const xaiKey = process.env.XAI_API_KEY
  if (xaiKey) {
    try {
      const xai = new OpenAI({ apiKey: xaiKey, baseURL: 'https://api.x.ai/v1' })
      const res = await xai.images.generate({ model: 'grok-2-image', prompt, n: 1 })
      const url = res.data?.[0]?.url
      if (url) return url
    } catch (err) {
      console.error('[image/generate] Grok failed:', err instanceof Error ? err.message : err)
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
      if (url) return url
    } catch (err) {
      console.error('[image/generate] DALL-E fallback failed:', err instanceof Error ? err.message : err)
    }
  }

  return null
}

async function persistToBranding(remoteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(remoteUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const path = `ai-generated/${Date.now()}.png`

    const { error } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })

    if (error) {
      console.error('[image/generate] Storage upload failed:', error.message)
      return null
    }

    const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
    return publicUrl
  } catch {
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
    const styleRaw = typeof body.style === 'string' ? body.style.trim() : ''
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

    if (!process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'No AI image API keys configured' }, { status: 500 })
    }

    const styleSuffix = STYLE_SUFFIX[styleRaw] ?? ''
    const fullPrompt = `${BRAND_PREFIX}${prompt}${styleSuffix}`

    const remoteUrl = await generateOnce(fullPrompt)
    if (!remoteUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 502 })
    }

    const persisted = await persistToBranding(remoteUrl)
    if (!persisted) {
      return NextResponse.json({ error: 'Failed to persist generated image' }, { status: 500 })
    }

    return NextResponse.json({ url: persisted })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[image/generate] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
