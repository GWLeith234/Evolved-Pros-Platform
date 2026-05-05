export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { generateWithVoice, parseJsonResponse } from '@/lib/ai/voice'

interface WriteStoryBody {
  topic?: unknown
  pillar?: unknown
  keywords?: unknown
}

interface AIStory {
  title: string
  excerpt: string
  body: string
  pillar: string
  read_time: number
  image_prompt: string
}

const VALID_PILLARS = new Set([
  'foundation', 'identity', 'mental', 'strategy', 'accountability', 'execution',
])

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: WriteStoryBody
  try { body = (await request.json()) as WriteStoryBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  const pillar = typeof body.pillar === 'string' ? body.pillar.trim() : ''
  const keywords = Array.isArray(body.keywords)
    ? (body.keywords.filter(k => typeof k === 'string') as string[])
    : []

  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 422 })

  const prompt = [
    `Write a complete Evolved Media article about: ${topic}`,
    pillar ? `Pillar focus: ${pillar}` : '',
    keywords.length ? `Key themes: ${keywords.join(', ')}` : '',
    '',
    'Return ONLY a JSON object with these exact fields:',
    '{',
    '  "title": "compelling headline max 12 words",',
    '  "excerpt": "2-sentence hook for the article card max 40 words",',
    '  "body": "full article in markdown",',
    '  "pillar": "one of: foundation/identity/mental/strategy/accountability/execution",',
    '  "read_time": estimated minutes as integer,',
    '  "image_prompt": "detailed Grok image generation prompt matching the article theme. Dark editorial style, Evolved Pros brand, navy background."',
    '}',
    '',
    'Return ONLY the JSON — no preamble, no explanation.',
  ].filter(Boolean).join('\n')

  let raw: string
  try {
    raw = await generateWithVoice({ prompt, maxTokens: 4096 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    console.error('[ai/write-story] generateWithVoice error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let story: AIStory
  try {
    story = parseJsonResponse<AIStory>(raw)
  } catch (err) {
    console.error('[ai/write-story] JSON parse failed:', err, '\nraw:', raw.slice(0, 400))
    return NextResponse.json(
      { error: 'AI returned non-JSON output. Try again.', raw: raw.slice(0, 1000) },
      { status: 502 },
    )
  }

  // Defensive normalisation — never trust the model's pillar without a
  // fallback into the canonical set the form / DB expect.
  const normalisedPillar = VALID_PILLARS.has(story.pillar) ? story.pillar : (pillar || '')
  const readTime = Number.isFinite(story.read_time)
    ? Math.max(1, Math.round(story.read_time))
    : Math.max(1, Math.round((story.body?.split(/\s+/).length ?? 0) / 220))

  return NextResponse.json({
    story: {
      title:        String(story.title ?? '').trim(),
      excerpt:      String(story.excerpt ?? '').trim(),
      body:         String(story.body ?? ''),
      pillar:       normalisedPillar,
      read_time:    readTime,
      image_prompt: String(story.image_prompt ?? '').trim(),
    },
  })
}
