import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasTierAccess } from '@/lib/tier'
import { CompoundBoardLocked } from '@/components/habits/CompoundBoardLocked'
import { CompoundBoardClient } from '@/components/habits/CompoundBoardClient'

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

  return (
    <div>
      {/* Page header */}
      <div
        className="px-6 pt-6 pb-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.22em]"
          style={{ fontSize: '9px', color: '#C9A84C', marginBottom: '4px' }}
        >
          Daily Practice
        </p>
        <h1
          className="font-condensed font-bold uppercase tracking-[0.08em]"
          style={{ fontSize: '24px', color: 'var(--text-primary)' }}
        >
          Compound Board
        </h1>
      </div>

      <CompoundBoardClient userId={profile.id} />
    </div>
  )
}
