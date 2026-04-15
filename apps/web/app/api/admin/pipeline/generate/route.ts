export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function extractText(res: Anthropic.Messages.Message): string {
  return (res.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined)?.text ?? ''
}

function parseJSON(text: string): unknown {
  try {
    return JSON.parse(text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim())
  } catch {
    return null
  }
}

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

  const transcript = typeof body.transcript === 'string' ? body.transcript : ''
  const title = typeof body.title === 'string' ? body.title : ''
  const pillar = typeof body.pillar === 'string' ? body.pillar : ''

  if (!transcript) return NextResponse.json({ error: 'transcript is required' }, { status: 422 })

  const client = new Anthropic({ apiKey })
  const ctx = `You are George Leith, founder of Evolved Pros. Generating content based on episode: "${title}" focused on the ${pillar} pillar.\n\nGeorge's voice: direct, no fluff, punchy sentences, real-world sales experience, challenges conventional thinking, mentor energy.\n\nTranscript excerpt:\n${transcript.slice(0, 3000)}`

  try {
    const [communityRes, articleRes, emailRes, socialRes] = await Promise.all([
      client.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 512, system: ctx,
        messages: [{ role: 'user', content: 'Write a community post (2-4 sentences) that captures the core insight from this episode. Write in first person as George. No hashtags, no emojis. Should make a sales professional stop scrolling. Return only the post text.' }],
      }),
      client.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 2048, system: ctx,
        messages: [{ role: 'user', content: 'Write a 700-900 word article based on this episode. Include a compelling headline, SEO meta description (150 chars max), URL slug, and full article body in markdown with 2-3 subheadings. Return as JSON: { title, slug, metaDescription, body }. Return ONLY the JSON.' }],
      }),
      client.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: ctx,
        messages: [{ role: 'user', content: 'Write an email to Evolved Pros members about this episode. Subject line (under 50 chars), preview text (under 90 chars), email body (200-300 words, personal tone, ends with CTA). Return as JSON: { subject, preview, body }. Return ONLY the JSON.' }],
      }),
      client.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: ctx,
        messages: [{ role: 'user', content: 'Write two social posts: 1) LinkedIn: 150-200 word post, insight + story + CTA. 2) X thread opener: punchy single tweet under 280 chars. Return as JSON: { linkedin, twitter }. Return ONLY the JSON.' }],
      }),
    ])

    const community = extractText(communityRes)
    const article = parseJSON(extractText(articleRes)) ?? { title, slug: '', metaDescription: '', body: extractText(articleRes) }
    const email = parseJSON(extractText(emailRes)) ?? { subject: title, preview: '', body: extractText(emailRes) }
    const social = parseJSON(extractText(socialRes)) ?? { linkedin: extractText(socialRes), twitter: '' }

    return NextResponse.json({ community, article, email, social })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[pipeline/generate] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
