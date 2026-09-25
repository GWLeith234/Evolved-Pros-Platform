export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import {
  XaiImageError,
  requestXaiImages,
  resolveXaiApiKey,
  resolveXaiImageModel,
  safeErrorMessage,
} from '@/lib/art/xaiImages'

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

async function uploadBufferToBranding(buffer: Buffer): Promise<string> {
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

  if (!resolveXaiApiKey()) {
    return NextResponse.json({ error: 'XAI_API_KEY not configured' }, { status: 500 })
  }

  const brandPrefix = `${STYLE_PREFIX[style]}${BRAND_SUFFIX}`
  const fullPrompt = `${brandPrefix} ${prompt}`
  const model = resolveXaiImageModel()

  let image: Buffer
  try {
    const images = await requestXaiImages({ prompt: fullPrompt, n: 1 })
    const first = images[0]
    if (!first) throw new XaiImageError('xAI returned no image data', 502)
    image = first
  } catch (err) {
    const message = safeErrorMessage(err)
    console.error('[image/generate] xAI error:', message)
    if (err instanceof XaiImageError && err.status === 404) {
      return NextResponse.json(
        { error: 'Image generation unavailable', code: 404, detail: `Model "${model}" not accessible. Set XAI_IMAGE_MODEL to a model your team has access to.` },
        { status: 422 },
      )
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }

  let publicUrl: string
  try {
    publicUrl = await uploadBufferToBranding(image)
  } catch (err) {
    const message = safeErrorMessage(err)
    console.error('[image/generate] storage error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
