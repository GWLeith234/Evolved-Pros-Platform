'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NotifBell } from '@/components/notifications/NotifBell'

interface TopNavProps {
  profile: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
  }
  unreadCount?: number
}

const NAV_TABS = [
  { label: 'Home',      href: '/home',      match: /^\/home$/ },
  { label: 'Community', href: '/community', match: /^\/community/ },
  { label: 'Events',    href: '/events',    match: /^\/events/ },
  { label: 'Academy',   href: '/academy',   match: /^\/academy/ },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopNav({ profile, unreadCount = 0 }: TopNavProps) {
  const pathname = usePathname()

  const displayName = profile.display_name ?? profile.full_name ?? ''

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 flex-shrink-0"
        style={{
          backgroundColor: '#112535',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link
          href="/home"
          className="font-condensed font-bold text-white tracking-[0.14em] text-base select-none"
        >
          EVOLVED<span className="text-[#ef0e30]">·</span>PROS
        </Link>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-end h-full gap-1">
          {NAV_TABS.map(tab => {
            const isActive = tab.match.test(pathname)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative h-full flex items-center px-4 font-condensed font-semibold uppercase tracking-[0.12em] text-[11px] transition-colors duration-150"
                style={{
                  color: isActive ? '#a8cdd9' : 'rgba(255,255,255,0.45)',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'
                }}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: '#68a2b9' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <NotifBell initialUnreadCount={unreadCount} userId={profile.id} />

          {/* Avatar */}
          <Link
            href="/profile/me"
            className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
            style={{ backgroundColor: '#ef0e30' }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <span className="font-condensed font-bold text-white text-xs">
                {getInitials(displayName)}
              </span>
            )}
          </Link>
        </div>
      </header>

    </>
  )
}
