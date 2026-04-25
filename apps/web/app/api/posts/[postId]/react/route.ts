export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const VALID_KINDS = ['fire', 'hundred', 'clap', 'heart', 'mind'] as const
type ReactionKind = typeof VALID_KINDS[number]

async function resolveUserId(email: string): Promise<string | null> {
  const { data } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id ?? null
}

async function readReactionCount(postId: string): Promise<number> {
  const { data } = await adminClient
    .from('posts')
    .select('reaction_count')
    .eq('id', postId)
    .single() as { data: { reaction_count: number } | null }
  return data?.reaction_count ?? 0
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let kind: ReactionKind
  try {
    const body = await request.json() as { kind?: string }
    if (!body.kind || !VALID_KINDS.includes(body.kind as ReactionKind)) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }
    kind = body.kind as ReactionKind
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
      { user_id: userId, post_id: params.postId, reaction_type: kind } as never,
      { onConflict: 'user_id,post_id' } as never,
    )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const reaction_count = await readReactionCount(params.postId)
  return NextResponse.json({ ok: true, reaction_count })
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

  const reaction_count = await readReactionCount(params.postId)
  return NextResponse.json({ ok: true, reaction_count })
}
