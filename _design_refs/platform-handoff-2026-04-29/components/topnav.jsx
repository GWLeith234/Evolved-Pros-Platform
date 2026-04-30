/* global React */
const { useState, useRef, useEffect } = React;

// ──────────────────────────────────────────────────────────────────────
// TopNav — drop-in redesign
// Preserves API:
//   profile: { id, display_name, full_name, avatar_url, tier, tier_expires_at }
//   unreadCount?: number
//   logoUrl?, logoLightUrl?: string
// ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Home',       href: '/home' },
  { label: 'Community',  href: '/community' },
  { label: 'Events',     href: '/events' },
  { label: 'Academy',    href: '/academy',   minTier: 'vip' },
  { label: 'Podcast',    href: '/podcast' },
  { label: 'Live',       href: '/live' },
  { label: 'Media',      href: '/media',     highlight: true },
];

const TIER_RANK = { community: 1, vip: 2, pro: 3 };
const canAccess = (userTier, minTier) =>
  !minTier || (TIER_RANK[userTier ?? ''] ?? 0) >= (TIER_RANK[minTier] ?? 0);

const getInitials = (name) =>
  !name ? '?' : name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const tierRingColor = (tier) => {
  if (tier === 'pro') return 'rgba(201,168,76,0.85)';
  if (tier === 'vip') return 'rgba(96,165,250,0.7)';
  return 'rgba(255,255,255,0.15)';
};

