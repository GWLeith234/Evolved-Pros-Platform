'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FIT_BARBELL_DISC } from '@/lib/lockups'

interface BottomTabBarProps {
  role: string | null
  unreadCount: number
  dmUnreadCount?: number
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function NewspaperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function FitBarbellIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FIT_BARBELL_DISC}
      alt=""
      width={20}
      height={20}
      aria-hidden="true"
      style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }}
    />
  )
}

interface TabItem {
  label: string
  href: string
  match: RegExp
  icon: ReactNode
}

// George IA relock: Home | Fit | Media | Pods only. LIVE lives in the tray.
const TABS: TabItem[] = [
  { label: 'Home',  href: '/home',    match: /^\/home$/,   icon: <HomeIcon /> },
  { label: 'Fit',   href: '/fit',     match: /^\/fit/,     icon: <FitBarbellIcon /> },
  { label: 'Media', href: '/media',   match: /^\/media/,   icon: <NewspaperIcon /> },
  { label: 'Pods',  href: '/podcast', match: /^\/podcast/, icon: <MicIcon /> },
]

function tabChrome(active: boolean) {
  return {
    color: active ? 'var(--brand-teal)' : 'var(--text-tertiary)',
    background: active ? 'rgba(10,191,163,0.10)' : 'transparent',
    minHeight: 48,
  } as const
}

export function BottomTabBar(_props: BottomTabBarProps) {
  const pathname = usePathname()

  return (
    <nav
      className="ep-bottom-tabs lg:hidden flex items-stretch fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'var(--bg-nav)',
        borderTop: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      aria-label="Primary"
      data-testid="ep-footer-tabs"
    >
      <div
        className="flex items-stretch w-full"
        style={{ height: 56 }}
      >
        {TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative ep-touch-target"
            aria-current={tab.match.test(pathname) ? 'page' : undefined}
            style={tabChrome(tab.match.test(pathname))}
          >
            <span className="relative" aria-hidden="true">
              {tab.icon}
            </span>
            <span
              className="font-condensed font-semibold uppercase tracking-wide"
              style={{ fontSize: '9px', letterSpacing: '0.06em' }}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
