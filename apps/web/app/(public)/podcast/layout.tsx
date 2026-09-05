import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import {
  TopNavClient,
  BottomTabBarClient,
  NextEventBannerClient,
  RightRailClient,
} from '@/components/layout/MemberChromeClient'
import { PublicChromeHeader } from '@/components/layout/PublicChromeHeader'
import { ToastProvider } from '@/lib/toast'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { LiveAnnouncerProvider } from '@/components/a11y/LiveAnnouncer'
import { ThemeSync } from '@/components/theme/ThemeSync'

// Public podcast section, but part of the platform: a logged-in member gets
// the full member chrome (TopNav, RightRail, bottom tabs) so /podcast is a
// first-class in-app destination, not a dead-end bare page. A logged-out
// visitor / crawler gets a lightweight public header — and, critically, is
// NEVER redirected to /login, so the pages stay public and indexable.
export default async function PodcastLayout({ children }: { children: React.ReactNode }) {
  // Match the member layout's prefetch guard: return bare children for RSC
  // prefetches so we don't fetch the profile + chrome data on hover-prefetch.
  const isPrefetch = headers().get('Next-Router-Prefetch') === '1'
  if (isPrefetch) return <>{children}</>

  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase).catch(() => null)

  // Logged out (or auth hiccup) → public shell. No redirect: public + SEO.
  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0A0F18' }}>
        <PublicChromeHeader signInHref="/login" />
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    )
  }

  // Logged in → in-platform member chrome (mirrors (member)/layout, minus the
  // auth + tier_status redirects, which must not gate a public section).
  const rawTier = (profile.tier as string | null)?.toLowerCase()
  profile.tier = (rawTier as typeof profile.tier) ?? null
  profile.role = (profile.role as string)?.toLowerCase() ?? profile.role

  const [{ count: unreadCount }, { data: settingsRows }] = await Promise.all([
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false),
    supabase.from('platform_settings').select('key, value').in('key', ['members_can_toggle_theme']),
  ])
  const settings = new Map((settingsRows ?? []).map(s => [s.key, s.value]))
  const membersCanToggleTheme = settings.get('members_can_toggle_theme') !== 'false'

  return (
    <ToastProvider>
      <LiveAnnouncerProvider>
        <ThemeSync theme={profile.theme} />
        <SkipToContent />
        <div className="ep-member-shell">
          <TopNavClient profile={profile} unreadCount={unreadCount ?? 0} membersCanToggleTheme={membersCanToggleTheme} />
          <NextEventBannerClient />
          <div className="ep-member-body">
            <main id="main-content" tabIndex={-1} className="ep-main-scroll" style={{ backgroundColor: 'var(--bg-page)' }}>
              {children}
            </main>
            <RightRailClient />
          </div>
          <BottomTabBarClient role={profile.role} unreadCount={unreadCount ?? 0} dmUnreadCount={0} />
        </div>
      </LiveAnnouncerProvider>
    </ToastProvider>
  )
}
