export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { generateWithVoice, parseJsonResponse } from '@/lib/ai/voice'

type PostKind = 'update' | 'question' | 'win' | 'poll'

interface WritePostBody {
  idea?: unknown
  type?: unknown
}

interface AIPost {
  content: string
  suggested_pillar: string
}

const VALID_PILLARS = new Set([
  'foundation', 'identity', 'mental', 'strategy', 'accountability', 'execution',
])

const VALID_KINDS: Set<PostKind> = new Set(['update', 'question', 'win', 'poll'])

function buildPrompt(kind: PostKind, idea: string): string {
  const jsonTail = `\n\nReturn ONLY the JSON object — no preamble, no explanation, no markdown fences.\nJSON shape: { "content": string, "suggested_pillar": "foundation" | "identity" | "mental" | "strategy" | "accountability" | "execution" }`

  switch (kind) {
    case 'update':
      return [
        `Write a 2-4 sentence community update post about: ${idea}`,
        `For business operators and professionals. Direct, field-tested,`,
        `no filler. One insight that makes someone stop scrolling.`,
      ].join('\n') + jsonTail

    case 'question':
      return [
        `Write a thought-provoking question post about: ${idea}`,
        `One punchy question that challenges conventional thinking +`,
        `1 sentence of context. For operators at all levels.`,
      ].join('\n') + jsonTail

    case 'win':
      return [
        `Write a win post about: ${idea}`,
        `Specific and real. What happened, what it took, why it matters.`,
        `Humble but confident. 3 sentences max.`,
      ].join('\n') + jsonTail

    case 'poll':
      return [
        `Write a poll question about: ${idea}`,
        `One clear question + 3-4 answer options on separate lines`,
        `starting with - reflecting real operator decisions.`,
      ].join('\n') + jsonTail
  }
}

export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: WritePostBody
  try { body = (await request.json()) as WritePostBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
  const type = typeof body.type === 'string' ? body.type : ''
  if (!idea) {
    return NextResponse.json({ error: 'idea is required' }, { status: 422 })
  }
  if (!VALID_KINDS.has(type as PostKind)) {
    return NextResponse.json({ error: `type must be one of update/question/win/poll` }, { status: 422 })
  }

  const prompt = buildPrompt(type as PostKind, idea)

  let raw: string
  try {
    // 600 tokens is plenty for a 2-4 sentence community post and keeps
    // latency low for the inline composer surface.
    raw = await generateWithVoice({ prompt, maxTokens: 600 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    console.error('[ai/write-post] generateWithVoice error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let parsed: AIPost
  try {
    parsed = parseJsonResponse<AIPost>(raw)
  } catch (err) {
    console.error('[ai/write-post] JSON parse failed:', err, '\nraw:', raw.slice(0, 400))
    return NextResponse.json(
      { error: 'AI returned non-JSON output. Try again.' },
      { status: 502 },
    )
  }

  const content = String(parsed.content ?? '').trim()
  if (!content) {
    return NextResponse.json({ error: 'AI returned empty content. Try again.' }, { status: 502 })
  }

  const suggestedPillar = VALID_PILLARS.has(String(parsed.suggested_pillar))
    ? String(parsed.suggested_pillar)
    : ''

  return NextResponse.json({ content, suggested_pillar: suggestedPillar })
}
