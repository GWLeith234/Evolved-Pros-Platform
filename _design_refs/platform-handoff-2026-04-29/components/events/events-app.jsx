/* global React, ReactDOM, TopNav, EVENTS_DATA, EventsHero, Shelf,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle */
const { useState, useMemo } = React;

const PROFILE = {
  id: 'u_george',
  display_name: 'George Leith',
  full_name: 'George Leith',
  avatar_url: 'https://i.pravatar.cc/200?img=15',
  tier: 'pro',
  tier_expires_at: '2026-08-12',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroStyle": "cinematic",
  "activeFilter": "all",
  "showMyBadge": true
}/*EDITMODE-END*/;

const FORMAT_FILTERS = [
  { key: 'all',       label: 'All',        color: '#fff' },
  { key: 'live',      label: 'Live',       color: '#ef0e30' },
  { key: 'in-person', label: 'In Person',  color: '#E8B547' },
  { key: 'podcast',   label: 'Podcast',    color: '#3FB8E8' },
  { key: 'mine',      label: 'My Events',  color: '#C9A84C' },
];

function EventsPage() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const [filter, setFilter] = useState(t.activeFilter || 'all');
  const [mine, setMine] = useState(() => new Set(EVENTS_DATA.filter(e => e.myEvents).map(e => e.id)));
  const [toast, setToast] = useState(null);

  const toggleMine = (id) => {
    setMine(prev => {
      const next = new Set(prev);
      const added = !next.has(id);
      if (added) next.add(id); else next.delete(id);
      const ev = EVENTS_DATA.find(e => e.id === id);
      setToast({ text: added ? `Added "${ev?.title}" to your events` : `Removed "${ev?.title}"`, kind: added ? 'ok' : 'off' });
      setTimeout(() => setToast(null), 2200);
      return next;
    });
  };

  // Identify hero event
  const hero = useMemo(() => EVENTS_DATA.find(e => e.hero) || EVENTS_DATA[0], []);
  const rest = EVENTS_DATA.filter(e => e.id !== hero.id);

  // Apply format filter — affects shelves, not hero
  const filtered = filter === 'all' ? rest
    : filter === 'mine' ? rest.filter(e => mine.has(e.id))
    : rest.filter(e => e.format === filter);

  // Shelf compositions (respecting filter)
  const podcastShelf = filtered.filter(e => e.format === 'podcast');
  // "Live & Upcoming" now merges live + in-person, sorted by start date (soonest first)
  const liveShelf = filtered
    .filter(e => e.format === 'live' || e.format === 'in-person')
    .sort((a, b) => a.starts.getTime() - b.starts.getTime());

  // Share / invite handlers — toast only
  const handleShare = () => { setToast({ text: 'Shared to your feed', kind: 'ok' }); setTimeout(() => setToast(null), 1800); };
  const handleInvite = () => { setToast({ text: 'Invite link copied', kind: 'ok' }); setTimeout(() => setToast(null), 1800); };
  const openEvent = (ev) => { setToast({ text: `Opening "${ev.title}"…`, kind: 'info' }); setTimeout(() => setToast(null), 1400); };

  const anyShelfHasContent = podcastShelf.length + liveShelf.length > 0;

  return (
    <>
      <TopNav
        profile={PROFILE}
        unreadCount={3}
        pathname="/events"
        aiVariant="pill"
        theme="dark"
        showRenewalBanner={false}
      />

      {/* Full-bleed hero */}
      <EventsHero
        event={hero}
        variant={t.heroStyle}
        rsvpd={mine.has(hero.id)}
        onRsvp={() => toggleMine(hero.id)}
        onShare={handleShare}
        onInvite={handleInvite}
      />

      {/* Sticky filter bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(10,15,24,0.85)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        maxWidth: '100%',
      }}>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          marginRight: 6,
        }}>Browse</span>
        {FORMAT_FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px',
                background: active ? f.color : 'transparent',
                color: active ? (f.key === 'all' ? '#0A0F18' : '#0A0F18') : f.color,
                border: `1px solid ${active ? f.color : f.color + '66'}`,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 11,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              {f.key === 'mine' && <span>✓</span>}
              {f.label}
              {f.key === 'mine' && (
                <span style={{
                  padding: '1px 6px',
                  background: active ? 'rgba(10,15,24,0.15)' : 'rgba(201,168,76,0.2)',
                  fontSize: 10, fontWeight: 700,
                }}>{mine.size}</span>
              )}
            </button>
          );
        })}
        <span style={{ flex: 1 }}/>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600, fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
        }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <main style={{ padding: '32px 0 96px' }}>
        {!anyShelfHasContent && (
          <div style={{
            maxWidth: 560, margin: '80px auto', textAlign: 'center',
            padding: 40,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{
              margin: 0, fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
            }}>No matches</p>
            <h2 style={{
              margin: '12px 0 0',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 24, color: '#fff',
            }}>Nothing here yet.</h2>
            <p style={{
              margin: '10px 0 0',
              fontFamily: 'Barlow, sans-serif', fontSize: 14,
              color: 'rgba(255,255,255,0.6)',
            }}>Try a different filter — or head to "All" to see everything upcoming.</p>
          </div>
        )}

        {/* Podcasts — top shelf */}
        {podcastShelf.length > 0 && (
          <Shelf
            title="The Podcast"
            subtitle="New this month"
            accent="#3FB8E8"
            kind="podcast"
            events={podcastShelf}
            mine={mine}
            onToggle={toggleMine}
            onOpen={openEvent}
          />
        )}

        {/* Live & Upcoming — includes retreats / meetups */}
        {liveShelf.length > 0 && (
          <Shelf
            title="Live & Upcoming"
            subtitle="Workshops · Retreats · Meetups"
            accent="#ef0e30"
            kind="standard"
            events={liveShelf}
            mine={mine}
            onToggle={toggleMine}
            onOpen={openEvent}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 20px',
          background: '#111926',
          border: `1px solid ${toast.kind === 'ok' ? '#19C9A6' : toast.kind === 'off' ? 'rgba(255,255,255,0.2)' : 'rgba(63,184,232,0.5)'}`,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 12,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#fff',
          zIndex: 1200,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>{toast.text}</div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Hero style"/>
        <TweakRadio
          value={t.heroStyle}
          options={[
            { value: 'cinematic', label: 'Cinematic full-bleed' },
            { value: 'split',     label: 'Split: panel + image' },
            { value: 'countdown', label: 'Countdown-forward' },
          ]}
          onChange={(v) => setT('heroStyle', v)}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EventsPage/>);