// ──────────────────────────────────────────────────────────────────────
// AI George — three variants. All center on a violet ring + user avatar.
// ──────────────────────────────────────────────────────────────────────
function AIGeorgeButton({ variant, active, onClick, profile, displayName, theme }) {
  const SparkIcon = ({ size = 12, color = '#A78BFA' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2 L13.4 9 L20 10.5 L13.4 12 L12 19 L10.6 12 L4 10.5 L10.6 9 Z"/>
    </svg>
  );

  const AvatarPuck = ({ size }) => (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      background: profile.avatar_url ? '#1A2332' : '#ef0e30',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
        : <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: Math.round(size * 0.42),
            color: '#fff', letterSpacing: '0.04em',
          }}>{getInitials(displayName)}</span>
      }
    </span>
  );

  const labelColor = theme === 'light' ? '#1B2A4A' : '#fff';
  const subtleText = theme === 'light' ? 'rgba(27,42,74,0.55)' : 'rgba(255,255,255,0.55)';

  // Variant A — Pill: avatar in violet ring + "AI George" label
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="AI George"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 40, padding: '0 14px 0 4px',
          background: active
            ? (theme === 'light' ? 'rgba(167,139,250,0.18)' : 'rgba(167,139,250,0.18)')
            : (theme === 'light' ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)'),
          border: `1px solid ${active ? '#A78BFA' : 'rgba(167,139,250,0.45)'}`,
          color: labelColor,
          transition: 'all 140ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(167,139,250,0.18)';
          e.currentTarget.style.borderColor = '#A78BFA';
        }}
        onMouseLeave={(e) => {
          if (active) return;
          e.currentTarget.style.background = theme === 'light' ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)';
          e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)';
        }}
      >
        {/* Avatar + violet halo */}
        <span style={{
          position: 'relative',
          width: 32, height: 32,
          borderRadius: '50%',
          padding: 2,
          background: 'conic-gradient(from 200deg, #A78BFA, #C9A4FF, #A78BFA, #8B6FE8, #A78BFA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AvatarPuck size={28} />
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 14, height: 14, borderRadius: '50%',
            background: theme === 'light' ? '#fff' : '#0D1B2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SparkIcon size={9}/>
          </span>
        </span>

        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 13,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#A78BFA',
          }}>AI</span>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: subtleText,
            marginTop: 1,
          }}>George</span>
        </span>
      </button>
    );
  }

  // Variant B — Ring-only icon: avatar with violet conic ring + small AI badge
  if (variant === 'ring') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="AI George"
        style={{
          position: 'relative',
          width: 40, height: 40, padding: 0,
          borderRadius: '50%',
          background: 'conic-gradient(from 200deg, #A78BFA, #C9A4FF, #A78BFA, #8B6FE8, #A78BFA)',
          boxShadow: active ? '0 0 0 3px rgba(167,139,250,0.25), 0 0 14px rgba(167,139,250,0.5)' : 'none',
          transition: 'box-shadow 140ms ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 12px rgba(167,139,250,0.5)'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: '50%',
          background: theme === 'light' ? '#F5F0E8' : '#0D1B2A',
          padding: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AvatarPuck size={30} />
        </span>
        {/* Small AI badge bottom-right */}
        <span style={{
          position: 'absolute', bottom: -4, right: -4,
          minWidth: 22, height: 16, padding: '0 4px',
          background: '#A78BFA', color: '#0A0F18',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800, fontSize: 9,
          letterSpacing: '0.12em',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${theme === 'light' ? '#F5F0E8' : '#0D1B2A'}`,
        }}>AI</span>
      </button>
    );
  }

  // Variant C — Full pill with sparkle and "Ask AI George" copy
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="AI George"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        height: 40, padding: '0 16px 0 4px',
        background: 'linear-gradient(90deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))',
        border: `1px solid ${active ? '#A78BFA' : 'rgba(167,139,250,0.4)'}`,
        color: labelColor,
        transition: 'all 140ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; }}
    >
      <span style={{
        position: 'relative', width: 32, height: 32, borderRadius: '50%', padding: 2,
        background: 'conic-gradient(from 200deg, #A78BFA, #C9A4FF, #A78BFA, #8B6FE8, #A78BFA)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <AvatarPuck size={28} />
      </span>
      <SparkIcon size={13} />
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 13,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: labelColor,
      }}>Ask AI George</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
// User avatar (right side)
// ──────────────────────────────────────────────────────────────────────
function Avatar({ profile, displayName, onClick, theme }) {
  const ring = tierRingColor(profile.tier);
  const hasPhoto = !!profile.avatar_url;
  const ringBg = theme === 'light' ? '#fff' : '#0D1B2A';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Account menu"
      style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: '50%', padding: 0,
        background: hasPhoto ? '#1A2332' : '#ef0e30',
        boxShadow: `0 0 0 2px ${ring}, 0 0 0 3px ${ringBg}`,
        overflow: 'hidden',
        transition: 'transform 120ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {hasPhoto ? (
        <img src={profile.avatar_url} alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
      ) : (
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 13, color: '#fff',
        }}>{getInitials(displayName)}</span>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
function NotifBell({ unreadCount, theme }) {
  const idle = theme === 'light' ? 'rgba(27,42,74,0.65)' : 'rgba(255,255,255,0.65)';
  const hover = theme === 'light' ? '#1B2A4A' : '#fff';
  return (
    <button type="button" aria-label="Notifications"
      style={{
        position: 'relative', width: 36, height: 36,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: idle, transition: 'color 120ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.color = idle)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          minWidth: 14, height: 14, padding: '0 3px',
          background: '#ef0e30', color: '#fff',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          fontSize: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${theme === 'light' ? '#fff' : '#0D1B2A'}`,
        }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
function TopNav({
  profile, unreadCount = 0, logoUrl, logoLightUrl,
  pathname = '/home',
  // Mock-only:
  aiVariant = 'pill',
  theme = 'dark',
  showRenewalBanner = false,
  daysUntilExpiry = 10,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile.display_name ?? profile.full_name ?? '';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLight = theme === 'light';
  const navBg = isLight ? '#FFFFFF' : '#0D1B2A';
  const navBorder = isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)';
  const linkActive = isLight ? '#1B2A4A' : '#fff';
  const linkIdle = isLight ? 'rgba(27,42,74,0.55)' : 'rgba(255,255,255,0.5)';
  const linkHover = isLight ? '#1B2A4A' : 'rgba(255,255,255,0.85)';
  const dividerColor = isLight ? 'rgba(27,42,74,0.12)' : 'rgba(255,255,255,0.08)';

  // Logo: white-on-dark, navy-on-light
  const logoSrc = isLight
    ? (logoUrl || 'assets/logo_horizontal_navy.png')
    : (logoLightUrl || 'assets/logo_horizontal_dark.png');

  return (
    <>
      {showRenewalBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '8px 16px', fontSize: 12, fontFamily: 'Barlow, sans-serif',
          background: daysUntilExpiry <= 7 ? 'rgba(239,14,48,0.08)' : 'rgba(201,168,76,0.1)',
          color: daysUntilExpiry <= 7 ? '#ef6075' : (isLight ? '#8a6d1b' : '#dbbb6a'),
          borderBottom: navBorder,
        }}>
          <span>Your membership renews in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong></span>
          <a href="/membership" style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10,
            padding: '4px 10px', textDecoration: 'none',
            background: daysUntilExpiry <= 7 ? '#ef0e30' : '#C9A84C', color: '#fff',
          }}>Renew</a>
        </div>
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 72,
        background: navBg, borderBottom: navBorder,
      }}>
        {/* Logo */}
        <a href="/home" style={{
          display: 'flex', alignItems: 'center', flexShrink: 0,
          height: '100%', textDecoration: 'none',
        }}>
          <img src={logoSrc} alt="Evolved Pros"
            style={{ height: 32, width: 'auto', display: 'block' }}/>
        </a>

        {/* Nav center */}
        <nav style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {NAV_ITEMS.filter(item => canAccess(profile.tier, item.minTier)).map(item => {
            const active = pathname.startsWith(item.href);
            const color = item.highlight ? '#C9A84C' : (active ? linkActive : linkIdle);
            return (
              <a key={item.href} href={item.href}
                style={{
                  position: 'relative',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '8px 14px',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 16, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color,
                  textDecoration: 'none',
                  borderBottom: active
                    ? `2px solid ${item.highlight ? '#C9A84C' : '#C9302A'}`
                    : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 120ms ease',
                }}
                onMouseEnter={(e) => { if (!active && !item.highlight) e.currentTarget.style.color = linkHover; }}
                onMouseLeave={(e) => { if (!active && !item.highlight) e.currentTarget.style.color = linkIdle; }}
              >
                {item.label}
                {item.highlight && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M3 9 L9 3 M5 3 H9 V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </a>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <AIGeorgeButton
            variant={aiVariant}
            active={aiOpen}
            onClick={() => setAiOpen(o => !o)}
            profile={profile}
            displayName={displayName}
            theme={theme}
          />

          <div style={{ width: 1, height: 24, background: dividerColor }}/>

          <NotifBell unreadCount={unreadCount} theme={theme}/>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <Avatar profile={profile} displayName={displayName}
              onClick={() => setDropdownOpen(o => !o)} theme={theme}/>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 240,
                background: isLight ? '#FFFFFF' : '#111926',
                border: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.08)',
                zIndex: 50, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: profile.avatar_url ? 'transparent' : '#ef0e30',
                    overflow: 'hidden',
                    boxShadow: `0 0 0 2px ${tierRingColor(profile.tier)}`,
                    flexShrink: 0,
                  }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <span style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '100%', height: '100%',
                          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
                          color: '#fff', fontSize: 14,
                        }}>{getInitials(displayName)}</span>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 13,
                      color: isLight ? '#1B2A4A' : '#fff',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{displayName || 'My account'}</p>
                    <p style={{
                      margin: '2px 0 0',
                      fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 10,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: profile.tier === 'pro' ? '#C9A84C' : profile.tier === 'vip' ? '#60A5FA' : (isLight ? 'rgba(27,42,74,0.5)' : 'rgba(255,255,255,0.4)'),
                    }}>{profile.tier ?? 'community'} tier</p>
                  </div>
                </div>
                {[
                  { label: 'My profile', href: '/profile/me' },
                  { label: 'Settings', href: '/settings' },
                  { label: 'Membership', href: '/membership' },
                ].map(item => (
                  <a key={item.href} href={item.href}
                    style={{
                      display: 'block', padding: '10px 16px',
                      fontFamily: 'Barlow, sans-serif', fontSize: 13,
                      color: isLight ? 'rgba(27,42,74,0.85)' : 'rgba(255,255,255,0.8)',
                      textDecoration: 'none', transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? 'rgba(27,42,74,0.04)' : 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >{item.label}</a>
                ))}
                <div style={{ borderTop: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="button" style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px',
                    fontFamily: 'Barlow, sans-serif', fontSize: 13,
                    color: '#ef6075', background: 'none', border: 'none', cursor: 'pointer',
                  }}>Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI George open panel mock */}
      {aiOpen && (
        <div style={{
          position: 'fixed', top: 90, right: 24, width: 380,
          background: isLight ? '#FFFFFF' : '#111926',
          border: '1px solid rgba(167,139,250,0.4)',
          zIndex: 30, padding: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14, paddingBottom: 14,
            borderBottom: isLight ? '1px solid #E0D8CC' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 36, height: 36, borderRadius: '50%', padding: 2,
                background: 'conic-gradient(from 200deg, #A78BFA, #C9A4FF, #A78BFA, #8B6FE8, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                  background: profile.avatar_url ? '#1A2332' : '#ef0e30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <span style={{
                        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13,
                        color: '#fff',
                      }}>{getInitials(displayName)}</span>
                  }
                </span>
              </span>
              <div>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: 18,
                  letterSpacing: '0.08em', color: isLight ? '#1B2A4A' : '#fff',
                }}>AI George</div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 10,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: '#A78BFA',
                }}>Your AI coach · Trained on EVOLVED</div>
              </div>
            </div>
            <button onClick={() => setAiOpen(false)}
              style={{
                color: isLight ? 'rgba(27,42,74,0.5)' : 'rgba(255,255,255,0.5)',
                fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1,
              }}>×</button>
          </div>
          <div style={{
            fontFamily: 'Barlow, sans-serif', fontSize: 13, lineHeight: 1.5,
            color: isLight ? 'rgba(27,42,74,0.75)' : 'rgba(255,255,255,0.7)',
          }}>
            What would you like to work on, {displayName.split(' ')[0]}? Try: <em style={{ color: '#A78BFA' }}>"Help me prep for a board-level discovery call."</em>
          </div>
        </div>
      )}
    </>
  );
}

window.TopNav = TopNav;
