export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import Anthropic from '@anthropic-ai/sdk'
import { getNextWeekSlots, OPTIMAL_SLOTS, PILLAR_NAMES } from '@/lib/schedulerTimes'

export async function POST() {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  if (!process.env.ADMIN_SCHEDULER_EMAIL) {
    return NextResponse.json({ error: 'ADMIN_SCHEDULER_EMAIL not set' }, { status: 500 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  // Get George's user ID
  const { data: george } = await adminClient
    .from('users')
    .select('id')
    .eq('email', process.env.ADMIN_SCHEDULER_EMAIL!)
    .single()
  if (!george) return NextResponse.json({ error: 'George user not found' }, { status: 500 })

  // Get last used pillar to avoid repeats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentPost } = await (adminClient as any)
    .from('posts')
    .select('body')
    .eq('ai_generated', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let pillarOffset = 0
  if (recentPost?.body) {
    const idx = PILLAR_NAMES.findIndex(p => recentPost.body.toLowerCase().includes(p.toLowerCase()))
    if (idx >= 0) pillarOffset = (idx + 1) % PILLAR_NAMES.length
  }

  const slots = getNextWeekSlots()
  const client = new Anthropic({ apiKey })

  // Get the general channel ID for posts
  const { data: channel } = await adminClient
    .from('channels')
    .select('id')
    .ilike('name', '%general%')
    .limit(1)
    .single()

  const channelId = channel?.id ?? null

  const posts: unknown[] = []

  for (let i = 0; i < 7; i++) {
    const pillarName = PILLAR_NAMES[(pillarOffset + i) % PILLAR_NAMES.length]
    const slot = OPTIMAL_SLOTS[i]

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: `You are George Leith, founder of Evolved Pros \u2014 a platform for high-performing sales professionals. Write in George's voice: direct, experienced, no fluff. Short punchy sentences. References real sales situations. Challenges conventional thinking. Never corporate-speak. Think: mentor talking to a rep who wants to get better.`,
        messages: [{
          role: 'user',
          content: `Write ONE community post (2-4 sentences) for the ${pillarName} pillar. Return only the post text, no hashtags, no emojis, no preamble.`,
        }],
      })

      const text = (response.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined)?.text ?? ''

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post, error } = await (adminClient as any)
        .from('posts')
        .insert({
          author_id: george.id,
          channel_id: channelId,
          body: text.trim(),
          status: 'scheduled',
          scheduled_at: slots[i].toISOString(),
          ai_generated: true,
          like_count: 0,
          reply_count: 0,
        })
        .select('id, body, status, scheduled_at')
        .single()

      if (error) {
        console.error(`[scheduler/generate] Insert failed for slot ${i}:`, error.message)
        continue
      }
      posts.push({ ...post, pillar: pillarName, slot: slot.label, tier: slot.tier })
    } catch (err) {
      console.error(`[scheduler/generate] AI call failed for slot ${i}:`, err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({ posts, count: posts.length })
}
