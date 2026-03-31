export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { PioneerDriverAssessment } from '@/components/academy/PioneerDriverAssessment'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [, p2Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 2),
  ])

  return (
    <PillarPageShell pillarNumber={2} showReflection showAudit>
      <LiveSessionCard pillarId="identity" pillarNumber={2} />
      {p2Course && <PioneerDriverAssessment />}
    </PillarPageShell>
  )
}
