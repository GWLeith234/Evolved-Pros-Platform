/* global React */
const { useState } = React;

// ──────────────────────────────────────────────────────────────────────
// Below-fold tile cards — 4-up grid
// Each card: header + body + interactive footer (action inline)
// Daily ritual: Community → Stories → Podcast → Personal
// ──────────────────────────────────────────────────────────────────────

// Shared card chrome
function Card({ accent, eyebrow, title, count, href = '#', children, footer, dense = false }) {
  return (
    <article style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      background: '#111926',
      border: '1px solid rgba(255,255,255,0.06)',
      minHeight: dense ? 280 : 320,
      overflow: 'hidden',
    }}>
      {/* accent stripe top */}
      <span style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: accent,
      }}/>
      <header style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '16px 16px 12px',
        gap: 8,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 9,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: accent,
          }}>{eyebrow}</p>
          <h3 style={{
            margin: '4px 0 0',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 22, letterSpacing: '0.04em',
            color: '#fff',
            textTransform: 'uppercase',
          }}>{title}</h3>
        </div>
        {count != null && (
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            padding: '2px 8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            whiteSpace: 'nowrap',
          }}>{count}</span>
        )}
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {footer && (
        <footer style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>{footer}</footer>
      )}
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 1. COMMUNITY PULSE — top feed posts + event highlights w/ react/RSVP
// ──────────────────────────────────────────────────────────────────────
const COMMUNITY_DATA = {
  posts: [
    { id: 'p1', author: 'Marcus Chen',  initials: 'MC', tier: 'pro',  title: 'Closed a 6-figure deal using the Discovery framework — here\'s what worked',  reactions: 24, comments: 8,  pillar: 'strategy',     pillarColor: '#3FB8E8', age: '12m' },
    { id: 'p2', author: 'Amara Okafor', initials: 'AO', tier: 'vip',  title: 'Day 90 of the Discipline streak. The compounding is real.',  reactions: 47, comments: 14, pillar: 'accountability', pillarColor: '#E8B547', age: '2h' },
    { id: 'p3', author: 'Jordan Reeves',initials: 'JR', tier: 'pro',  title: 'Question: how do you handle pricing pushback from procurement?',  reactions: 9,  comments: 21, pillar: 'mental-toughness', pillarColor: '#ef0e30', age: '4h' },
  ],
  events: [
    { id: 'e1', title: 'Live with George — Q2 Strategy Sprint', date: 'Tomorrow', time: '11:00 AM PT', host: 'George Leith', rsvpd: false, going: 142 },
  ],
};

