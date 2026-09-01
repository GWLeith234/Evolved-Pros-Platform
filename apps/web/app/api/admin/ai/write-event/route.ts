export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { generateWithVoice, parseJsonResponse } from '@/lib/ai/voice'

interface WriteEventBody {
  title?: unknown
  format?: unknown
  date?: unknown
}

interface AIEvent {
  description: string
  tagline: string
  cta_text: string
  pillar: string
  image_prompt: string
}

const VALID_PILLARS = new Set([
  'foundation', 'identity', 'mental', 'strategy', 'accountability', 'execution',
])

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: WriteEventBody
  try { body = (await request.json()) as WriteEventBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const format = typeof body.format === 'string' ? body.format.trim() : ''
  const date = typeof body.date === 'string' ? body.date.trim() : ''

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  const prompt = [
    `Write event copy for an Evolved Pros event.`,
    `Title: ${title}`,
    `Format: ${format || 'keynote/workshop'}`,
    date ? `Date: ${date}` : '',
    '',
    'Audience: business operators, sales and go-to-market leaders, founders, and revenue professionals across all functions.',
    '',
    'Return ONLY JSON:',
    '{',
    '  "description": "2-3 punchy sentences. Why this event, why now, why attend.",',
    '  "tagline": "one-line hook max 10 words. A reason to show up.",',
    '  "cta_text": "RSVP button text max 4 words",',
    '  "pillar": "most relevant: foundation/identity/mental/strategy/accountability/execution",',
    '  "image_prompt": "Grok image prompt for event hero. Dark editorial, stage lighting, professional energy, navy background."',
    '}',
  ].filter(Boolean).join('\n')

  let raw: string
  try {
    raw = await generateWithVoice({ prompt, maxTokens: 1500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    console.error('[ai/write-event] generateWithVoice error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let event: AIEvent
  try {
    event = parseJsonResponse<AIEvent>(raw)
  } catch (err) {
    console.error('[ai/write-event] JSON parse failed:', err, '\nraw:', raw.slice(0, 400))
    return NextResponse.json(
      { error: 'AI returned non-JSON output. Try again.', raw: raw.slice(0, 1000) },
      { status: 502 },
    )
  }

  const normalisedPillar = VALID_PILLARS.has(event.pillar) ? event.pillar : ''

  return NextResponse.json({
    event: {
      description:  String(event.description ?? '').trim(),
      tagline:      String(event.tagline ?? '').trim(),
      cta_text:     String(event.cta_text ?? '').trim(),
      pillar:       normalisedPillar,
      image_prompt: String(event.image_prompt ?? '').trim(),
    },
  })
}
