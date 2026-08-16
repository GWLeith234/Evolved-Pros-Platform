import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getPlatformSettingsMap } from '@/lib/cache/shared'
import { LogoMark } from '@/components/ui/LogoMark'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { LiveAnnouncerProvider } from '@/components/a11y/LiveAnnouncer'
import { ToastProvider } from '@/lib/toast'
import {
  BottomTabBarClient,
  NextEventBannerClient,
  TopNavClient,
} from './MemberChromeClient'

/**
 * Public-or-member chrome for session-optional routes (/pricing, /membership).
 *
 * Logged-in members get the same TopNav (account menu) as /home. Anonymous
 * visitors get a Sign in control and are never redirected — /pricing must
 * stay reachable without a session.
 */
export async function SessionOptionalShell({
  children,
  signInHref = '/login',
}: {
  children: React.ReactNode
  signInHref?: string
}) {
  const isPrefetch = headers().get('Next-Router-Prefetch') === '1'
  if (isPrefetch) return <>{children}</>

  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase).catch(() => null)

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: 'var(--navy-abyss)' }}>
        <header
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--topnav-border)' }}
        >
          <Link
            href="/"
            aria-label="Evolved Pros — home"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <LogoMark variant="light" height={32} alt="Evolved Pros" />
          </Link>
          <Link
            href={signInHref}
            className="font-condensed font-bold uppercase tracking-[0.1em] text-[11px] px-4 py-2 rounded transition-opacity hover:opacity-80"
            style={{
              color: 'var(--paper)',
              border: '1px solid var(--topnav-border)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    )
  }

  const rawTier = (profile.tier as string | null)?.toLowerCase()
  profile.tier = (rawTier as typeof profile.tier) ?? null
  profile.role = (profile.role as string)?.toLowerCase() ?? profile.role

  const [{ count: unreadCount }, settings] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false),
    getPlatformSettingsMap(),
  ])
  const membersCanToggleTheme = settings.get('members_can_toggle_theme') !== 'false'

  return (
    <ToastProvider>
      <LiveAnnouncerProvider>
        <SkipToContent />
        <div className="ep-member-shell">
          <TopNavClient
            profile={profile}
            unreadCount={unreadCount ?? 0}
            membersCanToggleTheme={membersCanToggleTheme}
          />
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
          <BottomTabBarClient
            role={profile.role}
            unreadCount={unreadCount ?? 0}
            dmUnreadCount={0}
          />
        </div>
      </LiveAnnouncerProvider>
    </ToastProvider>
  )
}
