import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const userId = profile.id
  const habitId = params.id
  if (!habitId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json() as {
    name?: string
    pillar?: string
    description?: string
    frequency?: string
    time_of_day?: string
    is_active?: boolean
  }

  // Build update payload — only include columns that exist in habit_stacks.
  // pillar, description, is_active are optional extended columns; skip if they
  // cause a Postgres column error (table may not have them yet).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = String(body.name).trim()
  // Accept 'frequency' from modal (daily/weekdays) mapped to time_of_day
  if (body.time_of_day !== undefined) updates.time_of_day = body.time_of_day
  if (body.frequency !== undefined)   updates.time_of_day = body.frequency === 'weekdays' ? 'PM' : 'AM'

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('habit_stacks')
    .update(updates)
    .eq('id', habitId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: data })
}
