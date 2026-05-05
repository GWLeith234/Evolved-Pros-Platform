import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { NextEventBanner } from '@/components/layout/NextEventBanner'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'
import { RightRail } from '@/components/layout/RightRail'
import { ToastProvider } from '@/lib/toast'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // RSC prefetch guard: middleware lets prefetch requests through so it can't
  // 503, but redirect() inside this layout would still break RSC payload
  // parsing. Bypass all auth / profile fetching for prefetch requests and
  // return bare children — the real navigation will re-render with full auth.
  const h = headers()
  const isRsc = h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1'
  if (isRsc) {
    return <>{children}</>
  }

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
  // Use the canonical id-then-email resolver so a transient miss on the
  // brittle .eq('email', user.email).single() doesn't bounce the user to
  // /login — the bug QA hit on /podcast nav. resolveCurrentUser also goes
  // through adminClient so RLS on public.users can't shadow the read.
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  // Normalize tier and role to lowercase so all downstream comparisons work
  // regardless of how values were stored (e.g. 'Pro' vs 'pro', 'Admin' vs 'admin')
  const rawTier = (profile.tier as string | null)?.toLowerCase()
  profile.tier  = rawTier as typeof profile.tier ?? null
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
      .eq('user_id', profile.id)
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
