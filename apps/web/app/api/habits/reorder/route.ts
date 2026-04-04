import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
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
  const body = await req.json() as { order: string[] }

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json({ error: 'order array required' }, { status: 400 })
  }

  // Update sort_order for each habit in the new order
  // Run updates in parallel — each sets sort_order = index
  const updates = body.order.map((id, index) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('habit_stacks')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('user_id', userId)
  )

  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
