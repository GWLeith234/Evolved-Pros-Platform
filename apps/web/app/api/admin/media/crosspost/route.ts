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

  const title = typeof body.title === 'string' ? body.title : ''
  const articleBody = typeof body.body === 'string' ? body.body : ''
  const slug = typeof body.slug === 'string' ? body.slug : ''
  const pillar = typeof body.pillar === 'string' ? body.pillar : ''

  if (!title || !articleBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 422 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  const articleUrl = `https://platform.evolvedpros.com/media/${pillar}/${slug}`
  const context = `Article title: "${title}"\n\nArticle body:\n${articleBody.slice(0, 3000)}`

  try {
    const client = new Anthropic({ apiKey })

    const [linkedinRes, threadRes, emailRes] = await Promise.all([
      // LinkedIn
      client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are George Leith writing for LinkedIn. Direct, earned credibility, no corporate fluff. Sales professional audience.',
        messages: [{
          role: 'user',
          content: `Write a LinkedIn post based on this article. Hook first sentence (pattern interrupt). 3 bullet insights. CTA: "Read the full piece: ${articleUrl}". Max 1300 chars. Return ONLY the post text, no JSON.\n\n${context}`,
        }],
      }),
      // X thread
      client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are George Leith writing an X (Twitter) thread. Direct, punchy, sales professional audience.',
        messages: [{
          role: 'user',
          content: `Write a 5-tweet X thread based on this article.
Tweet 1: Hook (max 280 chars, end with a thread emoji)
Tweets 2-4: One insight each (max 280 chars each)
Tweet 5: Close + "${articleUrl}"

Return each tweet on its own line, prefixed with "1/" through "5/". No JSON.\n\n${context}`,
        }],
      }),
      // Email (returns JSON with subject + body)
      client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: 'You are George Leith writing an email teaser. Warm, direct, no hype. Sales professional audience. Always return valid JSON only.',
        messages: [{
          role: 'user',
          content: `Write an email newsletter teaser for this article.
Return JSON only with this exact format (no markdown fences):
{"subject": "compelling subject line under 50 chars", "body": "2 paragraphs: para 1 = problem/tension (2-3 sentences), para 2 = what they'll learn + CTA link text. 200-300 words total."}

${context}`,
        }],
      }),
    ])

    const extractText = (res: Anthropic.Messages.Message) => {
      const block = res.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined
      return block?.text ?? ''
    }

    const threadText = extractText(threadRes)
    const tweets = threadText
      .split(/\n/)
      .map(l => l.replace(/^\d+\/\s*/, '').trim())
      .filter(l => l.length > 0)

    // Parse email JSON (subject + body)
    const emailRaw = extractText(emailRes)
    let emailSubject = ''
    let emailBody = emailRaw
    try {
      const parsed = JSON.parse(emailRaw)
      if (parsed.subject) emailSubject = parsed.subject
      if (parsed.body) emailBody = parsed.body
    } catch {
      // If Claude didn't return valid JSON, use the raw text as body
    }

    return NextResponse.json({
      linkedin: extractText(linkedinRes),
      thread: tweets.length > 0 ? tweets : [threadText],
      email: emailBody,
      emailSubject,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[media/crosspost] Claude API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
