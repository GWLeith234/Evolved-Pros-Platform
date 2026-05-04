import { createClient } from '@/lib/supabase/server'
import { MembershipPageClient } from './MembershipPageClient'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)

  let userTier: string | null = null
  let keynoteAccess = false

  if (profile) {
    userTier = profile.tier?.toLowerCase() ?? null
    keynoteAccess = profile.keynote_access === true
  }

  return (
    <MembershipPageClient
      userTier={userTier}
      keynoteAccess={keynoteAccess}
      isLoggedIn={!!profile}
    />
  )
}
