export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

type Style = 'photorealistic' | 'cinematic' | 'dark editorial'

const STYLE_PREFIX: Record<Style, string> = {
  'photorealistic': 'Professional photorealistic photography,',
  'cinematic':      'Cinematic film still,',
  'dark editorial': 'Dark editorial photography,',
}

const BRAND_SUFFIX =
  ' Evolved Pros brand aesthetic, dark navy background #0A0F18, gold accent lighting #C9A84C, professional business environment, high contrast, sharp focus.'

interface GenerateBody {
  prompt?: unknown
  style?: unknown
}

interface XaiImageResponse {
  data?: { url?: string }[]
}

async function uploadToBranding(remoteUrl: string): Promise<string> {
  const res = await fetch(remoteUrl)
  if (!res.ok) throw new Error(`Failed to fetch generated image (${res.status})`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const path = `generated/${Date.now()}.png`

  const { error } = await adminClient.storage
    .from('Branding')
    .upload(path, buffer, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = adminClient.storage.from('Branding').getPublicUrl(path)
  return publicUrl
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: GenerateBody
  try { body = (await request.json()) as GenerateBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 422 })

  const styleRaw = typeof body.style === 'string' ? body.style.trim().toLowerCase() : ''
  const style: Style = (styleRaw in STYLE_PREFIX ? styleRaw : 'dark editorial') as Style

  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'XAI_API_KEY not configured' }, { status: 500 })
  }

  const brandPrefix = `${STYLE_PREFIX[style]}${BRAND_SUFFIX}`
  const fullPrompt = `${brandPrefix} ${prompt}`

  // Override-able via env so a model rename / access change doesn't
  // require a redeploy. Default keeps the original identifier.
  const model = process.env.XAI_IMAGE_MODEL?.trim() || 'grok-2-image'

  let xaiData: XaiImageResponse
  try {
    const xaiRes = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, prompt: fullPrompt, n: 1 }),
    })
    if (!xaiRes.ok) {
      const errText = await xaiRes.text().catch(() => '')
      console.error(`[image/generate] xAI ${xaiRes.status}:`, errText.slice(0, 400))
      // 404 specifically means the model id isn't accessible to this key.
      // Surface a structured 422 the client can show inline rather than a
      // generic 500/502 (the route already used 502 for everything).
      if (xaiRes.status === 404) {
        return NextResponse.json(
          { error: 'Image generation unavailable', code: 404, detail: `Model "${model}" not accessible. Set XAI_IMAGE_MODEL to a model your team has access to.` },
          { status: 422 },
        )
      }
      throw new Error(`xAI ${xaiRes.status}: ${errText.slice(0, 300)}`)
    }
    xaiData = (await xaiRes.json()) as XaiImageResponse
  } catch (err) {
    const message = err instanceof Error ? err.message : 'xAI request failed'
    console.error('[image/generate] xAI error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const remoteUrl = xaiData.data?.[0]?.url
  if (!remoteUrl) {
    return NextResponse.json({ error: 'xAI returned no image URL' }, { status: 502 })
  }

  let publicUrl: string
  try {
    publicUrl = await uploadToBranding(remoteUrl)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage upload failed'
    console.error('[image/generate] storage error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
