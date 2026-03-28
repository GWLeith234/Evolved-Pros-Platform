import { createClient } from '@/lib/supabase/server'
import { MembershipPageClient } from './MembershipPageClient'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userTier: string | null = null
  let keynoteAccess = false

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('tier, keynote_access')
      .eq('id', user.id)
      .single()

    if (profile) {
      userTier = profile.tier?.toLowerCase() ?? null
      // remap legacy 'community' just in case
      if (userTier === 'community') userTier = 'vip'
      keynoteAccess = profile.keynote_access === true
    }
  }

  return (
    <MembershipPageClient userTier={userTier} keynoteAccess={keynoteAccess} />
  )
}
