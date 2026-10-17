import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { AdminTopNav } from '@/components/admin/AdminTopNav'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeSync } from '@/components/theme/ThemeSync'
import { weeklyReportsNavHref } from '@/lib/reports/access'
import { adminLayoutPrefetchOmitsChildren, adminLayoutRedirectTarget } from '@/lib/admin/layoutGate'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware returns before its admin role check on RSC and prefetch
  // flights. Real client navigations also send RSC=1, so that header is not
  // a skip. Prefetch renders nothing: no session read and no children, so a
  // page that queries the service role cannot run for a non-admin.
  if (adminLayoutPrefetchOmitsChildren(headers().get('Next-Router-Prefetch'))) {
    return null
  }

  // dev_session bypass: gated on NODE_ENV === 'development', inert in production builds.
  // Audit confirmed safe April 28, 2026. Removing requires updating the dev workflow.
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = cookies()
    const devSession = cookieStore.get('dev_session')?.value
    if (devSession) {
      const profile = JSON.parse(devSession) as {
        id?: string
        role: string
        display_name: string
        full_name: string
      }
      const devTarget = adminLayoutRedirectTarget({ signedIn: true, role: profile.role })
      if (devTarget) redirect(devTarget)
      const weeklyReportsHref = await weeklyReportsNavHref([profile.id])
      return (
        <div className="ep-member-shell ep-admin-shell">
          <AdminTopNav profile={profile} weeklyReportsHref={weeklyReportsHref} />
          <div className="ep-member-body">
            <AdminSidebar weeklyReportsHref={weeklyReportsHref} />
            <main className="ep-main-scroll bg-[var(--admin-page)]" style={{ paddingBottom: 0 }}>{children}</main>
          </div>
        </div>
      )
    }
  }

  // Use SSR client only for auth; adminClient (service role) for profile read
  // to bypass RLS which can hide the user row and cause a false non-admin redirect
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user?.email
    ? await adminClient
        .from('users')
        .select('id, role, display_name, full_name, theme')
        .eq('email', user.email)
        .maybeSingle()
    : { data: null }

  const target = adminLayoutRedirectTarget({ signedIn: Boolean(user), role: profile?.role })
  if (target) redirect(target)
  if (!user || !profile) redirect('/login')

  const weeklyReportsHref = await weeklyReportsNavHref([user.id, profile?.id])

  return (
    <div className="ep-member-shell ep-admin-shell">
      {/* Stored theme wins over the localStorage hint (see ThemeSync). */}
      <ThemeSync theme={profile.theme} />
      <AdminTopNav profile={profile} weeklyReportsHref={weeklyReportsHref} />
      <div className="ep-member-body">
        <AdminSidebar weeklyReportsHref={weeklyReportsHref} />
        <main className="ep-main-scroll bg-[var(--admin-page)]" style={{ paddingBottom: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
