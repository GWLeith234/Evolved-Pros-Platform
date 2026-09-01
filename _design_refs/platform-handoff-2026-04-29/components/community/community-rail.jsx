/* global React */
const { useState } = React;

// ──────────────────────────────────────────────────────────────────────
// COMMUNITY SIDE RAIL — sticky right column
// Leaderboard · Online now · Trending pillars · Sticky ad
// ──────────────────────────────────────────────────────────────────────

const LEADERBOARD = [
  { rank: 1, name: 'Marcus Chen',  initials: 'MC', tier: 'vip', points: 4280, delta: '+340', pillar: '#3FB8E8' },
  { rank: 2, name: 'Renée Dubois', initials: 'RD', tier: 'pro', points: 3915, delta: '+210', pillar: '#A86CFF' },
  { rank: 3, name: 'Amara Okafor', initials: 'AO', tier: 'pro', points: 3702, delta: '+180', pillar: '#19C9A6' },
  { rank: 4, name: 'You',          initials: 'GL', tier: 'pro', points: 3540, delta: '+260', pillar: '#E8B547', you: true },
  { rank: 5, name: 'Tariq Hill',   initials: 'TH', tier: 'pro', points: 3284, delta: '+95',  pillar: '#ef0e30' },
];

const ONLINE = [
  { name: 'George',  initials: 'GL', tier: 'pro' },
  { name: 'Marcus',  initials: 'MC', tier: 'vip' },
  { name: 'Renée',   initials: 'RD', tier: 'pro' },
  { name: 'Anna',    initials: 'AV', tier: 'vip' },
  { name: 'Lena',    initials: 'LP', tier: 'pro' },
  { name: 'Jordan',  initials: 'JR', tier: 'community' },
  { name: 'Priya',   initials: 'PS', tier: 'community' },
];

const TRENDING = [
  { tag: 'Discovery framework', pillar: '#3FB8E8', count: 47 },
  { tag: 'Morning audit',       pillar: '#D4862B', count: 34 },
  { tag: '90-day streak',       pillar: '#19C9A6', count: 28 },
  { tag: 'Pricing pushback',    pillar: '#E8B547', count: 19 },
];

const STICKY_AD = {
  name: 'Salesforce', accent: '#3FB8E8', wordmark: 'SALESFORCE',
  tagline: 'CRM that actually closes.',
  body: 'Pipeline, forecasting, and AI agents — built on the world\'s #1 sales platform.',
  cta: 'See it in action',
};

const SECOND_AD = {
  name: 'Loom', accent: '#A78BFA', wordmark: 'LOOM',
  tagline: 'Async videos that close deals.',
  body: 'Send a 90-second walkthrough instead of scheduling another meeting. Track every view.',
  cta: 'Record your first',
};

const TIER_GRAD_RAIL = {
  pro:       'linear-gradient(135deg, #C9A84C, #8b7332)',
  vip:       'linear-gradient(135deg, #ef0e30, #8b1820)',
  community: 'linear-gradient(135deg, #60A5FA, #3a73c8)',
};

function RailSection({ accent, eyebrow, title, action, children }) {
  return (
    <section style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderTop: `2px solid ${accent}`,
    }}>
      <header style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '12px 14px 8px',
      }}>
        <div>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 9,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: accent,
          }}>{eyebrow}</p>
          <h3 style={{
            margin: '2px 0 0',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 18, letterSpacing: '0.04em',
            color: 'var(--text-strong)', textTransform: 'uppercase',
          }}>{title}</h3>
        </div>
        {action && (
          <a href={action.href} style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 9,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--text-4)',
            textDecoration: 'none',
          }}>{action.label} →</a>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

