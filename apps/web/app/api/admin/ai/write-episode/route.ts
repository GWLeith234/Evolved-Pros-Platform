export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { generateWithVoice, parseJsonResponse } from '@/lib/ai/voice'

interface WriteEpisodeBody {
  title?: unknown
  guest_name?: unknown
  guest_title?: unknown
  guest_company?: unknown
}

interface AIEpisode {
  description: string
  show_notes: string
  key_takeaways: string
  pillar: string
  image_prompt: string
}

const VALID_PILLARS = new Set([
  'foundation', 'identity', 'mental', 'strategy', 'accountability', 'execution',
])

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: WriteEpisodeBody
  try { body = (await request.json()) as WriteEpisodeBody } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const guestName = typeof body.guest_name === 'string' ? body.guest_name.trim() : ''
  const guestTitle = typeof body.guest_title === 'string' ? body.guest_title.trim() : ''
  const guestCompany = typeof body.guest_company === 'string' ? body.guest_company.trim() : ''

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })
  if (!guestName) return NextResponse.json({ error: 'guest_name is required' }, { status: 422 })

  const guestLine = `${guestName}${guestTitle ? `, ${guestTitle}` : ''}${guestCompany ? ` at ${guestCompany}` : ''}`

  const prompt = [
    `Write podcast copy for The Evolved Pros Podcast.`,
    `Episode: ${title}`,
    `Guest: ${guestLine}`,
    '',
    'Return ONLY JSON:',
    '{',
    '  "description": "2-3 sentences. What this conversation is really about. Lead with the insight not the bio.",',
    '  "show_notes": "5-6 key topics as bullet points starting with -",',
    '  "key_takeaways": "3 specific actionable takeaways operators can use this week",',
    '  "pillar": "most relevant: foundation/identity/mental/strategy/accountability/execution",',
    '  "image_prompt": "Grok image prompt for episode thumbnail. Professional portrait, dark background, gold accent lighting."',
    '}',
  ].join('\n')

  let raw: string
  try {
    raw = await generateWithVoice({ prompt, maxTokens: 2000 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    console.error('[ai/write-episode] generateWithVoice error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let episode: AIEpisode
  try {
    episode = parseJsonResponse<AIEpisode>(raw)
  } catch (err) {
    console.error('[ai/write-episode] JSON parse failed:', err, '\nraw:', raw.slice(0, 400))
    return NextResponse.json(
      { error: 'AI returned non-JSON output. Try again.', raw: raw.slice(0, 1000) },
      { status: 502 },
    )
  }

  const normalisedPillar = VALID_PILLARS.has(episode.pillar) ? episode.pillar : ''

  return NextResponse.json({
    episode: {
      description:   String(episode.description ?? '').trim(),
      show_notes:    String(episode.show_notes ?? '').trim(),
      key_takeaways: String(episode.key_takeaways ?? '').trim(),
      pillar:        normalisedPillar,
      image_prompt:  String(episode.image_prompt ?? '').trim(),
    },
  })
}
