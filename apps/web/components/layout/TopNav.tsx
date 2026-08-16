'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AskGeorgeDrawer } from '@/components/layout/AskGeorgeDrawer'
import { LogoMark } from '@/components/ui/LogoMark'
import { useTheme } from '@/components/theme/ThemeProvider'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { hasTierAccess } from '@/lib/tier'

// The bell links straight to the /notifications feed (single destination —
// no in-nav drawer). Loaded after paint so TopNav can SSR without an empty
// chrome flash / hydration #425.
const NotifBell = dynamic(
  () => import('@/components/notifications/NotifBell').then(m => m.NotifBell),
  {
    ssr: false,
    loading: () => (
      <span
        aria-hidden
        style={{ width: 44, height: 44, display: 'inline-block', flexShrink: 0 }}
      />
    ),
  },
)

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
  membersCanToggleTheme?: boolean
}

interface NavItem { label: string; href: string; minTier?: 'vip' | 'pro'; highlight?: boolean }

// Core loops first. Goals/Scoreboard folded into Home (daily accountability
// block lives on /home). Events consolidated under LIVE.
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',      href: '/home' },
  { label: 'Community', href: '/community' },
  // SPRINT TIER-1: Academy is open to every member. The grid is the
  // storefront — all six pillars are visible to all tiers, with the locked
  // ones badged and linked to /pricing. Hiding the nav item below VIP hid the
  // upsell along with the content.
  { label: 'Academy',   href: '/academy' },
  { label: 'LIVE',      href: '/live' },
  { label: 'Podcast',   href: '/podcast' },
  { label: 'Media',     href: '/media',    highlight: true },
]

