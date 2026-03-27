export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // Verify the caller is an admin
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, fullName, tier } = await request.json() as {
    email: string
    fullName: string
    tier: 'community' | 'pro'
  }

  if (!email || !fullName || !tier) {
    return Response.json({ error: 'email, fullName, and tier are required' }, { status: 400 })
  }

  // Check if user already exists
  const { data: existing } = await adminClient
    .from('users')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'A member with this email already exists.' }, { status: 409 })
  }

  // Send invite via Supabase Auth — generates a signup link, no password needed
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email.toLowerCase().trim(),
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboard`,
      data: { full_name: fullName },
    }
  )

  if (inviteError) {
    return Response.json({ error: inviteError.message }, { status: 500 })
  }

  // Upsert the user row with tier
  const tierExpiresAt = new Date()
  tierExpiresAt.setMonth(tierExpiresAt.getMonth() + 1)

  await adminClient.from('users').upsert({
    id:              invited.user.id,
    email:           email.toLowerCase().trim(),
    full_name:       fullName,
    tier,
    tier_status:     'active',
    tier_expires_at: tierExpiresAt.toISOString(),
  }, { onConflict: 'id' })

  return Response.json({ ok: true, userId: invited.user.id })
}
