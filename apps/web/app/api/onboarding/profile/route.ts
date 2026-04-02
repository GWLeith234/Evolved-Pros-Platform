import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = ['avatar_url', 'display_name', 'company', 'bio', 'location', 'role_title', 'focus_pillar'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>

  // Only pick allowed fields — ignore anything else
  const update: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in body && body[field] !== undefined) {
      update[field] = body[field]
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true })
  }

  // Use adminClient to bypass RLS on the users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('users')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