// Tier comparisons go through hasTierAccess — this file used to carry its own
// TIER_RANK table, a second source of truth for the same question.
function canAccess(userTier: string | null, minTier?: string): boolean {
  if (!minTier) return true
  return hasTierAccess(userTier, minTier)
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function tierRingColor(tier: string | null | undefined): string {
  if (tier === 'pro') return 'rgba(201,48,42,0.85)'
  if (tier === 'vip') return 'rgba(201,168,76,0.85)'
  return 'rgba(255,255,255,0.15)'
}

function tierLabelColor(tier: string | null | undefined, isLight: boolean): string {
  if (tier === 'pro') return 'var(--brand-red)'
  if (tier === 'vip') return 'var(--brand-gold)'
  return isLight ? 'rgba(27,42,74,0.5)' : 'rgba(255,255,255,0.4)'
}

export function TopNav({
  profile,
  unreadCount = 0,
  membersCanToggleTheme = true,
}: TopNavProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = profile.display_name ?? profile.full_name ?? ''

  // Close dropdown when clicking / tapping outside (touch-friendly on mobile)
  useEffect(() => {
    function handlePointerOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerOutside)
    document.addEventListener('touchstart', handlePointerOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside)
      document.removeEventListener('touchstart', handlePointerOutside)
    }
  }, [])

  async function handleSignOut() {
    // Dynamic import keeps @supabase/client off the TopNav SSR module graph.
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Renewal banner data — JSX is plumbed but currently flag-gated off.
  // Date.now() must not run at render: SSR and CSR produce different values
  // around day boundaries and React #425 fires the moment the flag flips on.
  // Defer to a mount-gated effect so the first client render matches SSR.
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null)
  useEffect(() => {
    if (!profile.tier_expires_at) return
    setDaysUntilExpiry(
      Math.ceil((new Date(profile.tier_expires_at).getTime() - Date.now()) / 86_400_000)
    )
  }, [profile.tier_expires_at])
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
  const aiLabelColor = 'var(--topnav-link-active)'

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
            color: daysUntilExpiry <= 7 ? 'var(--red-soft)' : 'var(--brand-gold)',
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
              background: daysUntilExpiry <= 7 ? 'var(--brand-red-hot)' : 'var(--brand-gold)',
              color: '#fff',
            }}
          >
            Renew
          </Link>
        </div>
      )}

      <header
        className="ep-topnav"
        style={{
          /* sticky in normal flow inside .ep-member-shell — fixed positioning
             broke the flex height chain and killed page scrolling. */
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 24,
          paddingRight: 24,
          /* height from .ep-topnav (min-height + safe-area); avoid fixed 72
             that fights padding-top on notched devices */
          flexShrink: 0,
          background: 'var(--bg-nav)',
          borderBottom: '1px solid var(--topnav-border)',
        }}
      >
        {/* Logo (left) — canonical EVOLVED PROS horizontal wordmark with the red
           microphone (LogoMark). Rendered directly (not from an admin-set URL)
           so the brand mark is identical across every surface and can't drift to
           a stale asset. `dark` variant = navy wordmark for the light parchment
           nav; `light` variant = white wordmark for the dark nav. */}
        <Link
          href="/home"
          aria-label="Evolved Pros — home"
          className="ep-topnav-logo ep-touch-target"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            height: '100%',
            textDecoration: 'none',
            minWidth: 44,
          }}
        >
          <LogoMark variant={isLight ? 'dark' : 'light'} height={44} />
        </Link>

        {/* Nav — flex-grow centred. `flex: 1 / minWidth: 0 / overflow: hidden`
            keeps it from pushing the right cluster off-screen.
            `hidden lg:flex` hides links entirely below 1024px (Tailwind lg)
            because at 800–1100px there isn't room for all 7 + the right cluster
            without the leftmost / rightmost links clipping behind the AI button
            or avatar. Below 768px the BottomTabBar takes over; the 768–1023px
            band falls back to logo + right-cluster only.
            display:flex is set by `lg:flex` (intentionally NOT in inline style
            so Tailwind's `hidden` can override it below the breakpoint). */}
        <nav
          className="hidden lg:flex"
          style={{
            flex: 1,
            minWidth: 0,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {NAV_ITEMS.filter(item => canAccess(profile.tier, item.minTier)).map(item => {
            const active = pathname.startsWith(item.href)
            // Highlight items use a theme token so gold stays readable on parchment.
            const color = item.highlight
              ? 'var(--topnav-highlight)'
              : (active ? linkActive : linkIdle)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ep-topnav-link"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
                  fontSize: 'var(--type-nav-size, 16px)',
                  letterSpacing: 'var(--type-nav-track, 0.08em)',
                  textTransform: 'uppercase',
                  color,
                  textDecoration: 'none',
                  borderBottom: active
                    ? `2px solid ${item.highlight ? 'var(--topnav-highlight)' : 'var(--brand-red)'}`
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
              </Link>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div className="ep-topnav-cluster" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 'auto' }}>
          {/* Ask George — compact AI entry (single label for adoption) */}
          <button
            type="button"
            onClick={() => setAiOpen(o => !o)}
            aria-label="Ask George"
            title="Ask George"
            className="ep-ask-btn ep-pressable"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              minHeight: 40,
              minWidth: 40,
              padding: '0 12px 0 4px',
              background: aiOpen ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.10)',
              border: `1px solid ${aiOpen ? 'var(--brand-violet)' : 'rgba(167,139,250,0.45)'}`,
              color: aiLabelColor,
              cursor: 'pointer',
              transition: 'all 140ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(167,139,250,0.18)'
              e.currentTarget.style.borderColor = 'var(--brand-violet)'
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
                background: 'conic-gradient(from 200deg, var(--brand-violet), var(--violet-light), var(--brand-violet), var(--violet-deep), var(--brand-violet))',
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
                  background: 'var(--bg-nav)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--brand-violet)" aria-hidden="true">
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
                  background: 'var(--bg-nav)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--brand-violet)" aria-hidden="true">
                  <path d={SPARKLE_PATH} />
                </svg>
              </span>
            </span>

            <span
              className="ep-ask-label"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--brand-violet)',
              }}
            >
              Ask
            </span>
          </button>

          {/* Vertical divider */}
          <div className="ep-topnav-divider" style={{ width: 1, height: 24, background: dividerColor }} />

          {/* Notification bell (visuals updated to v2 spec; preserves drawer + realtime) */}
          <NotifBell initialUnreadCount={unreadCount} userId={profile.id} />

          {membersCanToggleTheme && (
            <>
              {/* Vertical divider */}
              <div className="ep-topnav-divider" style={{ width: 1, height: 24, background: dividerColor }} />

              {/* Theme toggle */}
              <ThemeToggle />
            </>
          )}

          {/* Avatar + dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              aria-label="Account menu"
              className="ep-pressable"
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                minWidth: 40,
                minHeight: 40,
                borderRadius: '50%',
                padding: 0,
                border: 'none',
                cursor: 'pointer',
                background: profile.avatar_url ? 'var(--bg-elevated)' : 'var(--brand-red-hot)',
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
                  background: 'var(--bg-surface)',
                  border: isLight ? '1px solid var(--paper-line)' : '1px solid rgba(255,255,255,0.08)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: isLight ? '1px solid var(--paper-line)' : '1px solid rgba(255,255,255,0.06)',
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
                      background: profile.avatar_url ? 'transparent' : 'var(--brand-red-hot)',
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
                        color: 'var(--text-primary)',
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
                  { label: 'Profile',    href: '/profile/me' },
                  { label: 'Settings',   href: '/settings' },
                  { label: 'Membership', href: '/membership' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="ep-touch-target"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 44,
                      padding: '12px 16px',
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
                    borderTop: isLight ? '1px solid var(--paper-line)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      minHeight: 44,
                      padding: '12px 16px',
                      fontFamily: '"Barlow", sans-serif',
                      fontSize: 13,
                      color: 'var(--red-soft)',
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
