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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const postBody = typeof body.postBody === 'string' ? body.postBody : ''
  const authorName = typeof body.authorName === 'string' ? body.authorName : 'Member'
  const pillarTag = typeof body.pillarTag === 'string' ? body.pillarTag : 'community'

  if (!postBody) return NextResponse.json({ error: 'postBody required' }, { status: 422 })

  try {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `You generate reply suggestions for George Leith, founder of Evolved Pros. George replies in a direct, warm, mentor style. Short replies (1-3 sentences). Never corporate. Never generic. Each reply should feel personal and specific to what the member said.

Generate 3 distinct reply options:
Option 1: Validating + specific to what they said
Option 2: Challenge or push-forward energy
Option 3: Short, punchy, personal

Return as JSON: { "replies": ["...", "...", "..."] }. Return ONLY the JSON.`,
      messages: [{
        role: 'user',
        content: `Community member ${authorName} posted in the ${pillarTag}:\n"${postBody}"\n\nGenerate 3 reply options for George.`,
      }],
    })

    const text = (res.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined)?.text ?? ''
    let parsed: { replies: string[] }
    try {
      parsed = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      parsed = { replies: [text] }
    }

    return NextResponse.json({ replies: parsed.replies ?? [text] })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[suggest-reply] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
