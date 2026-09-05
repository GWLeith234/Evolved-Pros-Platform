import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
// SPRINT HYDRATION-FIX-4 — TopNav, BottomTabBar, NextEventBanner historically
// pulled @supabase/realtime-js into hydration. They now defer client creation.
import {
  TopNavClient,
  BottomTabBarClient,
  NextEventBannerClient,
} from '@/components/layout/MemberChromeClient'
import { ToastProvider } from '@/lib/toast'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { LiveAnnouncerProvider } from '@/components/a11y/LiveAnnouncer'
import { RETURN_PATH_HEADER, loginHrefFor } from '@/lib/auth/gatedIntent'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getPlatformSettingsMap } from '@/lib/cache/shared'
import { ThemeSync } from '@/components/theme/ThemeSync'

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
          <LiveAnnouncerProvider>
            <SkipToContent />
            {/* ep-member-shell: fixed viewport height so main's overflow-y-auto
                has a real max-height and page content can scroll again. */}
            <div className="ep-member-shell">
              <TopNavClient profile={profile} unreadCount={0} />
              <NextEventBannerClient />
              <div className="ep-member-body">
                <main
                  id="main-content"
                  tabIndex={-1}
                  className="ep-main-scroll"
                  style={{ backgroundColor: 'var(--bg-page)' }}
                >
                  {children}
                </main>
              </div>
              <BottomTabBarClient role={profile.role} unreadCount={0} dmUnreadCount={0} />
            </div>
          </LiveAnnouncerProvider>
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
  if (!profile) {
    const returnPath = h.get(RETURN_PATH_HEADER) ?? '/home'
    redirect(loginHrefFor(returnPath))
  }

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

  const [{ count: unreadCount }, settings] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false),
    // Cached 5 min — shared with root layout theme read.
    getPlatformSettingsMap(),
  ])

  const membersCanToggleTheme = settings.get('members_can_toggle_theme') !== 'false'

  return (
    <ToastProvider>
      <LiveAnnouncerProvider>
        {/* Stored theme wins over the localStorage hint. Parse-blocking, so it
            lands before the shell paints — no flash in a fresh browser. */}
        <ThemeSync theme={profile.theme} />
        <SkipToContent />
        {/* SCROLL-FIX: member chrome is a fixed viewport shell (100dvh).
            TopNav sits in normal flow (sticky). Main is the only vertical
            scroller (overflow-y: auto + min-height: 0). Using min-h-screen
            + fixed nav + overflow-y-auto on main left main unbounded so
            nothing scrolled after the mobile polish sprint. */}
        <div className="ep-member-shell">
          <TopNavClient profile={profile} unreadCount={unreadCount ?? 0} membersCanToggleTheme={membersCanToggleTheme} />
          {/* SPRINT N-3: <EpisodeBanner /> moved out of the layout into each
              page (home/community/events). */}
          <NextEventBannerClient />
          <div className="ep-member-body">
            {/* min-w-0: prevent wide children from expanding past the flex parent
                (settings tab strip, etc.). Scroll lives on .ep-main-scroll. */}
            <main
              id="main-content"
              tabIndex={-1}
              className="ep-main-scroll"
              style={{ backgroundColor: 'var(--bg-page)' }}
            >
              {children}
            </main>
          </div>
          <BottomTabBarClient role={profile.role} unreadCount={unreadCount ?? 0} dmUnreadCount={0} />
        </div>
      </LiveAnnouncerProvider>
    </ToastProvider>
  )
}
