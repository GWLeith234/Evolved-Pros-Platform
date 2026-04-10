import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { NextEventBanner } from '@/components/layout/NextEventBanner'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'
import { RightRail } from '@/components/layout/RightRail'
import { ToastProvider } from '@/lib/toast'

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
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <TopNav profile={profile} unreadCount={0} />
            <EpisodeBanner />
            <NextEventBanner />
            <div className="flex flex-1 min-h-0">
              <main className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg-page)' }}>{children}</main>
              <RightRail />
            </div>
            <BottomTabBar role={profile.role} unreadCount={0} dmUnreadCount={0} />
          </div>
        </ToastProvider>
      )
    }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, tier, tier_status, tier_expires_at, role, points')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Normalize tier and role to lowercase so all downstream comparisons work
  // regardless of how values were stored (e.g. 'Pro' vs 'pro', 'Admin' vs 'admin')
  // Also remap legacy 'community' to 'vip' for any rows not yet migrated
  const rawTier = (profile.tier as string | null)?.toLowerCase()
  profile.tier  = (rawTier === 'community' ? 'vip' : rawTier) as typeof profile.tier ?? null
  profile.role  = (profile.role as string)?.toLowerCase() ?? profile.role

  if (profile.tier_status === 'cancelled') {
    redirect('/membership-expired?reason=cancelled')
  }
  if (profile.tier_status === 'expired') {
    redirect('/membership-expired?reason=expired')
  }

  // Defense-in-depth: catch expired memberships even before the daily cron runs
  if (profile.tier_expires_at && new Date(profile.tier_expires_at) < new Date()) {
    redirect('/membership-expired?reason=expired')
  }

  const [{ count: unreadCount }, { data: logoSetting }, { data: logoLightSetting }, { data: themeSetting }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'logo_dark_url')
      .single(),
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'logo_nav_light_url')
      .single(),
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'members_can_toggle_theme')
      .single(),
  ])

  const logoUrl = logoSetting?.value || null
  const logoLightUrl = logoLightSetting?.value || null
  const membersCanToggleTheme = themeSetting?.value !== 'false'

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen">
        <TopNav profile={profile} unreadCount={unreadCount ?? 0} logoUrl={logoUrl} logoLightUrl={logoLightUrl} membersCanToggleTheme={membersCanToggleTheme} />
        <EpisodeBanner />
        <NextEventBanner />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg-page)' }}>
            {children}
          </main>
          <RightRail />
        </div>
        <BottomTabBar role={profile.role} unreadCount={unreadCount ?? 0} dmUnreadCount={0} />
      </div>
    </ToastProvider>
  )
}
