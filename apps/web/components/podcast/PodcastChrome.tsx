'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TopNavClient,
  BottomTabBarClient,
  NextEventBannerClient,
} from '@/components/layout/MemberChromeClient'
import { ToastProvider } from '@/lib/toast'
import { SkipToContent } from '@/components/a11y/SkipToContent'
import { LiveAnnouncerProvider } from '@/components/a11y/LiveAnnouncer'

type ChromeProfile = {
  id: string
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  tier: string | null
  tier_status: string | null
  role: string
  points: number
}

/**
 * Public podcast shell with a client-side member-chrome upgrade.
 *
 * The layout itself stays static (no cookies / headers) so /podcast pages can
 * use ISR. After hydration, if /api/user/me succeeds we swap in the member
 * chrome so logged-in visitors still get the in-app experience.
 */
export function PodcastChrome({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ChromeProfile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/user/me')
        if (!res.ok) {
          if (!cancelled) setReady(true)
          return
        }
        const data = await res.json() as ChromeProfile
        if (cancelled) return
        setProfile({
          ...data,
          tier: data.tier?.toLowerCase() ?? null,
          role: (data.role as string)?.toLowerCase() ?? data.role,
        })
        // Best-effort unread badge — never blocks chrome paint.
        try {
          const n = await fetch('/api/notifications?countOnly=1')
          if (n.ok) {
            const body = await n.json() as { unreadCount?: number }
            if (!cancelled) setUnreadCount(body.unreadCount ?? 0)
          }
        } catch { /* ignore */ }
      } catch {
        /* logged out */
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (profile) {
    return (
      <ToastProvider>
        <LiveAnnouncerProvider>
          <SkipToContent />
          <div className="ep-member-shell">
            <TopNavClient profile={profile} unreadCount={unreadCount} membersCanToggleTheme />
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
            <BottomTabBarClient role={profile.role} unreadCount={unreadCount} dmUnreadCount={0} />
          </div>
        </LiveAnnouncerProvider>
      </ToastProvider>
    )
  }

  // Public shell (SSR + logged-out). `ready` only gates a tiny opacity flash.
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0A0F18',
        opacity: ready || !profile ? 1 : 0.98,
      }}
    >
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(245,240,232,0.06)' }}
      >
        <Link
          href="/podcast"
          className="font-condensed text-[14px] font-bold tracking-[0.18em]"
          style={{ color: '#F5F0E8', textDecoration: 'none' }}
        >
          EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS
        </Link>
        <Link
          href="/login"
          className="rounded px-4 py-2 font-condensed text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
          style={{ color: '#F5F0E8', border: '1px solid rgba(245,240,232,0.15)', textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  )
}
