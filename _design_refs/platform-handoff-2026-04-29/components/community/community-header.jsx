/* global React */
const { useState, useMemo } = React;

// ──────────────────────────────────────────────────────────────────────
// COMMUNITY PAGE — full redesign, matches Home aesthetic
// Single page with: header + composer + filter rail + feed + side rail
// Ads layered every 3 posts, mix of inline + ribbon + feature
// ──────────────────────────────────────────────────────────────────────

const PILLARS = [
  { key: 'foundation',       label: 'Foundation',       color: '#D4862B' },
  { key: 'identity',         label: 'Identity',         color: '#A86CFF' },
  { key: 'mental-toughness', label: 'Mental',           color: '#ef0e30' },
  { key: 'strategy',         label: 'Strategy',         color: '#3FB8E8' },
  { key: 'accountability',   label: 'Accountability',   color: '#E8B547' },
  { key: 'execution',        label: 'Execution',        color: '#19C9A6' },
];

const KIND_OPTIONS = [
  { key: 'all',       label: 'All' },
  { key: 'following', label: 'Following' },
  { key: 'top-week',  label: 'Top this week' },
  { key: 'wins',      label: '🏆 Wins' },
  { key: 'questions', label: '? Questions' },
  { key: 'polls',     label: '📊 Polls' },
];

// 12 posts so we get plenty of ad insertions
const POSTS = [
  { id: 'p1',  author: 'George Leith',  initials: 'GL', tier: 'pro', age: '1h ago',  pillar: 'strategy',
    body: 'Most reps think strategy means having a perfect plan before they start. Wrong. Strategy is pattern recognition in real-time — spotting what\'s working, doubling down fast, killing what isn\'t. The best closers I know adjust their approach three times during a single discovery call based on what they\'re hearing.',
    reactions: 47, replies: 12, bookmarks: 8, kind: 'win' },
  { id: 'p2',  author: 'George Leith',  initials: 'GL', tier: 'pro', age: '1h ago',  pillar: 'mental-toughness',
    body: 'Top reps don\'t avoid rejection — they collect it. Every "no" is data about your approach, your timing, your message. Weak reps take it personal and spiral. Strong reps analyze it, adjust, and dial the next number.',
    reactions: 89, replies: 24, bookmarks: 31, kind: 'post' },
  { id: 'p3',  author: 'Marcus Chen',   initials: 'MC', tier: 'vip', age: '2h ago',  pillar: 'identity',
    body: 'Day 90 of writing one customer interview a day. The compounding is real. I\'m hearing patterns now I never noticed in 10 years of selling.',
    reactions: 64, replies: 18, bookmarks: 22, kind: 'win' },
  { id: 'p4',  author: 'Amara Okafor',  initials: 'AO', tier: 'pro', age: '3h ago',  pillar: 'foundation',
    body: 'Question: how do you handle pricing pushback when procurement gets involved late in the cycle? Lost 2 deals to this last quarter and I need a better playbook.',
    reactions: 11, replies: 34, bookmarks: 6, kind: 'question' },
  { id: 'p5',  author: 'Renée Dubois',  initials: 'RD', tier: 'pro', age: '4h ago',  pillar: 'execution',
    body: 'The 5-call rule changed my outbound forever. If you can\'t get a meeting in 5 attempts with a prospect who fits your ICP, the problem isn\'t them — it\'s your messaging. Move on, regroup, come back next quarter.',
    reactions: 73, replies: 15, bookmarks: 28, kind: 'post' },
  { id: 'p6',  author: 'Jordan Reeves', initials: 'JR', tier: 'community', age: '6h ago', pillar: 'accountability',
    body: 'Closed my biggest deal of the year today using the Discovery framework from Module 4. $340K ARR. The "what would have to be true" question unlocked it. Took 11 weeks. Worth every cold call.',
    reactions: 142, replies: 47, bookmarks: 56, kind: 'win' },
  { id: 'p7',  author: 'Tariq Hill',    initials: 'TH', tier: 'pro', age: '8h ago',  pillar: 'strategy',
    body: 'Hot take: most "strategic" sales calls are tactical. You\'re reacting to objections instead of architecting outcomes. Spend 2 hours pre-call mapping the customer\'s 12-month picture and you\'ll never wing it again.',
    reactions: 56, replies: 22, bookmarks: 18, kind: 'post' },
  { id: 'p8',  author: 'Anna Voss',     initials: 'AV', tier: 'vip', age: '10h ago', pillar: 'mental-toughness',
    body: 'Three weeks into the deep work block. First week I hated it. Second week I tolerated it. This week I scheduled three more. Discomfort is the price of compound growth.',
    reactions: 91, replies: 19, bookmarks: 27, kind: 'win' },
  { id: 'p9',  author: 'Lena Park',     initials: 'LP', tier: 'pro', age: '12h ago', pillar: 'identity',
    body: 'Anyone else feel like the "always be closing" energy is dead? My best months come from listening twice as much as I talk and qualifying out fast. Curious what others are seeing.',
    reactions: 38, replies: 41, bookmarks: 12, kind: 'question' },
  { id: 'p10', author: 'David Okwu',    initials: 'DO', tier: 'pro', age: '14h ago', pillar: 'execution',
    body: 'Pipeline review tip: stop treating "interested" as a stage. Either there\'s a defined next step on the calendar or there isn\'t. Half my pipeline disappeared this week and I\'m relieved.',
    reactions: 67, replies: 16, bookmarks: 21, kind: 'post' },
  { id: 'p11', author: 'Priya Shah',    initials: 'PS', tier: 'community', age: '16h ago', pillar: 'foundation',
    body: 'Just hit 30 days of the morning audit. 8 questions before 8 AM. The clarity I\'m bringing into calls is unreal. If anyone wants the question list, drop a 🔥 below.',
    reactions: 124, replies: 38, bookmarks: 47, kind: 'win' },
  { id: 'p12', author: 'Sam Reilly',    initials: 'SR', tier: 'pro', age: '20h ago', pillar: 'accountability',
    body: 'Ran a poll with my team: who tracks their actual call time vs scheduled time? 6 of 9 said no. We\'re flying blind on our most important leading indicator. Building it into our weekly ritual now.',
    reactions: 49, replies: 23, bookmarks: 14, kind: 'poll' },
];

