'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotifBell } from '@/components/notifications/NotifBell'
import { AskGeorgeDrawer } from '@/components/layout/AskGeorgeDrawer'
import { LogoMark } from '@/components/ui/LogoMark'

const SPARKLE_PATH = 'M12 2 L13.4 9 L20 10.5 L13.4 12 L12 19 L10.6 12 L4 10.5 L10.6 9 Z'

// FOUNDATION-TOPNAV-V2: feature-flag for renewal banner.
// Flip to true once tier_expires_at data and dunning UX are ready.
const RENEWAL_BANNER_ENABLED = false

interface TopNavProps {
  profile: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
    tier_status?: string | null
    tier_expires_at?: string | null
    role?: string | null
    points?: number | null
  }
  unreadCount?: number
  logoUrl?: string | null
  logoLightUrl?: string | null
  membersCanToggleTheme?: boolean
}

interface NavItem { label: string; href: string; minTier?: 'vip' | 'pro'; highlight?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',       href: '/home' },
  { label: 'Community',  href: '/community' },
  { label: 'Events',     href: '/events' },
  { label: 'Academy',    href: '/academy',  minTier: 'vip' },
  { label: 'Podcast',    href: '/podcast' },
  { label: 'Live',       href: '/live' },
  { label: 'Media',      href: '/media',    highlight: true },
]

const TIER_RANK: Record<string, number> = { community: 1, vip: 2, pro: 3 }

