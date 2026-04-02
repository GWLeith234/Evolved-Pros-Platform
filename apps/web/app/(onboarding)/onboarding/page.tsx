export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use adminClient + email to avoid auth UUID ≠ public users UUID mismatch.
  // If profile is null (DB error / missing row), render step 1 — never redirect to /home.
  const { data: profile } = await (adminClient as any)
    .from('users')
    .select('onboarding_completed, onboarding_step, display_name, full_name, company')
    .eq('email', user.email!)
    .single()

  const p = profile as {
    onboarding_completed: boolean
    onboarding_step: number
    display_name: string | null
    full_name: string | null
    company: string | null
  } | null

  // Only redirect when explicitly true — null/undefined means show onboarding
  if (p?.onboarding_completed === true) redirect('/home')

  const initialStep  = p?.onboarding_step ?? 1
  const displayName  = p?.display_name ?? p?.full_name ?? ''
  const company      = p?.company ?? ''

  return <OnboardingFlow initialStep={initialStep} userId={user.id} displayName={displayName} company={company} />
}
