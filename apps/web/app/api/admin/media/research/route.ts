export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
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
      system: `You are a research assistant for Evolved Pros, a sales professional development platform. George Leith is the founder — direct, experienced, practitioner-first voice. Research topics thoroughly and return structured, actionable insights for a sales professional audience.`,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [
        {
          role: 'user',
          content: `Research this topic for a sales professional audience: "${topic}"

Return a JSON object with this exact structure:
{
  "summary": "2-3 paragraph research summary with key findings",
  "stats": ["stat 1 with source", "stat 2 with source", "stat 3 with source"],
  "angles": [
    { "title": "Article angle 1", "hook": "Opening hook sentence", "wordCount": 1000 },
    { "title": "Article angle 2", "hook": "Opening hook sentence", "wordCount": 800 },
    { "title": "Article angle 3", "hook": "Opening hook sentence", "wordCount": 1200 }
  ]
}

Return ONLY the JSON object, no markdown fences or extra text.`,
        },
      ],
    })

    // Extract text content from response
    const textBlock = response.content.find(
      (b: { type: string }) => b.type === 'text'
    ) as { type: 'text'; text: string } | undefined

    if (!textBlock?.text) {
      return NextResponse.json({ error: 'No research generated' }, { status: 500 })
    }

    // Try to parse the JSON from the response
    let research: unknown
    try {
      // Strip any markdown code fences if present
      const cleaned = textBlock.text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      research = JSON.parse(cleaned)
    } catch {
      // If JSON parsing fails, return raw text as summary
      research = {
        summary: textBlock.text,
        stats: [],
        angles: [{ title: topic, hook: 'Based on research...', wordCount: 1000 }],
      }
    }

    return NextResponse.json({ research })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[media/research] Claude API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
