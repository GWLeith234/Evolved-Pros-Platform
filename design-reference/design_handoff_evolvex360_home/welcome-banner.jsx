/* global React */
const { useState, useMemo } = React;

// ──────────────────────────────────────────────────────────────────────
// Sky scenes — pure SVG, six time-of-day moods
// Returns { gradient, stars, sun, moon, clouds, horizonGlow } as JSX
// ──────────────────────────────────────────────────────────────────────

function SkyScene({ period }) {
  // Each scene is a layered SVG with absolute positioning, fills the parent
  const scenes = {
    'early-morning': {
      bg: 'linear-gradient(180deg, #1B2A4A 0%, #45506b 35%, #c08a72 75%, #f0b78a 100%)',
      sun: { y: '78%', color: '#FFA538', glow: 'rgba(255,165,56,0.45)' },
      stars: 0,
      clouds: 'wisp',
      tint: 'rgba(255,165,56,0.18)',
    },
    'mid-morning': {
      bg: 'linear-gradient(180deg, #6BA3D6 0%, #9CC4E6 50%, #D5E5F2 100%)',
      sun: { y: '30%', color: '#FFD37A', glow: 'rgba(255,211,122,0.55)' },
      stars: 0,
      clouds: 'fluffy',
      tint: 'rgba(96,165,250,0.0)',
    },
    'midday': {
      bg: 'linear-gradient(180deg, #2E5C8A 0%, #5B8DBF 55%, #8FB7D9 100%)',
      sun: { y: '20%', color: '#FFE89A', glow: 'rgba(255,232,154,0.6)' },
      stars: 0,
      clouds: 'fluffy',
      tint: 'rgba(96,165,250,0.04)',
    },
    'early-evening': {
      bg: 'linear-gradient(180deg, #2A2541 0%, #6E4A6B 50%, #C26A52 85%, #F0A06A 100%)',
      sun: { y: '70%', color: '#F87171', glow: 'rgba(248,113,113,0.6)' },
      stars: 0,
      clouds: 'streak',
      tint: 'rgba(248,113,113,0.15)',
    },
    'evening': {
      bg: 'linear-gradient(180deg, #0F1830 0%, #1E2A4F 40%, #3D2E5C 70%, #6B3A52 100%)',
      sun: null,
      moon: { y: '32%', x: '78%' },
      stars: 12,
      clouds: 'streak-dim',
      tint: 'rgba(167,139,250,0.12)',
    },
    'night': {
      bg: 'linear-gradient(180deg, #050912 0%, #0A1226 50%, #0F1B36 100%)',
      sun: null,
      moon: { y: '28%', x: '82%' },
      stars: 28,
      clouds: 'wisp-dim',
      tint: 'rgba(10,15,24,0.0)',
    },
  };

  const s = scenes[period] ?? scenes['evening'];

  // Deterministic star positions
  const starList = useMemo(() => {
    const out = [];
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < s.stars; i++) {
      out.push({
        x: rand() * 100,
        y: rand() * 65,
        r: rand() * 1.2 + 0.4,
        o: rand() * 0.6 + 0.4,
      });
    }
    return out;
  }, [s.stars]);

  const Cloud = ({ x, y, w, opacity = 0.5, blur = 0 }) => (
    <ellipse
      cx={x} cy={y} rx={w} ry={w * 0.28}
      fill="white" opacity={opacity}
      style={{ filter: blur ? `blur(${blur}px)` : 'none' }}
    />
  );

  const cloudSets = {
    fluffy: [
      { x: 15, y: 35, w: 14, o: 0.85, b: 0 },
      { x: 38, y: 22, w: 10, o: 0.7, b: 0 },
      { x: 62, y: 40, w: 18, o: 0.9, b: 0 },
      { x: 88, y: 28, w: 12, o: 0.75, b: 0 },
      { x: 25, y: 55, w: 16, o: 0.55, b: 1 },
    ],
    wisp: [
      { x: 20, y: 30, w: 22, o: 0.35, b: 1 },
      { x: 60, y: 45, w: 26, o: 0.4, b: 2 },
      { x: 85, y: 25, w: 14, o: 0.3, b: 1 },
    ],
    streak: [
      { x: 25, y: 35, w: 30, o: 0.5, b: 2 },
      { x: 70, y: 50, w: 34, o: 0.6, b: 1 },
      { x: 50, y: 22, w: 20, o: 0.4, b: 2 },
    ],
    'streak-dim': [
      { x: 30, y: 45, w: 32, o: 0.18, b: 3 },
      { x: 75, y: 30, w: 24, o: 0.14, b: 3 },
    ],
    'wisp-dim': [
      { x: 22, y: 35, w: 30, o: 0.08, b: 4 },
      { x: 70, y: 55, w: 28, o: 0.1, b: 4 },
    ],
  };
  const clouds = cloudSets[s.clouds] || [];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Base sky gradient */}
      <div style={{ position: 'absolute', inset: 0, background: s.bg }} />

      {/* Sun glow */}
      {s.sun && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: s.sun.y,
          transform: 'translate(-50%, -50%)',
          width: 360, height: 360,
          background: `radial-gradient(circle, ${s.sun.glow} 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}/>
      )}

      {/* SVG layer for clouds, sun disc, moon, stars */}
      <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}>
        {clouds.map((c, i) => (
          <Cloud key={i} x={c.x} y={c.y} w={c.w} opacity={c.o} blur={c.b}/>
        ))}
        {s.sun && (
          <circle
            cx="50"
            cy={parseFloat(s.sun.y)/100 * 60}
            r="3"
            fill={s.sun.color}
          />
        )}
        {s.moon && (
          <g>
            <circle cx={parseFloat(s.moon.x)/100 * 100} cy={parseFloat(s.moon.y)/100 * 60} r="2.4" fill="#F5F0E8" opacity="0.95"/>
            <circle cx={parseFloat(s.moon.x)/100 * 100 - 0.6} cy={parseFloat(s.moon.y)/100 * 60 - 0.4} r="2.2" fill={period==='night'?'#0A1226':'#1E2A4F'} opacity="0.6"/>
          </g>
        )}
        {starList.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r * 0.18} fill="#fff" opacity={st.o}>
            <animate attributeName="opacity" values={`${st.o};${st.o*0.3};${st.o}`} dur={`${2+i%3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>

      {/* Horizon glow (subtle) */}
      {s.tint && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, transparent 60%, ${s.tint} 100%)`,
          pointerEvents: 'none',
        }}/>
      )}

      {/* Readability scrim — dark left → transparent right */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(10,15,24,0.85) 0%, rgba(10,15,24,0.5) 45%, rgba(10,15,24,0.15) 100%)',
        pointerEvents: 'none',
      }}/>
      {/* Bottom shade for week label / chips */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(10,15,24,0.55) 100%)',
        pointerEvents: 'none',
      }}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Tier badges — six rethought variants
// ──────────────────────────────────────────────────────────────────────

const TIER_COLORS = {
  pro:       { bg: '#C9A84C', fg: '#0A0F18', label: 'Pro' },
  vip:       { bg: '#0ABFA3', fg: '#0A0F18', label: 'VIP' },
  community: { bg: '#60A5FA', fg: '#0A0F18', label: 'Community' },
};

function TierBadge({ tier, variant }) {
  const c = TIER_COLORS[tier] || TIER_COLORS.community;

  // V1 — Chevron tag (slanted parallelogram, hard angle)
  if (variant === 'chevron') {
    return (
      <div style={{
        position: 'absolute',
        bottom: -6,
        left: -2,
        background: c.bg,
        color: c.fg,
        padding: '4px 14px 4px 10px',
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{c.label}</div>
    );
  }

  // V2 — Vertical bar (floating beside the avatar, structural)
  if (variant === 'vbar') {
    return (
      <div style={{
        position: 'absolute',
        right: -14,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{
          width: 4, height: 60, background: c.bg,
        }}/>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: c.bg,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}>{c.label} member</div>
      </div>
    );
  }

  // V3 — Ribbon (drops from avatar bottom, classic medal feel)
  if (variant === 'ribbon') {
    return (
      <div style={{
        position: 'absolute',
        bottom: -10,
        left: '50%',
        transform: 'translateX(-50%)',
        background: c.bg,
        color: c.fg,
        padding: '4px 14px 6px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 0 rgba(0,0,0,0.25)',
      }}>{c.label}</div>
    );
  }

  // V4 — Bracketed inline (no overlap with avatar, sits below)
  if (variant === 'bracket') {
    return (
      <div style={{
        position: 'absolute',
        bottom: -28,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: c.bg,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ width: 12, height: 1, background: c.bg }}/>
        <span style={{ color: '#fff' }}>{c.label}</span>
        <span style={{ width: 12, height: 1, background: c.bg }}/>
      </div>
    );
  }

  // V5 — Outline ring with corner cap (brand-coherent, no fill)
  if (variant === 'outline') {
    return (
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: -8,
        border: `1.5px solid ${c.bg}`,
        background: 'rgba(10,15,24,0.85)',
        color: c.bg,
        padding: '3px 10px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{c.label}</div>
    );
  }

  // V6 — Default: clean rectangular flag, no star/emoji, sharp corners
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: -6,
      background: c.bg,
      color: c.fg,
      padding: '4px 10px',
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 800,
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      borderLeft: '3px solid rgba(10,15,24,0.4)',
    }}>{c.label}</div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Pillar acquisition strip — six EVOLVED Architecture pillars
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_PILLARS = [
  { key: 'foundation',       num: 1, label: 'Foundation',     short: 'Foundtn.', color: '#D4862B' },
  { key: 'identity',         num: 2, label: 'Identity',       short: 'Identity', color: '#A86CFF' },
  { key: 'mental-toughness', num: 3, label: 'Mental Toughness', short: 'Mental', color: '#ef0e30' },
  { key: 'strategy',         num: 4, label: 'Strategy',       short: 'Strategy', color: '#3FB8E8' },
  { key: 'accountability',   num: 5, label: 'Accountability', short: 'Account.', color: '#E8B547' },
  { key: 'execution',        num: 6, label: 'Execution',      short: 'Exec.',    color: '#19C9A6' },
];

function PillarBadge({ pillar, size = 36 }) {
  const { earned, color, num, short, progress = 0 } = pillar;
  const radius = size / 2;
  const stroke = 2.5;
  const innerR = radius - stroke;
  const circ = 2 * Math.PI * innerR;
  const dash = (progress / 100) * circ;

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: size + 14,
    }}>
      <div style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: earned
          ? `radial-gradient(circle at 35% 30%, ${color}, ${color}aa 70%, ${color}55)`
          : 'rgba(10,15,24,0.4)',
        border: earned
          ? `2px solid ${color}`
          : '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: earned
          ? `0 0 12px ${color}66, inset 0 0 8px rgba(255,255,255,0.18)`
          : 'inset 0 0 4px rgba(0,0,0,0.4)',
        transition: 'all 200ms ease',
      }}>
        {/* Progress ring for unearned */}
        {!earned && progress > 0 && (
          <svg
            style={{ position: 'absolute', inset: -1.5, transform: 'rotate(-90deg)' }}
            width={size + 3} height={size + 3} viewBox={`0 0 ${size + 3} ${size + 3}`}>
            <circle
              cx={(size + 3) / 2} cy={(size + 3) / 2} r={innerR + 1}
              fill="none" stroke={color} strokeOpacity="0.85"
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
        )}

        {/* Number — pillar identity */}
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: Math.round(size * 0.5),
          letterSpacing: '0.02em',
          color: earned ? '#0A0F18' : 'rgba(255,255,255,0.45)',
          textShadow: earned ? '0 1px 0 rgba(255,255,255,0.3)' : 'none',
          lineHeight: 1,
        }}>{num}</span>

        {/* Animated sparkle for earned */}
        {earned && (
          <>
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 6, height: 6, borderRadius: '50%',
              background: '#fff',
              boxShadow: `0 0 6px #fff, 0 0 10px ${color}`,
              animation: 'pillarSparkle 2.4s ease-in-out infinite',
            }}/>
            <span style={{
              position: 'absolute', bottom: 1, left: 0,
              width: 4, height: 4, borderRadius: '50%',
              background: '#fff',
              boxShadow: `0 0 4px ${color}`,
              animation: 'pillarSparkle 3.1s ease-in-out 0.6s infinite',
            }}/>
          </>
        )}
      </div>
      <span style={{
        marginTop: 5,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 8,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: earned ? color : 'rgba(255,255,255,0.4)',
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>{short}</span>
    </div>
  );
}

