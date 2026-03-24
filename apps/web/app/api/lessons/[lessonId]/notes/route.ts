import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('lesson_progress')
    .select('notes, updated_at')
    .eq('user_id', user.id)
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { notes?: string }
  const notes = body.notes ?? ''

  if (typeof notes !== 'string') {
    return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
  }
  if (notes.length > 10000) {
    return NextResponse.json({ error: 'Notes too long (max 10,000 chars)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: params.lessonId,
      notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    .select('notes, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })

  return NextResponse.json({ notes: data.notes ?? '', updatedAt: data.updated_at })
}
