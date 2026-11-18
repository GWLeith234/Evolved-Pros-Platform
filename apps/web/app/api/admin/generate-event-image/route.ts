export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { logProviderError } from '@/lib/http/clientError'
import {
  XAI_IMAGE_QUALITY_DRAFT,
  isXaiModelRefusal,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
  xaiModelRefusalMessage,
} from '@/lib/art/xaiImages'

async function generateEventImagePrompt(title: string, mood: string): Promise<string> {
  const fallback = `Professional event banner for "${title}". ${mood} atmosphere, dark navy and gold color palette, cinematic lighting, modern business photography style, 16:9 aspect ratio, no text overlays.`
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallback

  const systemPrompt = `You are a brand designer for Evolved Pros, an elite professional development community.
The brand uses deep navy (#112535), gold (#C9A84C), red (#ef0e30), and white.
Create image prompts that are cinematic, premium, and aspirational — never stock-photo generic.
Always produce prompts that result in dark, moody, high-contrast images suitable for event banners.
Never include text, logos, or watermarks in the prompt.
Return ONLY the image prompt, nothing else.`

  const userPrompt = `Event: "${title}"
Mood: ${mood}
Generate a prompt for a 16:9 cinematic event banner image. Keep it under 400 characters.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) return fallback
    const data = await res.json()
    const text = data.content?.[0]?.text?.trim()
    return text || fallback
  } catch (err) {
    console.error('[generate-event-image] prompt writer failed:', safeErrorMessage(err))
    return fallback
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const mood = typeof body.mood === 'string' ? body.mood : 'Professional'

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  if (!resolveXaiApiKey()) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured on the server' },
      { status: 500 },
    )
  }

  const model = resolveXaiImageModel()

  try {
    const prompt = await generateEventImagePrompt(title, mood)
    const buffers = await requestXaiImages({
      prompt,
      n: 3,
      aspectRatio: '16:9',
      quality: XAI_IMAGE_QUALITY_DRAFT,
    })

    const images: string[] = []
    for (let i = 0; i < buffers.length; i++) {
      const image = buffers[i]
      if (!image) continue
      const path = `ai-generated/event-${Date.now()}-${i}.png`
      const { error } = await adminClient.storage
        .from('Branding')
        .upload(path, image, { contentType: 'image/png', upsert: true })
      if (error) {
        logProviderError('[generate-event-image] storage upload failed', error)
        continue
      }
      const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
      images.push(publicUrl)
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Upload failed.', images: [], prompt },
        { status: 500 },
      )
    }

    return NextResponse.json({ images, prompt })
  } catch (err) {
    const message = safeErrorMessage(err)
    console.error('[generate-event-image] xAI error:', message)
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
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
