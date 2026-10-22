export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { generateWithVoice, parseJsonResponse } from '@/lib/ai/voice'
import { scrapeSponsorPage, type SponsorPageMeta } from '@/lib/sponsors/extractPage'

interface ExtractBody { url?: unknown }

interface AIPayload {
  tagline: string
  body_copy: string
  cta_text: string
}

const AI_SYSTEM_SUFFIX = `You are writing a sponsor card for the Evolved Pros platform — a curated platform for sales pros. Generate a 6-8 word serif tagline, 20-30 word body line ('Why pros use it'), and 4-word CTA. Output JSON: {tagline, body_copy, cta_text}`

async function generateCopy(meta: SponsorPageMeta): Promise<AIPayload | null> {
  const prompt = [
    `Brand: ${meta.siteName ?? meta.title ?? meta.url}`,
    meta.title       ? `Page title: ${meta.title}`             : '',
    meta.description ? `Meta description: ${meta.description}` : '',
    `URL: ${meta.url}`,
    '',
    'Return ONLY a JSON object with these keys: tagline, body_copy, cta_text.',
    'No preamble, no fences, no explanation.',
  ].filter(Boolean).join('\n')

  try {
    const raw = await generateWithVoice({
      prompt,
      systemSuffix: AI_SYSTEM_SUFFIX,
      maxTokens: 600,
    })
    const parsed = parseJsonResponse<Partial<AIPayload>>(raw)
    return {
      tagline:   String(parsed.tagline   ?? '').trim().slice(0, 200) || '',
      body_copy: String(parsed.body_copy ?? '').trim().slice(0, 1000) || '',
      cta_text:  String(parsed.cta_text  ?? '').trim().slice(0, 64) || '',
    }
  } catch (err) {
    console.error('[partners/extract] AI copy failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: ExtractBody
  try { body = (await request.json()) as ExtractBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 422 })

  const meta = await scrapeSponsorPage(url)
  if (!meta) {
    return NextResponse.json(
      { error: 'Could not fetch the URL. Check it loads in a browser.' },
      { status: 422 },
    )
  }

  // AI copy is best-effort; field extraction stands alone if Anthropic's down.
  const copy = await generateCopy(meta)

  return NextResponse.json({
    brand_name:  meta.siteName ?? meta.title ?? '',
    brand_color: meta.themeColor ?? '',
    logo_url:    meta.image ?? '',
    tagline:   copy?.tagline   ?? '',
    body_copy: copy?.body_copy ?? meta.description ?? '',
    cta_text:  copy?.cta_text  ?? 'Learn more',
  })
}
