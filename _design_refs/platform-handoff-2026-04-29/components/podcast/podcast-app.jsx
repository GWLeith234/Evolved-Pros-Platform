/* global React, ReactDOM, TopNav,
   PodcastLatestStrip, PodcastMasthead, PodcastHero, PodcastGrid,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle */
const { useState: usePAState, useMemo: usePAMemo } = React;

const PROFILE = {
  id: 'u_george',
  display_name: 'AJ George',
  full_name: 'AJ George',
  avatar_url: 'https://i.pravatar.cc/200?img=15',
  tier: 'pro',
  tier_expires_at: '2026-08-12',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showLatestStrip": true,
  "tileDensity": "comfortable",
  "shellTheme": "parchment"
}/*EDITMODE-END*/;

function PodcastPage() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const EPISODES = window.PODCAST_DATA.EPISODES;
  const latest = usePAMemo(() => EPISODES.find(e => e.pinned) || EPISODES[0], []);
  const rest   = usePAMemo(() => EPISODES.filter(e => e.id !== latest.id), [latest]);
  const [toast, setToast] = usePAState(null);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(null), 1800);
  };
  const handleWatch = (ep = latest) => showToast(`Opening "${ep.title}"…`);

  const isParchment = t.shellTheme !== 'navy';

  // Sync the body's data-theme so the design-system tokens
  // (--text-strong, --bg-page, --border-*) flip alongside the shell.
  React.useEffect(() => {
    if (isParchment) {
      document.body.setAttribute('data-theme', 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
    return () => document.body.removeAttribute('data-theme');
  }, [isParchment]);

  return (
    <div style={{
      background: 'var(--bg-page)',
      minHeight: '100vh',
      color: 'var(--text-strong)',
    }}>
      <style>{`html, body { background: var(--bg-page); }`}</style>

      <TopNav
        profile={PROFILE}
        unreadCount={3}
        pathname="/podcast"
        aiVariant="pill"
        theme={isParchment ? 'light' : 'dark'}
        showRenewalBanner={false}
      />

      {t.showLatestStrip && (
        <PodcastLatestStrip episode={latest} onWatch={() => handleWatch(latest)} />
      )}

      <PodcastMasthead/>
      <PodcastHero episode={latest} onWatch={() => handleWatch(latest)} />
      <PodcastGrid episodes={rest} onPlay={(ep) => handleWatch(ep)} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 20px',
          background: '#0D1B2A',
          border: '1px solid rgba(201,168,76,0.5)',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 12,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#fff',
          zIndex: 1200,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Shell"/>
        <TweakRadio
          value={t.shellTheme}
          options={[
            { value: 'parchment', label: 'Parchment (editorial)' },
            { value: 'navy',      label: 'Navy (platform dark)' },
          ]}
          onChange={(v) => setT('shellTheme', v)}
        />
        <TweakSection label="Latest-episode strip"/>
        <TweakToggle
          value={t.showLatestStrip}
          label="Show red strip under TopNav"
          onChange={(v) => setT('showLatestStrip', v)}
        />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PodcastPage/>);