const SPONSORS_FEED = [
  { id: 'a1', name: 'Outreach', accent: '#3FB8E8', tagline: 'Sales execution. Without the chaos.',
    body: 'The platform top performers use to forecast, coach and close — built for revenue teams who refuse to coast.',
    cta: 'Try free for 30 days', wordmark: 'OUTREACH', kind: 'inline' },
  { id: 'a2', name: 'Notion',   accent: '#E8B547', tagline: 'Where teams build clarity.',
    body: 'One workspace for docs, projects, and knowledge. Replace 5 tools with one source of truth.',
    cta: 'Start your workspace', wordmark: 'NOTION', kind: 'ribbon' },
  { id: 'a3', name: 'Calendly', accent: '#A78BFA', tagline: 'Scheduling, automated.',
    body: 'Stop the back-and-forth. Let prospects book directly into your priority blocks.',
    cta: 'Get started — free', wordmark: 'CALENDLY', kind: 'inline' },
  { id: 'a4', name: 'Gong',     accent: '#19C9A6', tagline: 'Hear every deal-killer.',
    body: 'Revenue intelligence that surfaces the truth in every conversation. Coach faster, close cleaner.',
    cta: 'Book a demo', wordmark: 'GONG', kind: 'feature' },
];

// ──────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ──────────────────────────────────────────────────────────────────────
function CommunityHeader() {
  return (
    <header style={{
      padding: '32px 0 24px',
      borderBottom: '1px solid var(--border-soft2)',
      marginBottom: 24,
    }}>
      <p style={{
        margin: 0,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.85)',
      }}>Evolved Pros</p>
      <h1 style={{
        margin: '6px 0 8px',
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 56, letterSpacing: '0.04em',
        color: 'var(--text-strong)',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>Community</h1>
      <p style={{
        margin: 0,
        fontFamily: 'Playfair Display, Georgia, serif',
        fontStyle: 'italic',
        fontSize: 16, lineHeight: 1.5,
        color: 'var(--text-2)',
        maxWidth: 640,
      }}>Where high-performing sales professionals share wins, ask hard questions, and hold each other accountable.</p>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────
// FILTER RAIL — single tight row: segmented kind control + pillar dots
// ──────────────────────────────────────────────────────────────────────
function FilterRail({ kind, setKind, pillar, setPillar }) {
  const KIND_SEGMENTED = [
    { key: 'all',       label: 'All' },
    { key: 'following', label: 'Following' },
    { key: 'top-week',  label: 'Top' },
    { key: 'wins',      label: 'Wins' },
    { key: 'questions', label: 'Q&A' },
    { key: 'polls',     label: 'Polls' },
  ];
  const activePillar = PILLARS.find(p => p.key === pillar);
  const accent = activePillar?.color || 'var(--text-4)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: '10px 0',
      marginBottom: 16,
      borderTop: '1px solid var(--border-soft)',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      {/* Segmented kind control */}
      <div style={{
        display: 'inline-flex',
        border: '1px solid var(--border-med)',
        background: 'transparent',
      }}>
        {KIND_SEGMENTED.map((k, i) => {
          const active = kind === k.key;
          return (
            <button key={k.key} type="button" onClick={() => setKind(k.key)}
              style={{
                padding: '7px 14px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 11,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: active ? '#0A0F18' : 'var(--text-3)',
                background: active ? '#fff' : 'transparent',
                border: 'none',
                borderLeft: i === 0 ? 'none' : '1px solid var(--border-soft2)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}>{k.label}</button>
          );
        })}
      </div>

      {/* Pillar dots — visual, compact */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-5)',
        }}>Pillar</span>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          <button type="button" onClick={() => setPillar('all')}
            title="All pillars"
            style={{
              width: 22, height: 22,
              padding: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 9,
              letterSpacing: '0.1em',
              color: pillar === 'all' ? '#0A0F18' : 'var(--text-4)',
              background: pillar === 'all' ? '#fff' : 'transparent',
              border: `1px solid ${pillar === 'all' ? '#fff' : 'var(--border-strong)'}`,
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}>∞</button>
          {PILLARS.map(p => {
            const active = pillar === p.key;
            return (
              <button key={p.key} type="button" onClick={() => setPillar(p.key)}
                title={p.label}
                style={{
                  width: 22, height: 22,
                  padding: 0,
                  background: active ? p.color : `${p.color}33`,
                  border: `1px solid ${active ? p.color : `${p.color}55`}`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: active ? `0 0 0 2px ${p.color}33` : 'none',
                }}/>
            );
          })}
        </div>
        {/* Active pillar label */}
        {activePillar && (
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: accent,
            paddingLeft: 6, marginLeft: 2,
            borderLeft: '1px solid var(--border-med)',
          }}>{activePillar.label}</span>
        )}
      </div>

      {/* Sort — pushed right */}
      <div style={{
        marginLeft: 'auto',
        display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-5)',
        }}>Sort</span>
        <button type="button" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 11,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--text-2)',
          background: 'transparent',
          border: '1px solid var(--border-med)',
          cursor: 'pointer',
        }}>Newest <span style={{ opacity: 0.5 }}>▾</span></button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// COMPOSER
