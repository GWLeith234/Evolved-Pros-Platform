import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Dev bypass: skip Supabase when a dev_session cookie is present
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = cookies()
    const devSession = cookieStore.get('dev_session')?.value
    if (devSession) {
      const profile = JSON.parse(devSession) as { role: string; display_name: string; full_name: string }
      if (profile.role !== 'admin') redirect('/home')
      return (
        <div className="flex flex-col min-h-screen">
          <AdminTopNav profile={profile} />
          <div className="flex flex-1 min-h-0">
            <AdminSidebar />
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
    .select('role, display_name, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/home')

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopNav profile={profile} />
      <div className="flex flex-1 min-h-0">
        <AdminSidebar />
        <main className="flex-1 bg-[#faf9f7] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
