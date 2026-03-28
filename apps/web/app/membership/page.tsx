import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { MembershipPageClient } from './MembershipPageClient'

export const dynamic = 'force-dynamic'

export default async function MembershipPage() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[membership] auth user:', user?.id, 'auth error:', authError?.message)

  let userTier: string | null = null
  let keynoteAccess = false

  if (user) {
    console.log('[membership] user.id:', user.id)
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('tier, keynote_access')
      .eq('id', user.id)
      .single()
    console.log('[membership] profile:', JSON.stringify(profile), 'error:', profileError?.message)

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