function CommunityPulseCard() {
  const [posts, setPosts] = useState(COMMUNITY_DATA.posts);
  const [event, setEvent] = useState(COMMUNITY_DATA.events[0]);

  const toggleReact = (id) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, reacted: !p.reacted, reactions: p.reactions + (p.reacted ? -1 : 1) }
      : p));
  };
  const toggleRsvp = () => {
    setEvent(e => ({ ...e, rsvpd: !e.rsvpd, going: e.going + (e.rsvpd ? -1 : 1) }));
  };

  return (
    <Card accent="#A78BFA" eyebrow="Community" title="Community Pulse" count="3 new">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Posts list */}
        <ul style={{ margin: 0, padding: '0 16px', listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
          {posts.map((p, i) => (
            <li key={p.id} style={{
              display: 'flex', gap: 10,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: 28, height: 28, flexShrink: 0,
                borderRadius: '50%',
                background: p.tier === 'pro' ? 'linear-gradient(135deg, #C9A84C, #8b7332)' : 'linear-gradient(135deg, #60A5FA, #3a73c8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 10,
                letterSpacing: '0.04em',
                color: '#0A0F18',
              }}>{p.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700, fontSize: 11,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.85)',
                  }}>{p.author}</span>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: p.pillarColor,
                  }}/>
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 600, fontSize: 9,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.4)',
                  }}>{p.age}</span>
                </div>
                <p style={{
                  margin: 0,
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: 12, lineHeight: 1.4,
                  color: 'rgba(255,255,255,0.78)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>{p.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                  <button type="button" onClick={() => toggleReact(p.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: 0, background: 'none', border: 'none',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.08em',
                      color: p.reacted ? '#ef0e30' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={p.reacted ? '#ef0e30' : 'none'}
                      stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {p.reactions}
                  </button>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {p.comments}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Inline event w/ RSVP */}
      <div style={{
        margin: '0 16px 0',
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, flexShrink: 0,
          textAlign: 'center',
          padding: '4px 0',
          background: 'rgba(167,139,250,0.12)',
          border: '1px solid rgba(167,139,250,0.3)',
        }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
            letterSpacing: '0.18em', color: '#A78BFA', textTransform: 'uppercase',
          }}>Live</div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 14,
            color: '#fff', lineHeight: 1,
          }}>Tmrw</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow, sans-serif', fontSize: 11.5,
            color: 'rgba(255,255,255,0.85)', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{event.title}</p>
          <p style={{
            margin: '2px 0 0',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}>{event.time} · {event.going} going</p>
        </div>
        <button type="button" onClick={toggleRsvp}
          style={{
            padding: '6px 12px',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            background: event.rsvpd ? '#A78BFA' : 'transparent',
            color: event.rsvpd ? '#0A0F18' : '#A78BFA',
            border: '1px solid #A78BFA',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            flexShrink: 0,
          }}>{event.rsvpd ? '✓ Going' : 'RSVP'}</button>
      </div>

      <a href="/community" style={{
        display: 'block', padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        textAlign: 'right',
      }}>All in Community →</a>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 2. TOP STORIES — Media surface, latest articles
// ──────────────────────────────────────────────────────────────────────
const STORIES = [
  { id: 's1', cat: 'Strategy',     title: 'The 5-call rule that doubled outbound conversion',          read: '6 min', saved: false, hot: true,  catColor: '#3FB8E8' },
  { id: 's2', cat: 'Identity',     title: 'Why high-performers schedule their identity, not their tasks', read: '4 min', saved: true,  hot: false, catColor: '#A86CFF' },
  { id: 's3', cat: 'Foundation',   title: 'The morning audit: 8 questions before 8 AM',                read: '3 min', saved: false, hot: false, catColor: '#D4862B' },
];

function TopStoriesCard() {
  const [stories, setStories] = useState(STORIES);
  const toggleSave = (id) => setStories(prev => prev.map(s => s.id === id ? { ...s, saved: !s.saved } : s));

  return (
    <Card accent="#C9A84C" eyebrow="Top Stories" title="Top Stories" count="Media">
      <ul style={{ margin: 0, padding: '4px 16px 0', listStyle: 'none' }}>
        {stories.map((s, i) => (
          <li key={s.id} style={{
            position: 'relative',
            padding: '12px 0',
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 28, flexShrink: 0,
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 22,
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.18)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>0{i+1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 9,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: s.catColor,
                }}>{s.cat}</span>
                {s.hot && (
                  <span style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800, fontSize: 8,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: '#0A0F18', background: '#ef0e30',
                    padding: '1px 6px',
                  }}>Hot</span>
                )}
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600, fontSize: 9,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                  marginLeft: 'auto',
                }}>{s.read}</span>
              </div>
              <p style={{
                margin: 0,
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 13, lineHeight: 1.35, fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
              }}>{s.title}</p>
              <button type="button" onClick={() => toggleSave(s.id)}
                style={{
                  marginTop: 6,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: 0, background: 'none', border: 'none',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: s.saved ? '#C9A84C' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                }}>
                <svg width="10" height="11" viewBox="0 0 24 24" fill={s.saved ? '#C9A84C' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                {s.saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <a href="/media" style={{
        display: 'block', marginTop: 'auto',
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        textAlign: 'right',
      }}>All Stories →</a>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 3. PODCAST REEL — latest episodes, inline play
// ──────────────────────────────────────────────────────────────────────
const EPISODES = [
  { id: 'ep1', num: 142, title: 'Selling in chaos with Anna Voss',     guest: 'Anna Voss',     role: 'CRO, Forge Inc.',     duration: '52m', accent: '#3FB8E8', new: true },
  { id: 'ep2', num: 141, title: 'The discipline of saying no',         guest: 'Tariq Hill',    role: 'Author',              duration: '38m', accent: '#A86CFF', new: false },
  { id: 'ep3', num: 140, title: 'Why your pipeline is lying to you',   guest: 'Renée Dubois',  role: 'VP Sales, Mercer',    duration: '47m', accent: '#19C9A6', new: false },
];

function PodcastReelCard() {
  const [playing, setPlaying] = useState(null);
  return (
    <Card accent="#3FB8E8" eyebrow="Podcast" title="Latest Drops" count="Ep 142">
      <ul style={{ margin: 0, padding: '4px 16px 0', listStyle: 'none' }}>
        {EPISODES.map((ep, i) => {
          const isPlaying = playing === ep.id;
          return (
            <li key={ep.id} style={{
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Square cover */}
              <div style={{
                position: 'relative',
                width: 44, height: 44, flexShrink: 0,
                background: `linear-gradient(135deg, ${ep.accent}33, ${ep.accent}11)`,
                border: `1px solid ${ep.accent}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 18,
                  letterSpacing: '0.04em',
                  color: ep.accent,
                  fontVariantNumeric: 'tabular-nums',
                }}>{ep.num}</span>
                {ep.new && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef0e30', color: '#fff',
                    fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 7,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    padding: '1px 4px',
                  }}>New</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'Barlow, sans-serif', fontSize: 12.5, fontWeight: 600,
                  color: 'rgba(255,255,255,0.92)', lineHeight: 1.3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{ep.title}</p>
                <p style={{
                  margin: '3px 0 0',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600, fontSize: 9,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{ep.guest} <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {ep.role} · {ep.duration}</span></p>
              </div>
              <button type="button" onClick={() => setPlaying(isPlaying ? null : ep.id)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPlaying ? ep.accent : 'transparent',
                  color: isPlaying ? '#0A0F18' : ep.accent,
                  border: `1px solid ${ep.accent}`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 120ms ease',
                }}>
                {isPlaying ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8"/><rect x="7" y="2" width="3" height="8"/></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z"/></svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <a href="/podcast" style={{
        display: 'block', marginTop: 'auto',
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        textAlign: 'right',
      }}>All Episodes →</a>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
// 4. DAILY PULSE — habits + commitments + personal scoreboard
// ──────────────────────────────────────────────────────────────────────
const HABITS = [
  { id: 'h1', label: 'Morning audit',     pillar: '#D4862B', streak: 12, done: true },
  { id: 'h2', label: '90-min deep work',  pillar: '#3FB8E8', streak: 34, done: true },
  { id: 'h3', label: 'Pipeline review',   pillar: '#19C9A6', streak: 8,  done: false },
];
const COMMITMENTS = [
  { id: 'c1', text: 'Send Discovery deck to 3 prospects',  due: 'Today', done: false },
  { id: 'c2', text: 'Block Friday for Q3 planning',        due: 'Today', done: true },
];

function DailyPulseCard() {
  const [habits, setHabits] = useState(HABITS);
  const [commits, setCommits] = useState(COMMITMENTS);

  const toggleHabit = (id) => setHabits(p => p.map(h => h.id === id ? { ...h, done: !h.done } : h));
  const toggleCommit = (id) => setCommits(p => p.map(c => c.id === id ? { ...c, done: !c.done } : c));

  const habitsDone = habits.filter(h => h.done).length;
  const commitsDone = commits.filter(c => c.done).length;
  const totalDone  = habitsDone + commitsDone;
  const totalAll   = habits.length + commits.length;
  const pct = Math.round((totalDone / totalAll) * 100);

  return (
    <Card accent="#19C9A6" eyebrow="Today" title="Daily Pulse" count={`${totalDone}/${totalAll}`}>
      {/* Big progress ring + scoreboard */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '8px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <DailyRing pct={pct}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600, fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}>{pct === 100 ? 'Day complete' : `${totalAll - totalDone} to go`}</p>
          <p style={{
            margin: 0,
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 18,
            color: '#fff', letterSpacing: '0.04em',
          }}>{habitsDone}/{habits.length} habits · {commitsDone}/{commits.length} commits</p>
        </div>
      </div>

      {/* Habits */}
      <div style={{ padding: '8px 16px 0' }}>
        <p style={{
          margin: '0 0 6px',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}>Habits</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {habits.map(h => (
            <li key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckBox checked={h.done} accent={h.pillar} onClick={() => toggleHabit(h.id)}/>
              <span style={{
                flex: 1,
                fontFamily: 'Barlow, sans-serif', fontSize: 12,
                color: h.done ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.85)',
                textDecoration: h.done ? 'line-through' : 'none',
              }}>{h.label}</span>
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 9,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: h.pillar,
              }}>🔥 {h.streak}d</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Commitments */}
      <div style={{ padding: '8px 16px 12px' }}>
        <p style={{
          margin: '0 0 6px',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}>Commitments</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {commits.map(c => (
            <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckBox checked={c.done} accent="#19C9A6" onClick={() => toggleCommit(c.id)}/>
              <span style={{
                flex: 1,
                fontFamily: 'Barlow, sans-serif', fontSize: 12,
                color: c.done ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.85)',
                textDecoration: c.done ? 'line-through' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{c.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function CheckBox({ checked, accent, onClick }) {
  return (
    <button type="button" onClick={onClick}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
      style={{
        width: 18, height: 18,
        background: checked ? accent : 'transparent',
        border: `1.5px solid ${checked ? accent : 'rgba(255,255,255,0.25)'}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 120ms ease',
      }}>
      {checked && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#0A0F18" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6 L5 8.5 L9.5 3.5"/>
        </svg>
      )}
    </button>
  );
}

function DailyRing({ pct }) {
  const r = 26, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#19C9A6" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 280ms ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', lineHeight: 1,
      }}>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
          color: '#fff', letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>{pct}</span>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
          letterSpacing: '0.2em', color: '#19C9A6',
        }}>%</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  CommunityPulseCard,
  TopStoriesCard,
  PodcastReelCard,
  DailyPulseCard,
});