function LeaderboardRail() {
  return (
    <RailSection accent="#C9A84C" eyebrow="This Week" title="Leaderboard" action={{ label: 'Full', href: '/leaderboard' }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {LEADERBOARD.map((r, i) => (
          <li key={r.rank} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderTop: i === 0 ? '1px solid var(--border-soft)' : '1px solid rgba(255,255,255,0.04)',
            background: r.you ? 'rgba(232,181,71,0.06)' : 'transparent',
          }}>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 18,
              color: r.rank <= 3 ? r.pillar : 'var(--text-6)',
              width: 18, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{r.rank}</span>
            <div style={{
              width: 26, height: 26, flexShrink: 0,
              borderRadius: '50%',
              background: TIER_GRAD_RAIL[r.tier],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 9,
              color: '#0A0F18',
            }}>{r.initials}</div>
            <span style={{
              flex: 1, minWidth: 0,
              fontFamily: 'Barlow, sans-serif', fontWeight: r.you ? 700 : 600, fontSize: 12,
              color: r.you ? '#E8B547' : 'var(--text-1)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{r.name}</span>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 14,
              color: 'var(--text-strong)', letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}>{r.points.toLocaleString()}</span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
              letterSpacing: '0.14em',
              color: '#19C9A6',
              minWidth: 36, textAlign: 'right',
            }}>↑{r.delta}</span>
          </li>
        ))}
      </ul>
    </RailSection>
  );
}

function OnlineRail() {
  return (
    <RailSection accent="#19C9A6" eyebrow="Right Now" title={`${ONLINE.length} Online`}>
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ONLINE.map(o => (
          <div key={o.name} title={o.name} style={{ position: 'relative' }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: TIER_GRAD_RAIL[o.tier],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10,
              color: '#0A0F18',
            }}>{o.initials}</div>
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 8, height: 8,
              background: '#19C9A6',
              border: '2px solid #111926',
              borderRadius: '50%',
            }}/>
          </div>
        ))}
      </div>
    </RailSection>
  );
}

function TrendingRail() {
  return (
    <RailSection accent="#A78BFA" eyebrow="What's Hot" title="Trending">
      <ul style={{ margin: 0, padding: '4px 0 10px', listStyle: 'none' }}>
        {TRENDING.map((t, i) => (
          <li key={t.tag} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px',
          }}>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 14,
              color: 'var(--text-6)',
              width: 18,
            }}>0{i+1}</span>
            <span style={{ width: 5, height: 5, background: t.pillar, flexShrink: 0 }}/>
            <span style={{
              flex: 1, minWidth: 0,
              fontFamily: 'Barlow, sans-serif', fontSize: 12.5, fontWeight: 600,
              color: 'var(--text-1)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{t.tag}</span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-5)',
            }}>{t.count} posts</span>
          </li>
        ))}
      </ul>
    </RailSection>
  );
}

function StickyAdRail({ ad }) {
  const [hover, setHover] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'block',
        padding: '14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${ad.accent}`,
        textDecoration: 'none', color: 'inherit',
        transition: 'border-color 160ms ease',
      }}>
      <span style={{
        position: 'absolute', top: 10, right: 10,
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
        letterSpacing: '0.32em', textTransform: 'uppercase',
        color: 'var(--text-dim)',
        padding: '2px 6px', border: '1px solid var(--border)',
      }}>Ad</span>
      <span style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.14em',
        color: ad.accent,
      }}>{ad.wordmark}</span>
      <p style={{
        margin: '6px 0',
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 15, lineHeight: 1.3, fontWeight: 700,
        color: 'var(--text-strong)',
      }}>{ad.tagline}</p>
      <p style={{
        margin: '0 0 10px',
        fontFamily: 'Barlow, sans-serif', fontSize: 12, lineHeight: 1.5,
        color: 'var(--text-soft)',
      }}>{ad.body}</p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 9,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: hover ? 'var(--bg-page)' : ad.accent,
        background: hover ? ad.accent : 'transparent',
        border: `1px solid ${ad.accent}`,
      }}>{ad.cta} →</span>
    </a>
  );
}

function CommunitySideRail() {
  return (
    <aside style={{
      position: 'sticky', top: 88,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <LeaderboardRail/>
      <StickyAdRail ad={SECOND_AD}/>
      <OnlineRail/>
      <TrendingRail/>
      <StickyAdRail ad={STICKY_AD}/>
    </aside>
  );
}

Object.assign(window, { CommunitySideRail });
