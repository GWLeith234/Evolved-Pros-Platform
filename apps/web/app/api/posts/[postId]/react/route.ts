export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

// Brief naming (UI-facing) → DB CHECK-constraint values from Sprint 0 migration.
const EMOJI_TO_DB: Record<string, string> = {
  fire:      'fire',
  hundred:   'hundred',
  hands:     'clap',
  heart:     'heart',
  mindblown: 'mind',
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

function countsFromJson(reactions: Record<string, number> | null | undefined) {
  const counts = { ...EMPTY_COUNTS }
  for (const [dbType, n] of Object.entries(reactions ?? {})) {
    const ui = DB_TO_EMOJI[dbType]
    if (ui && ui in counts) counts[ui as keyof typeof EMPTY_COUNTS] = Number(n) || 0
  }
  return counts
}

type ToggleRow = {
  action: string
  my_reaction: string | null
  reaction_count: number
  reactions: Record<string, number>
  post_author_id: string
  points_awarded: boolean
}

async function callToggle(
  userId: string,
  postId: string,
  reactionType: string | null,
  mode: 'set' | 'toggle' | 'remove',
): Promise<{ row: ToggleRow | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any).rpc('toggle_post_reaction', {
    p_user_id: userId,
    p_post_id: postId,
    p_reaction_type: reactionType ?? 'heart',
    p_mode: mode,
  })
  if (error) return { row: null, error: error.message }
  const row = Array.isArray(data) ? data[0] : data
  return { row: row as ToggleRow, error: null }
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { row, error } = await callToggle(profile.id, params.postId, dbValue, 'set')
  if (error || !row) {
    return NextResponse.json({ error: error ?? 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, counts: countsFromJson(row.reactions) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { row, error } = await callToggle(profile.id, params.postId, 'heart', 'remove')
  if (error || !row) {
    return NextResponse.json({ error: error ?? 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, counts: countsFromJson(row.reactions) })
}
