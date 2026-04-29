import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // RSC prefetch guard: middleware lets prefetch requests through so it can't
  // 503, but redirect() inside this layout would still break RSC payload
  // parsing. Bypass all auth / profile fetching for prefetch requests and
  // return bare children — the real navigation will re-render with full auth.
  const h = headers()
  const isRsc = h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1'
  if (isRsc) {
    return <>{children}</>
  }

  // dev_session bypass: gated on NODE_ENV === 'development', inert in production builds.
  // Audit confirmed safe April 28, 2026. Removing requires updating the dev workflow.
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

  // Use SSR client only for auth; adminClient (service role) for profile read
  // to bypass RLS which can hide the user row and cause a false non-admin redirect
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient
    .from('users')
    .select('role, display_name, full_name')
    .eq('email', user.email!)
    .maybeSingle()

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
