export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CompletionClient } from '@/components/academy/CompletionClient'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

const PILLAR_BADGES = [
  { number: 1, label: 'Foundation',        color: '#FFA538' },
  { number: 2, label: 'Identity',           color: '#A78BFA' },
  { number: 3, label: 'Mental Toughness',   color: '#F87171' },
  { number: 4, label: 'Strategy',           color: '#60A5FA' },
  { number: 5, label: 'Accountability',     color: '#C9A84C' },
  { number: 6, label: 'Execution',          color: '#0ABFA3' },
]

export default async function CompletionPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const [alumniRes, capstoneCoursesRes] = await Promise.all([
    // Alumni badge only (pillar_number = 7)
    adminClient
      .from('member_badges')
      .select('awarded_at')
      .eq('user_id', profile.id)
      .eq('pillar_number', 7)
      .maybeSingle(),
    // Submitted capstones joined to courses to get pillar_number
    adminClient
      .from('capstones')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('course_id, courses(pillar_number)' as any)
      .eq('user_id', profile.id)
      .eq('status', 'submitted'),
  ])

  const alumniRow = alumniRes.data as { awarded_at: string | null } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programCompletedAt = (profile as any).program_completed_at as string | null | undefined

  const displayName = profile.display_name ?? profile.full_name ?? 'Member'
  const completedAt = programCompletedAt
    ? new Date(programCompletedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Derive completed pillar numbers from submitted capstones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capstoneRows = (capstoneCoursesRes.data ?? []) as unknown as { courses: { pillar_number: number } | null }[]
  const earnedPillarNumbers = new Set(
    capstoneRows.map(r => r.courses?.pillar_number).filter((n): n is number => n != null)
  )

  const alumniAwardedAt = alumniRow?.awarded_at
    ? new Date(alumniRow.awarded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : completedAt

  const pillarBadgeData = PILLAR_BADGES.map(p => ({
    ...p,
    earned: earnedPillarNumbers.has(p.number),
  }))

  return (
    <CompletionClient
      displayName={displayName}
      completedAt={completedAt}
      alumniAwardedAt={alumniAwardedAt}
      pillarBadges={pillarBadgeData}
    />
  )
}
