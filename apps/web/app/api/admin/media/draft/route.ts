export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
  const angle = typeof body.angle === 'string' ? body.angle.trim() : ''
  const researchBrief = typeof body.researchBrief === 'string' ? body.researchBrief.trim() : ''
  const pillar = typeof body.pillar === 'string' ? body.pillar.trim() : ''

  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 422 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are George Leith, founder of Evolved Pros — writing for sales professionals.

Voice guide:
- First-person practitioner voice. Direct. Earned credibility. No fluff.
- Sales professionals are busy — every sentence must earn its place.
- Structure: hook → problem → insight → action → close.
- ${pillar ? `Pillar context: ${pillar} — weave the EVOLVED framework naturally, never forced.` : ''}
- Target length: 800-1200 words.
- Use markdown formatting: ## headings, **bold** for emphasis, > blockquotes for key insights.`,
      messages: [
        {
          role: 'user',
          content: `Write an article on this topic: "${topic}"
${angle ? `\nAngle: ${angle}` : ''}
${researchBrief ? `\nResearch context:\n${researchBrief}` : ''}

Return a JSON object with this exact structure:
{
  "title": "Article title — compelling, under 70 chars",
  "body": "Full article in markdown",
  "slug": "url-friendly-slug",
  "metaDescription": "SEO meta description under 160 chars"
}

Return ONLY the JSON object, no markdown fences or extra text.`,
        },
      ],
    })

    const textBlock = response.content.find(
      (b: { type: string }) => b.type === 'text'
    ) as { type: 'text'; text: string } | undefined

    if (!textBlock?.text) {
      return NextResponse.json({ error: 'No draft generated' }, { status: 500 })
    }

    let draft: unknown
    try {
      const cleaned = textBlock.text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      draft = JSON.parse(cleaned)
    } catch {
      draft = {
        title: topic,
        body: textBlock.text,
        slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 60),
        metaDescription: topic.slice(0, 155),
      }
    }

    return NextResponse.json({ draft })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[media/draft] Claude API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
