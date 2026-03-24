'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  profile: {
    id: string
    tier: string | null
    role: string
  }
  unreadPosts?: number
  upcomingEvents?: number
}

interface NavItem {
  label: string
  href: string
  match: RegExp
  badge?: number
  badgeColor?: string
  icon: React.ReactNode
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2" />
    </svg>
  )
}

function SidebarNavItem({
  item,
  active,
}: {
  item: NavItem
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className="relative w-full flex items-center gap-3 py-[9px] px-5 transition-all duration-150 text-left"
      style={{
        color: active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
        backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #68a2b9' : '2px solid transparent',
        paddingLeft: active ? '18px' : '20px',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'rgba(255,255,255,0.04)'
          el.style.color = 'rgba(255,255,255,0.8)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = 'transparent'
          el.style.color = 'rgba(255,255,255,0.5)'
        }
      }}
    >
      <span className="flex-shrink-0 w-[14px] h-[14px] flex items-center justify-center">
        {item.icon}
      </span>
      <span className="font-condensed font-semibold uppercase tracking-[0.12em] text-[13px] flex-1 truncate">
        {item.label}
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full font-condensed font-bold text-[9px] text-white flex items-center justify-center"
          style={{ backgroundColor: item.badgeColor ?? '#ef0e30' }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[9px]"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

export function Sidebar({ profile, unreadPosts = 0, upcomingEvents = 0 }: SidebarProps) {
  const pathname = usePathname()

  const navigateItems: NavItem[] = [
    { label: 'Overview',  href: '/home',      match: /^\/home$/, icon: <HomeIcon /> },
    { label: 'Community', href: '/community', match: /^\/community/, badge: unreadPosts, badgeColor: '#ef0e30', icon: <ChatIcon /> },
    { label: 'Events',    href: '/events',    match: /^\/events/, badge: upcomingEvents, badgeColor: '#68a2b9', icon: <CalendarIcon /> },
    { label: 'Academy',   href: '/academy',   match: /^\/academy/, icon: <BookIcon /> },
  ]

  const mySpaceItems: NavItem[] = [
    { label: 'My Profile', href: '/profile/me',           match: /^\/profile\/me$/, icon: <UserIcon /> },
    { label: 'Progress',   href: '/profile/me?tab=progress', match: /^\/profile\/me\?tab=progress/, icon: <BarChartIcon /> },
    { label: 'Settings',   href: '/settings',              match: /^\/settings/, icon: <SettingsIcon /> },
  ]

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col pt-5 pb-4"
      style={{
        backgroundColor: '#112535',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <SidebarSection title="Navigate">
        {navigateItems.map(item => (
          <SidebarNavItem
            key={item.href}
            item={item}
            active={item.match.test(pathname)}
          />
        ))}
      </SidebarSection>

      <SidebarSection title="My Space">
        {mySpaceItems.map(item => (
          <SidebarNavItem
            key={item.href}
            item={item}
            active={item.match.test(pathname + (typeof window !== 'undefined' ? window.location.search : ''))}
          />
        ))}
      </SidebarSection>

      {profile.role === 'admin' && (
        <SidebarSection title="Admin">
          <SidebarNavItem
            item={{
              label: 'Admin Panel',
              href: '/admin',
              match: /^\/admin/,
              icon: <SettingsIcon />,
            }}
            active={/^\/admin/.test(pathname)}
          />
        </SidebarSection>
      )}
    </aside>
  )
}
