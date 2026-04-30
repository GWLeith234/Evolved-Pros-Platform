'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'All', href: '/media' },
  { label: 'Evolved Architecture', href: '/media/evolved-architecture' },
  { label: 'Community', href: '/media/community' },
  { label: 'Academy', href: '/media/academy' },
  { label: 'Podcast', href: '/media/podcast' },
  { label: 'Events', href: '/media/events' },
  { label: 'AI Trends', href: '/media/ai-trends' },
  { label: 'Wellness', href: '/media/wellness' },
  { label: 'Leadership', href: '/media/leadership' },
  { label: 'Careers', href: '/media/careers' },
]

export function MediaNav() {
  const pathname = usePathname()

  return (
    <nav style={{ backgroundColor: '#2B3A5A', padding: '0 24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
      {NAV_ITEMS.map(item => {
        const active = item.href === '/media'
          ? pathname === '/media'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily: 'var(--font-logo)',
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              padding: '9px 12px',
              borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'color 0.15s',
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
