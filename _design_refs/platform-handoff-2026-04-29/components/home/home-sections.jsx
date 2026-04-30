/* global React */
const { useState } = React;

// ──────────────────────────────────────────────────────────────────────
// BELOW-TILES SECTIONS — Activity / Events / Academy / Goals
// 12-col grid layout: Recent Activity (8) + Upcoming Events (4)
//                     Your Academy   (8) + Goals & Commits (4)
// ──────────────────────────────────────────────────────────────────────

function SectionHeader({ accent, eyebrow, title, action }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 0 14px',
      marginBottom: 14,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div>
        <p style={{
          margin: 0,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: accent,
        }}>{eyebrow}</p>
        <h2 style={{
          margin: '4px 0 0',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 28, letterSpacing: '0.04em',
          color: '#fff',
          textTransform: 'uppercase',
        }}>{title}</h2>
      </div>
      {action && (
        <a href={action.href} style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 11,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
        }}>{action.label} →</a>
      )}
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────
// RECENT ACTIVITY — timeline of community + system events
// ──────────────────────────────────────────────────────────────────────
const ACTIVITY = [
  { id: 'a1', kind: 'unlock',    actor: 'You',          target: 'Strategy', body: 'Completed Module 4 — pillar earned.',   pillar: '#3FB8E8', when: '2h ago', icon: 'trophy' },
  { id: 'a2', kind: 'comment',   actor: 'Marcus Chen',  target: 'your post',body: '"This framework saved my Q1. Thank you."', pillar: '#A86CFF', when: '4h ago', icon: 'comment' },
  { id: 'a3', kind: 'mention',   actor: 'Renée Dubois', target: 'a thread', body: '"@george — your discovery script is gold."',   pillar: '#E8B547', when: '6h ago', icon: 'at' },
  { id: 'a4', kind: 'live',      actor: 'George',       target: 'goes live',body: 'Live with George — Q2 Strategy starts in 18h',pillar: '#ef0e30', when: '1d ago', icon: 'live' },
  { id: 'a5', kind: 'streak',    actor: 'You',          target: '34-day streak',body: 'Deep work block — keep the chain alive.', pillar: '#19C9A6', when: '1d ago', icon: 'flame' },
];

const ICON = {
  trophy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 4h12v6a6 6 0 0 1-12 0V4zM12 16v4M8 22h8"/></svg>,
  comment: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  at: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
  live: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/></svg>,
  flame: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
};

