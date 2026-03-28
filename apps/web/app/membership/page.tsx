import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { MembershipPageClient } from './MembershipPageClient'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  // Use the cookie-based SSR client only for auth — it reads the session cookie.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userTier: string | null = null
  let keynoteAccess = false

  if (user) {
    // Use the service-role adminClient for the DB query so RLS is bypassed.
    // The SSR anon client can be unreliable for DB reads on public routes
    // (session cookie propagation differs from (member) layout routes).
    const { data: profile } = await adminClient
      .from('users')
      .select('tier, keynote_access')
      .eq('id', user.id)
      .single()

    if (profile) {
      userTier = profile.tier?.toLowerCase() ?? null
      if (userTier === 'community') userTier = 'vip'
      keynoteAccess = profile.keynote_access === true
    }
  }

  return (
    <MembershipPageClient
      userTier={userTier}
      keynoteAccess={keynoteAccess}
      isLoggedIn={!!user}
    />
  )
}
