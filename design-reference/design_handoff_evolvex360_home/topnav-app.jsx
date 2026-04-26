/* global React, ReactDOM, TopNav, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect */

const PROFILES = {
  withPhoto: {
    id: 'u_george',
    display_name: 'George Leith',
    full_name: 'George Leith',
    avatar_url: 'https://i.pravatar.cc/200?img=15',
    tier: 'pro',
    tier_expires_at: '2026-08-12',
  },
  initials: {
    id: 'u_george',
    display_name: 'George Leith',
    full_name: 'George Leith',
    avatar_url: null,
    tier: 'pro',
    tier_expires_at: '2026-08-12',
  },
  vipPhoto: {
    id: 'u_amara',
    display_name: 'Amara Okafor',
    full_name: 'Amara Okafor',
    avatar_url: 'https://i.pravatar.cc/200?img=47',
    tier: 'vip',
    tier_expires_at: '2026-05-01',
  },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "aiVariant": "pill",
  "avatarMode": "photo",
  "activeTab": "/home",
  "showRenewalBanner": false,
  "unreadCount": 3
}/*EDITMODE-END*/;

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  const profile =
    t.avatarMode === 'photo' ? PROFILES.withPhoto :
    t.avatarMode === 'vip'   ? PROFILES.vipPhoto :
                                PROFILES.initials;

  const isLight = t.theme === 'light';

  // Theme-aware page bg
  React.useEffect(() => {
    document.body.style.background = isLight ? '#F5F0E8' : '#0A0F18';
    document.body.style.color = isLight ? '#1B2A4A' : '#fff';
  }, [isLight]);

  return (
    <>
      <TopNav
        profile={profile}
        unreadCount={t.unreadCount}
        pathname={t.activeTab}
        aiVariant={t.aiVariant}
        theme={t.theme}
        showRenewalBanner={t.showRenewalBanner}
        daysUntilExpiry={10}
      />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <p style={{
          fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase',
          letterSpacing: '0.22em', fontSize: 11,
          color: isLight ? 'rgba(201,168,76,0.85)' : 'rgba(201,168,76,0.7)',
          margin: 0,
        }}>Drop-in TopNav redesign</p>
        <h1 style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 48,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: isLight ? 'rgba(27,42,74,0.4)' : 'rgba(255,255,255,0.35)',
          margin: '8px 0',
        }}>Home</h1>
        <p style={{
          fontFamily: 'Barlow, sans-serif',
          color: isLight ? 'rgba(27,42,74,0.7)' : 'rgba(255,255,255,0.4)',
          maxWidth: 560, lineHeight: 1.6, margin: 0,
        }}>
          The TopNav adapts to theme: white horizontal logo on dark, navy on light. The
          AI George control puts your avatar inside a violet ring, signalling that
          George's coach is yours, personalized.
        </p>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          value={t.theme}
          options={['dark', 'light']}
          onChange={(v) => setT('theme', v)}
        />

        <TweakSection label="AI George variant" />
        <TweakRadio
          value={t.aiVariant}
          options={[
            { value: 'pill',  label: 'Pill' },
            { value: 'ring',  label: 'Ring' },
            { value: 'wide',  label: 'Wide' },
          ]}
          onChange={(v) => setT('aiVariant', v)}
        />

        <TweakSection label="Avatar" />
        <TweakRadio
          value={t.avatarMode}
          options={[
            { value: 'photo',    label: 'Pro' },
            { value: 'vip',      label: 'VIP' },
            { value: 'initials', label: 'Init.' },
          ]}
          onChange={(v) => setT('avatarMode', v)}
        />

        <TweakSection label="Active tab" />
        <TweakSelect
          value={t.activeTab}
          options={[
            { value: '/home',      label: 'Home' },
            { value: '/community', label: 'Community' },
            { value: '/events',    label: 'Events' },
            { value: '/academy',   label: 'Academy' },
            { value: '/habits',    label: 'Discipline' },
            { value: '/podcast',   label: 'Podcast' },
            { value: '/live',      label: 'Live' },
            { value: '/media',     label: 'Media' },
          ]}
          onChange={(v) => setT('activeTab', v)}
        />

        <TweakSection label="Notifications" />
        <TweakRadio
          value={String(t.unreadCount)}
          options={[
            { value: '0',  label: 'None' },
            { value: '3',  label: '3' },
            { value: '12', label: '9+' },
          ]}
          onChange={(v) => setT('unreadCount', Number(v))}
        />

        <TweakSection label="Renewal banner" />
        <TweakToggle
          label="Show — 10 days"
          value={t.showRenewalBanner}
          onChange={(v) => setT('showRenewalBanner', v)}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
