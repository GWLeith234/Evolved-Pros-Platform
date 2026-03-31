export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { MagicLinkEmail } from '@/lib/resend/emails/MagicLink'

// Always use the verified sandbox sender — evolvedpros.com is not yet verified in Resend
const FROM_ADDRESS = 'Evolved Pros <onboarding@resend.dev>'

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
    tier: 'vip' | 'pro'
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

  // Generate invite link without triggering Supabase's SMTP (bypasses unverified domain issue)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email: email.toLowerCase().trim(),
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboard`,
      data: { full_name: fullName },
    },
  })

  if (linkError || !linkData) {
    console.error('[POST /api/admin/invite] generateLink error:', linkError)
    return Response.json({ error: linkError?.message ?? 'Failed to generate invite link' }, { status: 500 })
  }

  const inviteUrl = linkData.properties?.action_link
  if (!inviteUrl) {
    return Response.json({ error: 'No invite link returned from auth service' }, { status: 500 })
  }

  // Send invite email via Resend using verified sandbox sender
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email.toLowerCase().trim(),
    subject: "You've been invited to Evolved Pros",
    react: MagicLinkEmail({ magicLink: inviteUrl }),
  })

  if (emailError) {
    console.error('[POST /api/admin/invite] Resend error:', emailError)
    return Response.json({ error: `Failed to send invite email: ${emailError.message}` }, { status: 500 })
  }

  // Upsert the user row with tier
  const tierExpiresAt = new Date()
  tierExpiresAt.setMonth(tierExpiresAt.getMonth() + 1)

  await adminClient.from('users').upsert({
    id:              linkData.user.id,
    email:           email.toLowerCase().trim(),
    full_name:       fullName,
    tier,
    tier_status:     'active',
    tier_expires_at: tierExpiresAt.toISOString(),
  }, { onConflict: 'id' })

  return Response.json({ ok: true, userId: linkData.user.id })
}