function RecentActivity() {
  return (
    <section>
      <SectionHeader accent="#C9A84C" eyebrow="Live Feed" title="Recent Activity"
        action={{ label: 'All', href: '/activity' }}/>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
        {ACTIVITY.map((a, i) => (
          <li key={a.id} style={{
            position: 'relative',
            display: 'flex', gap: 16,
            padding: '14px 0',
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* timeline rail */}
            {i < ACTIVITY.length - 1 && (
              <span style={{
                position: 'absolute',
                left: 17, top: 38, bottom: -14,
                width: 1, background: 'rgba(255,255,255,0.06)',
              }}/>
            )}
            <div style={{
              width: 34, height: 34, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${a.pillar}1a`,
              border: `1px solid ${a.pillar}55`,
              color: a.pillar,
            }}>{ICON[a.icon]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13,
                  color: 'rgba(255,255,255,0.95)',
                }}>{a.actor}</span>
                <span style={{
                  fontFamily: 'Barlow, sans-serif', fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                }}>· {a.target}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600, fontSize: 10,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}>{a.when}</span>
              </div>
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'Barlow, sans-serif', fontSize: 13.5, lineHeight: 1.5,
                color: 'rgba(255,255,255,0.75)',
              }}>{a.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// UPCOMING EVENTS — list w/ RSVP + countdown
// ──────────────────────────────────────────────────────────────────────
const EVENTS_INIT = [
  { id: 'ev1', title: 'Live with George — Q2 Strategy', host: 'George Leith', when: 'Tomorrow · 11:00 AM PT', countdown: '18h', rsvpd: false, going: 142, kind: 'live',     accent: '#ef0e30' },
  { id: 'ev2', title: 'AMA: Renée Dubois on pipeline',  host: 'Renée Dubois', when: 'Thu · 2:00 PM PT',        countdown: '3d',  rsvpd: true,  going: 87,  kind: 'ama',      accent: '#A86CFF' },
  { id: 'ev3', title: 'Roundtable: VIP cohort only',     host: 'George Leith',when: 'Sat · 9:00 AM PT',         countdown: '5d',  rsvpd: false, going: 32,  kind: 'vip',      accent: '#C9A84C' },
];

function UpcomingEvents() {
  const [events, setEvents] = useState(EVENTS_INIT);
  const toggle = (id) => setEvents(p => p.map(e => e.id === id
    ? { ...e, rsvpd: !e.rsvpd, going: e.going + (e.rsvpd ? -1 : 1) }
    : e));
  return (
    <section>
      <SectionHeader accent="#A78BFA" eyebrow="What's Next" title="Upcoming"
        action={{ label: 'Calendar', href: '/events' }}/>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map(e => (
          <li key={e.id} style={{
            background: '#111926',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: `2px solid ${e.accent}`,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 9,
                letterSpacing: '0.24em', textTransform: 'uppercase',
                color: e.accent,
              }}>{e.kind === 'live' ? '● Live' : e.kind === 'vip' ? 'VIP Only' : 'AMA'}</span>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 18,
                color: '#fff', letterSpacing: '0.04em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>{e.countdown}</span>
            </div>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow, sans-serif', fontSize: 13.5, fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
            }}>{e.title}</p>
            <p style={{
              margin: '4px 0 10px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600, fontSize: 10,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
            }}>{e.when} · {e.going} going</p>
            <button type="button" onClick={() => toggle(e.id)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 10,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                background: e.rsvpd ? e.accent : 'transparent',
                color: e.rsvpd ? '#0A0F18' : e.accent,
                border: `1px solid ${e.accent}`,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}>{e.rsvpd ? '✓ Going' : 'RSVP'}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// YOUR ACADEMY — continue learning
// ──────────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'm1', num: 4, name: 'Strategy',     desc: 'Build a 90-day go-to-market plan.',    progress: 100, status: 'done',     pillar: '#3FB8E8', lessons: '8 / 8'  },
  { id: 'm2', num: 5, name: 'Accountability',desc: 'The 5 systems of personal mastery.',  progress: 35,  status: 'active',   pillar: '#E8B547', lessons: '3 / 8' },
  { id: 'm3', num: 6, name: 'Execution',    desc: 'Translate plans into shipped results.', progress: 0,  status: 'locked',  pillar: '#19C9A6', lessons: '0 / 10' },
];

function YourAcademy() {
  return (
    <section>
      <SectionHeader accent="#3FB8E8" eyebrow="Your Path" title="The Academy"
        action={{ label: 'Curriculum', href: '/academy' }}/>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
      }}>
        {MODULES.map(m => (
          <article key={m.id} style={{
            position: 'relative',
            background: '#111926',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 16px 14px',
            opacity: m.status === 'locked' ? 0.55 : 1,
            display: 'flex', flexDirection: 'column',
            minHeight: 200,
          }}>
            {/* pillar number */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: 10,
            }}>
              <div style={{
                width: 38, height: 38,
                background: `${m.pillar}1a`,
                border: `1px solid ${m.pillar}66`,
                color: m.pillar,
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
                letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{m.num}</div>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
                letterSpacing: '0.24em', textTransform: 'uppercase',
                color: m.status === 'done' ? '#19C9A6' : m.status === 'active' ? m.pillar : 'rgba(255,255,255,0.35)',
                padding: '2px 6px',
                border: `1px solid ${m.status === 'done' ? '#19C9A6' : m.status === 'active' ? m.pillar : 'rgba(255,255,255,0.15)'}55`,
              }}>{m.status === 'done' ? '✓ Done' : m.status === 'active' ? 'In Progress' : '🔒 Locked'}</span>
            </div>
            <h3 style={{
              margin: 0,
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: '#fff',
            }}>{m.name}</h3>
            <p style={{
              margin: '4px 0 12px',
              fontFamily: 'Barlow, sans-serif', fontSize: 12.5,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.4,
              flex: 1,
            }}>{m.desc}</p>
            {/* progress */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}>{m.lessons}</span>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 14,
                color: m.pillar, letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>{m.progress}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                width: `${m.progress}%`, height: '100%',
                background: m.pillar,
                transition: 'width 280ms ease',
              }}/>
            </div>
            <button type="button" style={{
              marginTop: 12,
              width: '100%', padding: '8px 10px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              background: m.status === 'active' ? m.pillar : 'transparent',
              color: m.status === 'active' ? '#0A0F18' : m.status === 'locked' ? 'rgba(255,255,255,0.35)' : m.pillar,
              border: `1px solid ${m.status === 'locked' ? 'rgba(255,255,255,0.15)' : m.pillar}`,
              cursor: m.status === 'locked' ? 'not-allowed' : 'pointer',
            }}>{m.status === 'done' ? 'Review' : m.status === 'active' ? 'Continue' : 'Locked'}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// GOALS & WEEKLY — quarterly goals + weekly commitments roll-up
// ──────────────────────────────────────────────────────────────────────
const GOALS_INIT = [
  { id: 'g1', label: 'Close $250K in new pipeline',         pillar: '#3FB8E8', progress: 64, target: 'Q2',  delta: '+12% wk' },
  { id: 'g2', label: 'Earn the Accountability pillar',      pillar: '#E8B547', progress: 35, target: 'May', delta: '+8%' },
  { id: 'g3', label: '60-day deep-work streak',             pillar: '#19C9A6', progress: 57, target: 'Jun', delta: 'Day 34' },
];

function GoalsCard() {
  return (
    <section>
      <SectionHeader accent="#19C9A6" eyebrow="The Long Game" title="Quarterly Goals"
        action={{ label: 'Edit', href: '/goals' }}/>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GOALS_INIT.map(g => (
          <li key={g.id} style={{
            background: '#111926',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <p style={{
                margin: 0,
                fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.95)', lineHeight: 1.3,
              }}>{g.label}</p>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                whiteSpace: 'nowrap',
              }}>{g.target}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 8, marginBottom: 6,
            }}>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 18,
                color: g.pillar, letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>{g.progress}%</span>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#19C9A6',
              }}>↑ {g.delta}</span>
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                width: `${g.progress}%`, height: '100%',
                background: g.pillar,
                transition: 'width 280ms ease',
              }}/>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

Object.assign(window, {
  RecentActivity, UpcomingEvents, YourAcademy, GoalsCard,
});