function canAccess(userTier: string | null, minTier?: string): boolean {
  if (!minTier) return true
  return (TIER_RANK[userTier ?? ''] ?? 0) >= (TIER_RANK[minTier] ?? 0)
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function tierRingColor(tier: string | null | undefined): string {
  if (tier === 'pro') return 'rgba(201,168,76,0.85)'
  if (tier === 'vip') return 'rgba(96,165,250,0.7)'
  return 'rgba(255,255,255,0.15)'
}

function tierLabelColor(tier: string | null | undefined, isLight: boolean): string {
  if (tier === 'pro') return '#C9A84C'
  if (tier === 'vip') return '#60A5FA'
  return isLight ? 'rgba(27,42,74,0.5)' : 'rgba(255,255,255,0.4)'
}

// Detect whether <html> currently carries the `light-mode` class.
// Defaults to false (dark) for SSR; updates on mount and on class mutations.
function useIsLightMode(): boolean {
  const [isLight, setIsLight] = useState(false)
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light-mode'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isLight
}

export function TopNav({
  profile,
  unreadCount = 0,
  logoUrl,
  logoLightUrl,
  membersCanToggleTheme: _membersCanToggleTheme,
}: TopNavProps) {
  const pathname = usePathname()
  const isLight = useIsLightMode()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = profile.display_name ?? profile.full_name ?? ''

  // Close dropdown when clicking outside (preserved from v1)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Renewal banner data — JSX is plumbed but currently flag-gated off.
  const daysUntilExpiry = profile.tier_expires_at
    ? Math.ceil((new Date(profile.tier_expires_at).getTime() - Date.now()) / 86_400_000)
    : null
  const showRenewalBanner =
    RENEWAL_BANNER_ENABLED &&
    typeof daysUntilExpiry === 'number' &&
    daysUntilExpiry > 0 &&
    daysUntilExpiry <= 30

  // All theme-aware colors below are CSS vars defined in globals.css —
  // they resolve automatically based on the html.light-mode class.
  const linkActive   = 'var(--topnav-link-active)'
  const linkIdle     = 'var(--topnav-link-idle)'
  const linkHover    = 'var(--topnav-link-hover)'
  const dividerColor = 'var(--topnav-divider)'
  const subtleText   = 'var(--topnav-link-idle)'
  const aiLabelColor = 'var(--topnav-link-active)'

  const activeLogoUrl = isLight ? logoLightUrl : logoUrl

  return (
    <>
      <AskGeorgeDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {showRenewalBanner && daysUntilExpiry !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '8px 16px',
            fontSize: 12,
            fontFamily: '"Barlow", sans-serif',
            background: daysUntilExpiry <= 7 ? 'rgba(239,14,48,0.08)' : 'rgba(201,168,76,0.1)',
            color: daysUntilExpiry <= 7 ? '#ef6075' : 'var(--brand-gold)',
            borderBottom: '1px solid var(--topnav-border)',
          }}
        >
          <span>
            Your membership renews in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>
          </span>
          <Link
            href="/membership"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontSize: 10,
              padding: '4px 10px',
              textDecoration: 'none',
              background: daysUntilExpiry <= 7 ? '#ef0e30' : '#C9A84C',
              color: '#fff',
            }}
          >
            Renew
          </Link>
        </div>
      )}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 72,
          background: 'var(--bg-topnav)',
          borderBottom: '1px solid var(--topnav-border)',
        }}
      >
        {/* Logo (left) — actual brand mark from Branding bucket.
           Falls back to LogoMark component if URL is missing for the active theme. */}
        <Link
          href="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            height: '100%',
            textDecoration: 'none',
          }}
        >
          {activeLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeLogoUrl}
              alt="Evolved Pros"
              style={{ height: 36, width: 'auto', display: 'block' }}
            />
          ) : (
            <LogoMark variant={isLight ? 'dark' : 'light'} height={32} />
          )}
        </Link>

        {/* Nav (centered absolute) */}
        <nav
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {NAV_ITEMS.filter(item => canAccess(profile.tier, item.minTier)).map(item => {
            const active = pathname.startsWith(item.href)
            const color = item.highlight ? '#C9A84C' : (active ? linkActive : linkIdle)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 14px',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 16,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color,
                  textDecoration: 'none',
                  borderBottom: active
                    ? `2px solid ${item.highlight ? '#C9A84C' : '#C9302A'}`
                    : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 120ms ease',
                }}
                onMouseEnter={e => {
                  if (!active && !item.highlight) e.currentTarget.style.color = linkHover
                }}
                onMouseLeave={e => {
                  if (!active && !item.highlight) e.currentTarget.style.color = linkIdle
                }}
              >
                {item.label}
                {item.highlight && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M3 9 L9 3 M5 3 H9 V7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* AI George — pill variant */}
          <button
            type="button"
            onClick={() => setAiOpen(o => !o)}
            aria-label="AI George"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: '0 14px 0 4px',
              background: aiOpen ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.10)',
              border: `1px solid ${aiOpen ? '#A78BFA' : 'rgba(167,139,250,0.45)'}`,
              color: aiLabelColor,
              cursor: 'pointer',
              transition: 'all 140ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(167,139,250,0.18)'
              e.currentTarget.style.borderColor = '#A78BFA'
            }}
            onMouseLeave={e => {
              if (aiOpen) return
              e.currentTarget.style.background = 'rgba(167,139,250,0.10)'
              e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)'
            }}
          >
            {/* Violet conic halo wrapping a sparkle puck — no user avatar
               (avoids duplicate-avatar with the profile menu on the right). */}
            <span
              style={{
                position: 'relative',
                width: 32,
                height: 32,
                borderRadius: '50%',
                padding: 2,
                background: 'conic-gradient(from 200deg, #A78BFA, #C9A4FF, #A78BFA, #8B6FE8, #A78BFA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'var(--bg-topnav)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#A78BFA" aria-hidden="true">
                  <path d={SPARKLE_PATH} />
                </svg>
              </span>
              {/* Corner sparkle badge — bg matches nav so it appears cut out of the halo */}
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--bg-topnav)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#A78BFA" aria-hidden="true">
                  <path d={SPARKLE_PATH} />
                </svg>
              </span>
            </span>

            {/* Stacked label */}
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#A78BFA',
                }}
              >
                AI
              </span>
              <span
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: subtleText,
                  marginTop: 1,
                }}
              >
                George
              </span>
            </span>
          </button>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 24, background: dividerColor }} />

          {/* Notification bell (visuals updated to v2 spec; preserves drawer + realtime) */}
          <NotifBell initialUnreadCount={unreadCount} userId={profile.id} />

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              aria-label="Account menu"
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '50%',
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                background: profile.avatar_url ? '#1A2332' : '#ef0e30',
                boxShadow: `0 0 0 2px ${tierRingColor(profile.tier)}, 0 0 0 3px var(--topnav-ring-bg)`,
                overflow: 'hidden',
                transition: 'transform 120ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#fff',
                  }}
                >
                  {getInitials(displayName)}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 240,
                  background: isLight ? '#FFFFFF' : '#111926',
                  border: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.08)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: profile.avatar_url ? 'transparent' : '#ef0e30',
                      overflow: 'hidden',
                      boxShadow: `0 0 0 2px ${tierRingColor(profile.tier)}`,
                      flexShrink: 0,
                    }}
                  >
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          fontFamily: '"Barlow Condensed", sans-serif',
                          fontWeight: 700,
                          color: '#fff',
                          fontSize: 14,
                        }}
                      >
                        {getInitials(displayName)}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 700,
                        fontSize: 13,
                        color: isLight ? '#1B2A4A' : '#fff',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName || 'My account'}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 600,
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: tierLabelColor(profile.tier, isLight),
                      }}
                    >
                      {profile.tier ?? 'community'} tier
                    </p>
                  </div>
                </div>

                {/* Links */}
                {[
                  { label: 'My profile', href: '/profile/me' },
                  { label: 'Settings',   href: '/settings' },
                  { label: 'Membership', href: '/membership' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: 13,
                      color: isLight ? 'rgba(27,42,74,0.85)' : 'rgba(255,255,255,0.8)',
                      textDecoration: 'none',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isLight
                        ? 'rgba(27,42,74,0.04)'
                        : 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Sign out */}
                <div
                  style={{
                    borderTop: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: 13,
                      color: '#ef6075',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
