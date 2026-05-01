export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import OpenAI from 'openai'

async function generateOne(prompt: string): Promise<string | null> {
  // Try Grok Aurora first
  const xaiKey = process.env.XAI_API_KEY
  if (xaiKey) {
    try {
      const xai = new OpenAI({ apiKey: xaiKey, baseURL: 'https://api.x.ai/v1' })
      const res = await xai.images.generate({ model: 'grok-2-image', prompt, n: 1 })
      const url = res.data?.[0]?.url
      if (url) return url
    } catch (err) {
      console.error('[images/generate] Grok failed, trying DALL-E:', err instanceof Error ? err.message : err)
    }
  }

  // Fallback to DALL-E 3
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
      console.error('[images/generate] DALL-E failed:', err instanceof Error ? err.message : err)
    }
  }

  return null
}

async function persistToStorage(imageUrl: string, index: number): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const path = `ai-generated/${Date.now()}-${index}.png`

    const { error } = await adminClient.storage
      .from('Branding')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })

    if (error) {
      console.error('[images/generate] Storage upload failed:', error.message)
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
    const style = typeof body.style === 'string' ? body.style.trim() : 'cinematic'
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

    if (!process.env.XAI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'No AI image API keys configured' }, { status: 500 })
    }

    const fullPrompt = `${prompt} — ${style} style, professional quality, no text overlays`

    // Generate 3 images in parallel
    const rawUrls = await Promise.all([
      generateOne(fullPrompt),
      generateOne(fullPrompt),
      generateOne(fullPrompt),
    ])

    // Persist to Supabase Storage (generated URLs expire)
    const persistedUrls = await Promise.all(
      rawUrls.map((url, i) => url ? persistToStorage(url, i) : Promise.resolve(null))
    )

    const images = persistedUrls.filter(Boolean) as string[]
    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[images/generate] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
