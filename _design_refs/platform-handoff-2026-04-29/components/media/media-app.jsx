/* global React, ReactDOM, TopNav, MediaMasthead, MediaTicker, MediaHero, LatestWithSidebar, GeorgesDesk, DossiersStrip, BookExcerptBlock, VideoClips, InlineAd, MediaFooter, useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showTicker": true,
  "showDesk": true,
  "showBook": true,
  "showInlineAd": true,
  "density": "comfortable"
}/*EDITMODE-END*/;

function MediaApp() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState('Top Stories');
  const [savedSet, setSavedSet] = React.useState(() => new Set());

  React.useEffect(() => {
    document.body.dataset.theme = 'light';
  }, []);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setTweaksOpen(true);
      else if (t === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const toggleTweaks = () => {
    if (tweaksOpen) {
      window.postMessage({ type: '__deactivate_edit_mode' }, '*');
      window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
    } else {
      window.postMessage({ type: '__activate_edit_mode' }, '*');
    }
  };

  const toggleSave = (id) => {
    setSavedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const profile = {
    id: 'gl', display_name: 'George Leith', full_name: 'George Leith',
    avatar_url: null, tier: 'pro',
  };

  const ED = window.ED;

  return (
    <div data-screen-label="Media Page" style={{
      minHeight: '100vh',
      background: ED.bg,
      color: ED.text,
    }}>
      <TopNav profile={profile} unreadCount={3} pathname="/media" theme="light"/>

      {tweaks.showTicker && <window.MediaTicker/>}

      <window.MediaMasthead activeNav={activeNav} onNav={setActiveNav}/>

      {/* Top IAB leaderboard ad */}
      <div style={{ background: ED.bg, padding: '20px 24px 0' }}>
        <window.InlineAd size="leaderboard"/>
      </div>

      <window.MediaHero savedSet={savedSet} onToggleSave={toggleSave}/>

      <window.LatestWithSidebar savedSet={savedSet} onToggleSave={toggleSave}/>

      {tweaks.showBook && <window.BookExcerptBlock/>}

      {tweaks.showInlineAd && <window.InlineAd size="billboard"/>}

      {tweaks.showDesk && <window.GeorgesDesk savedSet={savedSet} onToggleSave={toggleSave}/>}

      <window.MediaFooter/>

      {/* Floating Tweaks affordance */}
      {!tweaksOpen && (
        <button type="button" onClick={toggleTweaks}
          aria-label="Open tweaks"
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 50,
            padding: '12px 18px',
            background: ED.gold, color: '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 12,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Tweaks
        </button>
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Sections">
          <window.TweakToggle label="Breaking ticker"   value={tweaks.showTicker}    onChange={(v) => setTweak('showTicker', v)}/>
          <window.TweakToggle label="George’s Desk" value={tweaks.showDesk}      onChange={(v) => setTweak('showDesk', v)}/>
          <window.TweakToggle label="Book excerpt"      value={tweaks.showBook}      onChange={(v) => setTweak('showBook', v)}/>
          <window.TweakToggle label="Mid-page billboard ad" value={tweaks.showInlineAd} onChange={(v) => setTweak('showInlineAd', v)}/>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MediaApp/>);
