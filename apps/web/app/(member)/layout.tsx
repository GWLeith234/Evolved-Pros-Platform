import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { TopNav } from '@/components/layout/TopNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // Dev bypass: skip Supabase when a dev_session cookie is present
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = cookies()
    const devSession = cookieStore.get('dev_session')?.value
    if (devSession) {
      const profile = JSON.parse(devSession) as {
        id: string; display_name: string; full_name: string; avatar_url: string | null
        tier: string; tier_status: string; role: string; points: number
      }
      return (
        <div className="flex flex-col min-h-screen">
          <TopNav profile={profile} unreadCount={0} />
          <div className="flex flex-1 min-h-0">
            <Sidebar profile={profile} />
            <main className="flex-1 bg-[#faf9f7] overflow-y-auto">{children}</main>
          </div>
        </div>
      )
    }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, tier, tier_status, role, points')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.tier_status === 'cancelled' || profile.tier_status === 'expired') {
    redirect('/membership-expired')
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav profile={profile} unreadCount={unreadCount ?? 0} />
      <div className="flex flex-1 min-h-0">
        <Sidebar profile={profile} />
        <main className="flex-1 bg-[#faf9f7] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
