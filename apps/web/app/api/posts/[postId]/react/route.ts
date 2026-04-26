export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Brief naming (UI-facing) → DB CHECK-constraint values from Sprint 0 migration.
// Sprint 0 locked DB values to ('fire','hundred','clap','heart','mind') —
// COMMUNITY-SPRINT-2 brief renamed clap→hands and mind→mindblown for the UI.
// Translate at the API boundary so the DB stays consistent.
const EMOJI_TO_DB: Record<string, string> = {
  fire:      'fire',
  hundred:   'hundred',
  hands:     'clap',
  heart:     'heart',
  mindblown: 'mind',
  // Backward-compat: also accept DB names directly.
  clap:      'clap',
  mind:      'mind',
}

const DB_TO_EMOJI: Record<string, string> = {
  fire:    'fire',
  hundred: 'hundred',
  clap:    'hands',
  heart:   'heart',
  mind:    'mindblown',
}

const EMPTY_COUNTS = { fire: 0, hundred: 0, hands: 0, heart: 0, mindblown: 0 }

async function resolveUserId(email: string): Promise<string | null> {
  const { data } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id ?? null
}

async function readCounts(postId: string): Promise<typeof EMPTY_COUNTS> {
  const { data } = await adminClient
    .from('post_reactions')
    .select('reaction_type')
    .eq('post_id', postId) as { data: { reaction_type: string }[] | null }

  const counts = { ...EMPTY_COUNTS }
  for (const row of data ?? []) {
    const ui = DB_TO_EMOJI[row.reaction_type]
    if (ui && ui in counts) {
      counts[ui as keyof typeof EMPTY_COUNTS] += 1
    }
  }
  return counts
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let dbValue: string
  try {
    const body = await request.json() as { emoji?: string; kind?: string }
    const raw = body.emoji ?? body.kind
    if (!raw || !(raw in EMOJI_TO_DB)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }
    dbValue = EMOJI_TO_DB[raw]
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const userId = await resolveUserId(user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Composite PK (user_id, post_id) — upsert flips reaction type for the
  // same user without creating duplicates.
  const { error } = await adminClient
    .from('post_reactions')
    .upsert(
      { user_id: userId, post_id: params.postId, reaction_type: dbValue } as never,
      { onConflict: 'user_id,post_id' } as never,
    )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts = await readCounts(params.postId)
  return NextResponse.json({ ok: true, counts })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(user.email)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await adminClient
    .from('post_reactions')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', params.postId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts = await readCounts(params.postId)
  return NextResponse.json({ ok: true, counts })
}
