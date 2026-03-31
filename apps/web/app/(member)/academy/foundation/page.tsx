export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchUserProfile, fetchCourseByPillarNumber } from '@/lib/academy/fetchers'
import { PillarPageShell } from '@/components/academy/PillarPageShell'
import { LiveSessionCard } from '@/components/academy/LiveSessionCard'
import { Capstone } from '@/components/academy/Capstone'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, p1Course, p2Course] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchCourseByPillarNumber(supabase, 1),
    fetchCourseByPillarNumber(supabase, 2),
  ])

  const memberName = profile?.full_name ?? profile?.email ?? null

  return (
    <PillarPageShell pillarNumber={1} showReflection showAudit>
      <LiveSessionCard pillarId="foundation" pillarNumber={1} />
      {p1Course && (
        <Capstone
          courseId={p1Course.id}
          pillarNumber={1}
          memberName={memberName}
        />
      )}
    </PillarPageShell>
  )
}
