/* global React */
const { useState } = React;

// ──────────────────────────────────────────────────────────────────────
// SPONSOR RAIL — clearly-labeled ad zone, 2 layouts
// ──────────────────────────────────────────────────────────────────────

const SPONSORS = [
  {
    id: 'sp1',
    name: 'Outreach',
    tagline: 'Sales execution. Without the chaos.',
    cta: 'Try free for 30 days',
    accent: '#3FB8E8',
    logoText: 'OUTREACH',
    body: 'The platform top performers use to forecast, coach and close — built for revenue teams who refuse to coast.',
  },
  {
    id: 'sp2',
    name: 'Notion',
    tagline: 'Where teams build clarity.',
    cta: 'Start your workspace',
    accent: '#E8B547',
    logoText: 'NOTION',
    body: 'One workspace for docs, projects, and knowledge. Replace 5 tools with one source of truth.',
  },
  {
    id: 'sp3',
    name: 'Calendly',
    tagline: 'Scheduling, automated.',
    cta: 'Get started — free',
    accent: '#A78BFA',
    logoText: 'CALENDLY',
    body: 'Stop the back-and-forth. Let prospects book directly into your priority blocks.',
  },
];

function SponsorRail({ layout = 'duo' }) {
  // layout: 'duo' | 'wide' | 'trio'
  const items =
    layout === 'wide' ? [SPONSORS[0]] :
    layout === 'trio' ? SPONSORS :
                        SPONSORS.slice(0, 2);

  const cols =
    layout === 'wide' ? '1fr' :
    layout === 'trio' ? 'repeat(3, 1fr)' :
                        'repeat(2, 1fr)';

  return (
    <section aria-label="Sponsored" style={{ marginTop: 40 }}>
      {/* Eyebrow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.42em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.42)',
          padding: '3px 8px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>Sponsored</span>
        <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600, fontSize: 9,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>Partners hand-picked by George</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>
        {items.map(s => <SponsorCard key={s.id} sponsor={s} wide={layout === 'wide'}/>)}
      </div>
    </section>
  );
}

function SponsorCard({ sponsor, wide }) {
  const [hover, setHover] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start',
        gap: wide ? 24 : 0,
        padding: wide ? '20px 24px' : '20px 20px 18px',
        background: '#111926',
        border: '1px solid rgba(255,255,255,0.06)',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        transition: 'border-color 160ms ease, background 160ms ease',
        borderColor: hover ? `${sponsor.accent}55` : 'rgba(255,255,255,0.06)',
        minHeight: wide ? 96 : 160,
      }}>
      {/* accent stripe */}
      <span style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
        background: sponsor.accent,
      }}/>
      {/* corner sparkle on hover */}
      <span style={{
        position: 'absolute', top: 0, right: 0,
        width: hover ? 80 : 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${sponsor.accent})`,
        transition: 'width 220ms ease',
      }}/>

      {/* Logo lockup */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: wide ? 0 : 14,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36,
          background: `${sponsor.accent}1a`,
          border: `1px solid ${sponsor.accent}55`,
          color: sponsor.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 18, letterSpacing: '0.04em',
        }}>{sponsor.name[0]}</div>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 18, letterSpacing: '0.14em',
          color: '#fff',
        }}>{sponsor.logoText}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: wide ? 18 : 16, lineHeight: 1.3, fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
        }}>{sponsor.tagline}</p>
        <p style={{
          margin: '6px 0 0',
          fontFamily: 'Barlow, sans-serif', fontSize: 12.5, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.55)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{sponsor.body}</p>
      </div>

      <div style={{
        marginTop: wide ? 0 : 14,
        marginLeft: wide ? 'auto' : 0,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800, fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: hover ? '#0A0F18' : sponsor.accent,
        background: hover ? sponsor.accent : 'transparent',
        border: `1px solid ${sponsor.accent}`,
        transition: 'all 160ms ease',
        flexShrink: 0,
      }}>
        {sponsor.cta}
        <span style={{ display: 'inline-block', transform: hover ? 'translateX(2px)' : 'none', transition: 'transform 160ms ease' }}>→</span>
      </div>
    </a>
  );
}

Object.assign(window, { SponsorRail });