function PillarRow({ pillar }) {
  const { earned, color, num, short, progress = 0 } = pillar;
  const size = 18;
  const innerR = size / 2 - 1.5;
  const circ = 2 * Math.PI * innerR;
  const dash = (progress / 100) * circ;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%',
      minWidth: 96,
    }}>
      <div style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: earned
          ? `radial-gradient(circle at 35% 30%, ${color}, ${color}99)`
          : 'rgba(10,15,24,0.4)',
        border: earned ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.18)',
        boxShadow: earned ? `0 0 6px ${color}55` : 'none',
        flexShrink: 0,
      }}>
        {!earned && progress > 0 && (
          <svg style={{ position: 'absolute', inset: -1, transform: 'rotate(-90deg)' }}
            width={size + 2} height={size + 2}>
            <circle cx={(size + 2) / 2} cy={(size + 2) / 2} r={innerR + 0.5}
              fill="none" stroke={color} strokeOpacity="0.85"
              strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}/>
          </svg>
        )}
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 10,
          color: earned ? '#0A0F18' : 'rgba(255,255,255,0.4)',
          lineHeight: 1, fontWeight: 400,
        }}>{num}</span>
        {earned && (
          <span style={{
            position: 'absolute', top: -1, right: -1,
            width: 4, height: 4, borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 4px ${color}`,
            animation: `pillarSparkle ${2 + (num % 3) * 0.4}s ease-in-out ${num * 0.2}s infinite`,
          }}/>
        )}
      </div>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: earned ? 700 : 500, fontSize: 10,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: earned ? '#fff' : 'rgba(255,255,255,0.45)',
        flex: 1,
        whiteSpace: 'nowrap',
      }}>{short}</span>
    </div>
  );
}

// Inject sparkle keyframes once
if (typeof document !== 'undefined' && !document.getElementById('pillar-sparkle-kf')) {
  const style = document.createElement('style');
  style.id = 'pillar-sparkle-kf';
  style.textContent = `
    @keyframes pillarSparkle {
      0%,100% { opacity: 0.2; transform: scale(0.8); }
      50%     { opacity: 1; transform: scale(1.3); }
    }
    @keyframes earnedPulse {
      0%,100% { opacity: 0.85; }
      50%     { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ──────────────────────────────────────────────────────────────────────
// WelcomeBanner — preserves API
//   { displayName, tier, avatarUrl, quote, unreadPostCount, upcomingEventCount }
// ──────────────────────────────────────────────────────────────────────

const GREETING_BY_PERIOD = {
  'early-morning': 'Early start, ',
  'mid-morning':   'Good morning, ',
  'midday':        'Good afternoon, ',
  'early-evening': 'Good evening, ',
  'evening':       'Good evening, ',
  'night':         'Burning the midnight oil, ',
};

function WelcomeBanner({
  displayName,
  tier,
  avatarUrl,
  quote,
  // Scoreboard counts (additive — preserves existing API; old props remain):
  unreadPostCount = 0,
  upcomingEventCount = 0,
  newPodcastCount = 0,
  newStoryCount = 0,
  // Pillar acquisition strip — array of {key, label, color, earned, earnedAt, progress}
  // earned = boolean; earnedAt = ISO date if earned; progress = 0-100 if not earned
  pillars = DEFAULT_PILLARS,
  // mock-only:
  period = 'evening',
  badgeVariant = 'chevron',
  now: nowProp,
}) {
  const greet = GREETING_BY_PERIOD[period] ?? 'Good evening, ';

  // Live clock — ticks every minute (avoids re-render churn at second granularity)
  const [now, setNow] = React.useState(() => nowProp ?? new Date());
  React.useEffect(() => {
    if (nowProp) { setNow(nowProp); return; }
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, [nowProp]);

  // Year countdown — days remaining
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd   = new Date(now.getFullYear() + 1, 0, 1);
  const totalMs   = yearEnd - yearStart;
  const elapsedMs = now - yearStart;
  const yearPct   = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  const daysLeft  = Math.ceil((yearEnd - now) / 86400000);
  const quarter   = Math.floor(now.getMonth() / 3) + 1;

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Most-recent acquisition (within 7 days) → callout
  const recentEarn = React.useMemo(() => {
    const earned = pillars.filter(p => p.earned && p.earnedAt);
    if (!earned.length) return null;
    const sorted = [...earned].sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
    const newest = sorted[0];
    const ageDays = (now - new Date(newest.earnedAt)) / 86400000;
    return ageDays < 7 ? newest : null;
  }, [pillars, now]);

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      minHeight: 260,
      background: '#0A0F18',
    }}>
      <MarvelSkyScene period={period} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 36px 24px',
        minHeight: 260,
      }}>
        {/* Top row: avatar + greeting + quote */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
          {/* Avatar with rethought tier badge */}
          <div style={{ position: 'relative', flexShrink: 0, marginBottom: badgeVariant === 'bracket' ? 24 : 0 }}>
            {avatarUrl ? (
              <div style={{
                width: 128, height: 128, borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.18), 0 0 0 5px rgba(0,0,0,0.4)',
              }}>
                <img src={avatarUrl} alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              </div>
            ) : (
              <div style={{
                width: 128, height: 128, borderRadius: '50%',
                background: '#ef0e30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.18), 0 0 0 5px rgba(0,0,0,0.4)',
              }}>
                <span style={{
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 900,
                  fontSize: 56,
                  color: '#fff',
                  letterSpacing: '0.02em',
                }}>{displayName?.[0]?.toUpperCase() ?? '?'}</span>
              </div>
            )}
            {tier && <TierBadge tier={tier} variant={badgeVariant} />}
          </div>

          {/* Greeting + quote */}
          <div style={{ flex: 1, paddingTop: 4, minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700,
              fontSize: 38,
              lineHeight: 1.1,
              color: '#fff',
              letterSpacing: '-0.01em',
            }}>{greet}{displayName}.</h1>
            {quote && (
              <div style={{ marginTop: 12, maxWidth: 560 }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.82)',
                }}>"{quote.quote_text}"</p>
                {quote.source && (
                  <p style={{
                    margin: '4px 0 0',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#C9A84C',
                  }}>— Evolved · {quote.source}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent acquisition callout — fires when newest earn < 7 days */}
        {recentEarn && (
          <a href="/profile/me/badges" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            alignSelf: 'flex-start',
            marginTop: 14,
            padding: '6px 14px 6px 8px',
            background: `${recentEarn.color}1F`,
            border: `1px solid ${recentEarn.color}66`,
            textDecoration: 'none',
            animation: 'earnedPulse 2.6s ease-in-out infinite',
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${recentEarn.color}, ${recentEarn.color}aa)`,
              border: `1.5px solid ${recentEarn.color}`,
              boxShadow: `0 0 10px ${recentEarn.color}99`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 12,
              color: '#0A0F18', flexShrink: 0,
            }}>{recentEarn.num}</span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600, fontSize: 11,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ color: recentEarn.color, fontWeight: 800 }}>Just earned</span>
              {' · '}
              {recentEarn.label}
            </span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 9,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: recentEarn.color,
              borderLeft: `1px solid ${recentEarn.color}55`,
              paddingLeft: 10,
            }}>View →</span>
          </a>
        )}

        {/* Bottom row: date · time · year countdown  +  scoreboard */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 28,
          gap: 24,
          flexWrap: 'wrap',
        }}>
          {/* Left: date · time · year countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.92)',
              whiteSpace: 'nowrap',
            }}>{dateStr}</span>
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.18)', margin: '0 4px', flexShrink: 0 }}/>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600, fontSize: 12,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>{timeStr}</span>
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.18)', margin: '0 4px', flexShrink: 0 }}/>

            {/* Year countdown — number + tiny progress bar */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '4px 10px',
              border: '1px solid rgba(201,168,76,0.35)',
              background: 'rgba(201,168,76,0.08)',
            }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 11,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#C9A84C',
                whiteSpace: 'nowrap',
              }}>Q{quarter} · {now.getFullYear()}</span>
              <span style={{
                width: 64, height: 4, background: 'rgba(255,255,255,0.1)',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${yearPct}%`, background: '#C9A84C',
                }}/>
              </span>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 11,
                letterSpacing: '0.06em',
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>{daysLeft}d left</span>
            </div>
          </div>

          {/* Right: scoreboard + vertical pillar column */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            {/* Scoreboard column (label + 4-cell row) */}
            <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {/* "This week" framing label */}
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 9,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 6,
              paddingRight: 2,
            }}>This week</span>
            <div style={{
            display: 'inline-flex',
            alignItems: 'stretch',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(10,15,24,0.55)',
            backdropFilter: 'blur(6px)',
          }}>
            <ScoreCell
              href="/community"
              label="Posts"
              value={unreadPostCount}
              accent="#A78BFA"
            />
            <ScoreCell
              href="/events"
              label="Events"
              value={upcomingEventCount}
              accent="#0ABFA3"
            />
            <ScoreCell
              href="/podcast"
              label="Podcast"
              value={newPodcastCount}
              accent="#60A5FA"
            />
            <ScoreCell
              href="/media"
              label="Stories"
              value={newStoryCount}
              accent="#C9A84C"
              last
            />
            </div>
            </div>

            {/* Vertical pillar column */}
            <div style={{
              display: 'inline-flex', flexDirection: 'column',
              alignItems: 'stretch',
            }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 9,
                letterSpacing: '0.32em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 6,
                paddingLeft: 2,
                whiteSpace: 'nowrap',
              }}>The Architecture</span>
              <a href="/academy" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4,
                padding: '8px 8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(10,15,24,0.55)',
                backdropFilter: 'blur(6px)',
                textDecoration: 'none',
              }}>
                {pillars.map((p) => (
                  <PillarRow key={p.key} pillar={p}/>
                ))}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCell({ href, label, value, accent, last }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 20px',
        minWidth: 84,
        textDecoration: 'none',
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.08)',
        background: hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 120ms ease',
      }}>
      {/* Accent top-bar — appears on hover, pinned for active counts */}
      <span style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 2,
        background: accent,
        opacity: value > 0 ? 1 : (hover ? 0.5 : 0),
        transition: 'opacity 120ms ease',
      }}/>
      <span style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 22,
        letterSpacing: '0.04em',
        color: value > 0 ? '#fff' : 'rgba(255,255,255,0.45)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      <span style={{
        marginTop: 4,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 600, fontSize: 10,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: value > 0 ? accent : 'rgba(255,255,255,0.45)',
      }}>{label}</span>
    </a>
  );
}

window.WelcomeBanner = WelcomeBanner;
