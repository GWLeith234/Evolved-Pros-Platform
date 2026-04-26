import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// RLS-FIX helper: resolve public.users.id by email (auth.uid() ≠ public.users.id).
async function resolveUserId(email: string): Promise<string | null> {
  const { data } = await adminClient
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  return data?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (await resolveUserId(user.email)) ?? user.id

  const { data } = await adminClient
    .from('lesson_progress')
    .select('notes, updated_at')
    .eq('user_id', userId)
    .eq('lesson_id', params.lessonId)
    .single()

  return NextResponse.json({ notes: data?.notes ?? '', updatedAt: data?.updated_at ?? null })
}

export async function PATCH(
  req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { notes?: string }
  const notes = body.notes ?? ''

  if (typeof notes !== 'string') {
    return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
  }
  if (notes.length > 10000) {
    return NextResponse.json({ error: 'Notes too long (max 10,000 chars)' }, { status: 400 })
  }

  const userId = (await resolveUserId(user.email)) ?? user.id

  const { data, error } = await adminClient
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: params.lessonId,
      notes,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'user_id,lesson_id' })
    .select('notes, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })

  return NextResponse.json({ notes: data.notes ?? '', updatedAt: data.updated_at })
}
