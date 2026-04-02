export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CompletionClient } from '@/components/academy/CompletionClient'

const PILLAR_BADGES = [
  { number: 1, label: 'Foundation',        color: '#FFA538' },
  { number: 2, label: 'Identity',           color: '#A78BFA' },
  { number: 3, label: 'Mental Toughness',   color: '#F87171' },
  { number: 4, label: 'Strategic Approach', color: '#60A5FA' },
  { number: 5, label: 'Accountability',     color: '#C9A84C' },
  { number: 6, label: 'Execution',          color: '#0ABFA3' },
]

export default async function CompletionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, badgesRes] = await Promise.all([
    supabase
      .from('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('display_name, full_name, program_completed_at' as any)
      .eq('id', user.id)
      .single(),
    adminClient
      .from('member_badges')
      .select('pillar_number, awarded_at')
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data as { display_name: string | null; full_name: string | null; program_completed_at: string | null } | null
  const badges = (badgesRes.data ?? []) as { pillar_number: number; awarded_at: string | null }[]

  const displayName = profile?.display_name ?? profile?.full_name ?? 'Member'
  const completedAt = profile?.program_completed_at
    ? new Date(profile.program_completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const earnedPillarNumbers = new Set(badges.map(b => b.pillar_number))
  const alumniRow = badges.find(b => b.pillar_number === 0)
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
