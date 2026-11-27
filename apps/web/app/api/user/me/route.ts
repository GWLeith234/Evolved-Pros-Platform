export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { userMePatchUpdate } from '@/lib/onboarding/profilePatch'

const USER_COLUMNS =
  'id, email, display_name, full_name, avatar_url, bio, role_title, location, tier, tier_status, tier_expires_at, points, role, created_at, company, linkedin_url, website_url, twitter_handle, phone, phone_visible, current_pillar, goal_90day, goal_visible'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS-FIX: query public.users by email — auth.uid() doesn't always match
  // public.users.id, so .eq('id', user.id) returns null for many users.
  const { data, error } = await adminClient
    .from('users')
    .select(USER_COLUMNS)
    .eq('email', user.email)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = userMePatchUpdate(body)
  if (!parsed.ok) {
    const status =
      parsed.error === 'linkedin_url must be http(s)' || parsed.error === 'website_url must be http(s)'
        ? 422
        : 400
    return NextResponse.json({ error: parsed.error }, { status })
  }
  if (Object.keys(parsed.update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  // public.users.id is not auth.users.id. Match the session email.
  // A body email or id is never the filter and is not written.
  const { data, error } = await adminClient
    .from('users')
    .update(parsed.update)
    .eq('email', user.email)
    .select(USER_COLUMNS)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json(data)
}
