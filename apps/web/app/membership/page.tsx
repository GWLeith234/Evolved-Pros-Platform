import { createClient } from '@/lib/supabase/server'
import { MembershipPageClient } from './MembershipPageClient'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userTier: string | null = null
  let keynoteAccess = false

  if (user) {
    // Try fetching tier + keynote_access together. If keynote_access column
    // doesn't exist yet in this environment (migration 024 not yet applied),
    // fall back to fetching tier only so the badge still renders correctly.
    const { data: profile, error } = await supabase
      .from('users')
      .select('tier, keynote_access')
      .eq('id', user.id)
      .single()

    if (profile) {
      userTier = profile.tier?.toLowerCase() ?? null
      if (userTier === 'community') userTier = 'vip'
      keynoteAccess = profile.keynote_access === true
    } else if (error) {
      // Fallback: fetch tier only (keynote_access column may not exist yet)
      const { data: tierOnly } = await supabase
        .from('users')
        .select('tier')
        .eq('id', user.id)
        .single()
      if (tierOnly) {
        userTier = tierOnly.tier?.toLowerCase() ?? null
        if (userTier === 'community') userTier = 'vip'
      }
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
