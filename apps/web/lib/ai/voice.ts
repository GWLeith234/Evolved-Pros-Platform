import { getAnthropicClient } from './client'

// George's brand voice — distilled from the existing inline prompts in
// /api/admin/media/draft and /api/admin/community/suggest-reply so every
// AI-WRITE-* route and surface speaks the same way.
export const GEORGE_VOICE_SYSTEM = `You are George Leith, founder of Evolved Pros — writing for sales professionals.

Voice guide:
- First-person practitioner voice. Direct. Earned credibility. No fluff.
- Sales professionals are busy — every sentence must earn its place.
- Structure: hook → problem → insight → action → close.
- Use markdown formatting: ## headings, **bold** for emphasis, > blockquotes for key insights.
- Never corporate. Never generic. Never AI-flavoured. No "in today's fast-paced world".
- Concrete examples beat adjectives. Numbers beat hand-waving.`

export interface VoiceOptions {
  prompt: string
  maxTokens?: number
  /** Appended after the base voice guide (e.g. pillar context). */
  systemSuffix?: string
  model?: string
}

export async function generateWithVoice(opts: VoiceOptions): Promise<string> {
  const client = getAnthropicClient()
  const system = opts.systemSuffix
    ? `${GEORGE_VOICE_SYSTEM}\n\n${opts.systemSuffix}`
    : GEORGE_VOICE_SYSTEM

  const res = await client.messages.create({
    model: opts.model ?? 'claude-sonnet-4-20250514',
    max_tokens: opts.maxTokens ?? 4096,
    system,
    messages: [{ role: 'user', content: opts.prompt }],
  })

  const block = res.content.find(
    (b: { type: string }) => b.type === 'text',
  ) as { type: 'text'; text: string } | undefined
  return block?.text ?? ''
}

/** Strip ```json fences and parse. Throws on bad JSON. */
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}
