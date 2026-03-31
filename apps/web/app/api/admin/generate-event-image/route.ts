export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { userId: user.id }
}

async function generateDallePrompt(title: string, mood: string): Promise<string> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    // Fallback prompt if no Anthropic key
    return `Professional event banner for "${title}". ${mood} atmosphere, dark navy and gold color palette, cinematic lighting, modern business photography style, 16:9 aspect ratio, no text overlays.`
  }

  const systemPrompt = `You are a brand designer for Evolved Pros, an elite professional development community.
The brand uses deep navy (#112535), gold (#C9A84C), red (#ef0e30), and white.
Create DALL-E 3 image prompts that are cinematic, premium, and aspirational — never stock-photo generic.
Always produce prompts that result in dark, moody, high-contrast images suitable for event banners.
Never include text, logos, or watermarks in the prompt.
Return ONLY the image prompt, nothing else.`

  const userPrompt = `Event: "${title}"
Mood: ${mood}
Generate a DALL-E 3 prompt for a 16:9 cinematic event banner image. Keep it under 400 characters.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    // Fall back to a basic prompt
    return `${mood} event banner for "${title}", cinematic dark photography, navy and gold tones, professional atmosphere, no text.`
  }

  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? `${mood} event banner for "${title}", cinematic dark photography.`
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const mood = typeof body.mood === 'string' ? body.mood : 'Professional'

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Image generation is not configured (OPENAI_API_KEY missing)' }, { status: 503 })
  }

  try {
    // Step 1: Generate DALL-E prompt via Anthropic
    const dallePrompt = await generateDallePrompt(title, mood)

    // Step 2: 3 parallel DALL-E 3 calls
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

    const results = await Promise.allSettled([
      openai.images.generate({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: '1792x1024', quality: 'standard' }),
      openai.images.generate({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: '1792x1024', quality: 'standard' }),
      openai.images.generate({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: '1792x1024', quality: 'standard' }),
    ])

    const images: string[] = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof openai.images.generate>>> => r.status === 'fulfilled')
      .map(r => r.value.data?.[0]?.url ?? '')
      .filter(Boolean)

    if (images.length === 0) {
      return NextResponse.json({ error: 'Image generation failed — no results returned' }, { status: 500 })
    }

    return NextResponse.json({ images, prompt: dallePrompt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Image generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
