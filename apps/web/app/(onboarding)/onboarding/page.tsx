export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('onboarding_completed, onboarding_step, display_name, full_name, company' as any)
    .eq('id', user.id)
    .single()

  const p = profile as {
    onboarding_completed: boolean
    onboarding_step: number
    display_name: string | null
    full_name: string | null
    company: string | null
  } | null

  if (p?.onboarding_completed) redirect('/home')

  const initialStep  = p?.onboarding_step ?? 1
  const displayName  = p?.display_name ?? p?.full_name ?? ''
  const company      = p?.company ?? ''

  return <OnboardingFlow initialStep={initialStep} userId={user.id} displayName={displayName} company={company} />
}
