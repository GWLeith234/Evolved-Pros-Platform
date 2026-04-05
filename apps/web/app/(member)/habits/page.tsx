import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasTierAccess } from '@/lib/tier'
import { CompoundBoardLocked } from '@/components/habits/CompoundBoardLocked'
import { HabitsPageShell } from '@/components/habits/HabitsPageShell'

export const dynamic = 'force-dynamic'

export default async function HabitsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, tier')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const hasAccess = hasTierAccess(profile.tier as 'pro' | 'vip' | 'community' | null, 'pro')

  if (!hasAccess) {
    return <CompoundBoardLocked />
  }

  return <HabitsPageShell userId={profile.id} />
}
