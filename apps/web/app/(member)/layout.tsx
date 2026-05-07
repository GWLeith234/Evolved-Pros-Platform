import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { NextEventBanner } from '@/components/layout/NextEventBanner'
import { EpisodeBanner } from '@/components/layout/EpisodeBanner'
import { HideOnPodcast } from '@/components/layout/HideOnPodcast'
import { RightRail } from '@/components/layout/RightRail'
import { ToastProvider } from '@/lib/toast'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  // RSC prefetch guard: skip auth + profile fetching for *prefetch* requests
  // only. Click navigations also send RSC=1 to fetch the streaming RSC payload
  // for the new segment — short-circuiting those returned bare children with no
  // TopNav / RightRail / tier checks, which surfaced as 503-on-click for
  // /academy/[pillar]/[lessonSlug] (same root cause as ADMIN-MEMBERS d9c5228).
  // Gate strictly on Next-Router-Prefetch so real navigations re-run the full
  // layout. Middleware (middleware.ts:36-41) still lets prefetch through, so
  // skipping here can't 503.
  const h = headers()
  const isPrefetch = h.get('Next-Router-Prefetch') === '1'
  if (isPrefetch) {
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
          <div className="flex flex-col min-h-screen overflow-x-hidden">
            <TopNav profile={profile} unreadCount={0} />
            <HideOnPodcast>
              <EpisodeBanner />
            </HideOnPodcast>
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
      {/* overflow-x-hidden contains off-canvas drawers (NotifDrawer,
          AskGeorgeDrawer) whose translateX(100%) state otherwise inflates
          body.scrollWidth on mobile. Stays at the wrapper level so modals
          and the page's own vertical scroll keep working. */}
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <TopNav profile={profile} unreadCount={unreadCount ?? 0} logoUrl={logoUrl} logoLightUrl={logoLightUrl} membersCanToggleTheme={membersCanToggleTheme} />
        {/* /podcast renders its own page-level <PodcastLatestStrip/>; this
            global EpisodeBanner would stack a second "LATEST EPISODE" bar
            directly on top of it. HideOnPodcast hides the global one only on
            /podcast/* — every other route keeps it. The dev-bypass branch
            above already wraps EpisodeBanner the same way; this matches it
            for the production path. */}
        <HideOnPodcast>
          <EpisodeBanner />
        </HideOnPodcast>
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