// ──────────────────────────────────────────────────────────────────────
function Composer() {
  const [tab, setTab] = useState('update');
  const [pillar, setPillar] = useState(null);
  const [text, setText] = useState('');
  const tabs = [
    { key: 'update',   label: 'Update',   icon: '✎' },
    { key: 'question', label: 'Question', icon: '?' },
    { key: 'win',      label: 'Win',      icon: '🏆' },
    { key: 'poll',     label: 'Poll',     icon: '📊' },
  ];
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderTop: '2px solid #C9A84C',
      marginBottom: 24,
    }}>
      {/* tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{
                padding: '12px 18px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 11,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: active ? '#fff' : 'var(--text-4)',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}>
              <span style={{ marginRight: 6, opacity: 0.7 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>
      {/* body */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: 12 }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #8b7332)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 12,
          color: '#0A0F18', letterSpacing: '0.04em',
        }}>GL</div>
        <div style={{ flex: 1 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            placeholder={
              tab === 'win'      ? 'Share a win — what worked, what changed?' :
              tab === 'question' ? 'Ask the community...' :
              tab === 'poll'     ? 'Pose a question. Add options below.' :
                                   'Share what you\'re working on or applying...'
            }
            style={{
              width: '100%', minHeight: 64,
              background: 'transparent',
              border: 'none', outline: 'none',
              fontFamily: 'Barlow, sans-serif', fontSize: 14, lineHeight: 1.5,
              color: 'var(--text-strong)', resize: 'vertical',
            }}/>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            marginTop: 10, paddingTop: 10,
            borderTop: '1px solid var(--border-soft)',
          }}>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: 'var(--text-5)',
            }}>Tag pillar</span>
            {PILLARS.map(p => {
              const on = pillar === p.key;
              return (
                <button key={p.key} type="button" onClick={() => setPillar(on ? null : p.key)}
                  style={{
                    padding: '3px 8px',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700, fontSize: 10,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: on ? p.color : 'var(--text-3)',
                    background: on ? `${p.color}22` : 'transparent',
                    border: `1px solid ${on ? p.color : 'var(--border-med)'}`,
                    cursor: 'pointer',
                  }}>{p.label}</button>
              );
            })}
            <button type="button" disabled={!text.trim()} style={{
              marginLeft: 'auto',
              padding: '7px 16px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 11,
              letterSpacing: '0.24em', textTransform: 'uppercase',
              color: text.trim() ? '#0A0F18' : 'var(--text-6)',
              background: text.trim() ? '#C9A84C' : 'transparent',
              border: `1px solid ${text.trim() ? '#C9A84C' : 'var(--border-strong)'}`,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}>Post →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommunityHeader, FilterRail, Composer, COMMUNITY_DATA: { POSTS, SPONSORS_FEED, PILLARS } });
