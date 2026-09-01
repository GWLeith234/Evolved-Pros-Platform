/* global React, ReactDOM, TopNav, LiveMasthead, LiveSplitHero, GlobeSection, UpcomingDates, TopicsSection, TestimonialsSection, PhotoRotator, BookCTA, SPEAKING_PINS, useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio, TweakSelect */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showStats": true,
  "showTopics": true,
  "showTestimonials": true,
  "showLogos": true,
  "theme": "dark",
  "heroVariant": "split",
  "heroPhoto": "stage-blue"
}/*EDITMODE-END*/;

const HERO_PHOTOS = {
  'stage-blue':   { src: 'assets/george-stage-blue-jacket.jpg', label: 'Keynote — blue jacket' },
  'cloud-broker': { src: 'assets/george-cloud-broker.jpg',      label: 'Rise of the Cloud Broker' },
  'interview':    { src: 'assets/george-interview.jpg',         label: 'In conversation' },
  'original':     { src: 'assets/george-on-stage.png',          label: 'Original' },
};

function LiveApp() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Apply theme to body
  React.useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
  }, [tweaks.theme]);

  // Keep the floating button in sync with the toolbar toggle / panel
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

  const profile = {
    id: 'gl', display_name: 'George Leith', full_name: 'George Leith',
    avatar_url: null, tier: 'pro',
  };

  // Hero photo — switchable via Tweaks
  const photo = (HERO_PHOTOS[tweaks.heroPhoto] || HERO_PHOTOS['stage-blue']).src;

  return (
    <div data-screen-label="Live Page" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <TopNav profile={profile} unreadCount={0} pathname="/live" theme={tweaks.theme}/>

      <LiveMasthead/>

      <LiveSplitHero
        photo={photo}
        onBook={() => alert('Open booking form')}
        onReel={() => alert('Play speaker reel')}
      />

      <GlobeSection pins={window.SPEAKING_PINS}/>

      <UpcomingDates/>

      {tweaks.showTopics && <TopicsSection/>}

      {tweaks.showTestimonials && <TestimonialsSection/>}

      {tweaks.showLogos && <PhotoRotator/>}

      <BookCTA onBook={() => alert('Open booking form')}/>

      {/* Floating Tweaks affordance — guaranteed in-page access */}
      {!tweaksOpen && (
        <button type="button" onClick={toggleTweaks}
          aria-label="Open tweaks"
          style={{
            position: 'fixed', right: 16, bottom: 16, zIndex: 50,
            padding: '12px 18px',
            background: '#C9A84C', color: '#0A0F18',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 12,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Tweaks
        </button>
      )}

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Theme">
          <window.TweakRadio
            label="Mode"
            value={tweaks.theme}
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            onChange={(v) => setTweak('theme', v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Hero photo">
          <window.TweakSelect
            label="Image"
            value={tweaks.heroPhoto}
            options={Object.entries(HERO_PHOTOS).map(([value, { label }]) => ({ value, label }))}
            onChange={(v) => setTweak('heroPhoto', v)}
          />
        </window.TweakSection>
        <window.TweakSection label="Sections">
          <window.TweakToggle label="Topics" value={tweaks.showTopics} onChange={(v) => setTweak('showTopics', v)}/>
          <window.TweakToggle label="Testimonials" value={tweaks.showTestimonials} onChange={(v) => setTweak('showTestimonials', v)}/>
          <window.TweakToggle label="Photo rotator" value={tweaks.showLogos} onChange={(v) => setTweak('showLogos', v)}/>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LiveApp/>);
