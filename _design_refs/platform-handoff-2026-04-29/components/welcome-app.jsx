/* global React, ReactDOM, WelcomeBanner, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect */

const QUOTE = {
  quote_text: 'Never stop. The work on yourself is not a project with a completion date. It is the life you are building.',
  source: 'George Leith',
};

const PROFILES = {
  photo: {
    displayName: 'George Leith',
    tier: 'pro',
    avatarUrl: 'https://i.pravatar.cc/256?img=15',
  },
  initials: {
    displayName: 'George Leith',
    tier: 'pro',
    avatarUrl: null,
  },
};

const PILLAR_DEFS = [
  { key: 'foundation',       num: 1, label: 'Foundation',       short: 'Foundtn.', color: '#D4862B' },
  { key: 'identity',         num: 2, label: 'Identity',         short: 'Identity', color: '#A86CFF' },
  { key: 'mental-toughness', num: 3, label: 'Mental Toughness', short: 'Mental',   color: '#ef0e30' },
  { key: 'strategy',         num: 4, label: 'Strategy',         short: 'Strategy', color: '#3FB8E8' },
  { key: 'accountability',   num: 5, label: 'Accountability',   short: 'Account.', color: '#E8B547' },
  { key: 'execution',        num: 6, label: 'Execution',        short: 'Exec.',    color: '#19C9A6' },
];

// 4 sample states
const PILLAR_STATES = {
  starter: () => PILLAR_DEFS.map((p, i) => ({ ...p, earned: i === 0, earnedAt: i === 0 ? '2026-04-22' : null, progress: i === 1 ? 35 : 0 })),
  midJourney: () => PILLAR_DEFS.map((p, i) => ({ ...p, earned: i < 3, earnedAt: i === 2 ? '2026-04-23' : i < 3 ? '2026-02-10' : null, progress: i === 3 ? 60 : i === 4 ? 20 : 0 })),
  almostThere: () => PILLAR_DEFS.map((p, i) => ({ ...p, earned: i < 5, earnedAt: i === 4 ? '2026-04-22' : i < 5 ? '2025-12-01' : null, progress: i === 5 ? 80 : 0 })),
  complete: () => PILLAR_DEFS.map((p) => ({ ...p, earned: true, earnedAt: '2025-10-01', progress: 100 })),
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "period": "evening",
  "avatarMode": "photo",
  "tier": "pro",
  "badgeVariant": "chevron",
  "pillarState": "midJourney",
  "showAll": true
}/*EDITMODE-END*/;

const PERIOD_LABEL = {
  'early-morning': 'Early morning',
  'mid-morning':   'Mid morning',
  'midday':        'Midday',
  'early-evening': 'Early evening',
  'evening':       'Evening',
  'night':         'Night',
};

const PERIODS = ['early-morning','mid-morning','midday','early-evening','evening','night'];
const BADGES = ['chevron','vbar','ribbon','bracket','outline','flag'];

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const profile = t.avatarMode === 'photo' ? PROFILES.photo : PROFILES.initials;
  const tier = t.tier;

  return (
    <div className="wrap stack">
      <div>
        <p className="label">Drop-in WelcomeBanner — current settings</p>
        <WelcomeBanner
          displayName={profile.displayName}
          avatarUrl={profile.avatarUrl}
          tier={tier}
          quote={QUOTE}
          unreadPostCount={12}
          upcomingEventCount={3}
          newPodcastCount={2}
          newStoryCount={5}
          pillars={PILLAR_STATES[t.pillarState]?.() ?? PILLAR_STATES.midJourney()}
          period={t.period}
          badgeVariant={t.badgeVariant}
        />
      </div>

      {t.showAll && (
        <>
          <div>
            <p className="label">All six time-of-day scenes</p>
            <div className="stack">
              {PERIODS.map(p => (
                <div key={p}>
                  <p style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 6px',
                  }}>{PERIOD_LABEL[p]}</p>
                  <WelcomeBanner
                    displayName={profile.displayName}
                    avatarUrl={profile.avatarUrl}
                    tier={tier}
                    quote={QUOTE}
                    unreadPostCount={12}
                    upcomingEventCount={3}
                    newPodcastCount={2}
                    newStoryCount={5}
                    period={p}
                    badgeVariant={t.badgeVariant}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="label">All six tier-badge variants (Evening scene)</p>
            <div className="stack">
              {BADGES.map(b => (
                <div key={b}>
                  <p style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    margin: '0 0 6px',
                  }}>{b}</p>
                  <WelcomeBanner
                    displayName={profile.displayName}
                    avatarUrl={profile.avatarUrl}
                    tier={tier}
                    quote={QUOTE}
                    unreadPostCount={12}
                    upcomingEventCount={3}
                    newPodcastCount={2}
                    newStoryCount={5}
                    period="evening"
                    badgeVariant={b}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Time of day" />
        <TweakRadio
          value={t.period}
          options={PERIODS}
          onChange={(v) => setT('period', v)}
        />
        <TweakSection label="Avatar" />
        <TweakRadio
          value={t.avatarMode}
          options={['photo','initials']}
          onChange={(v) => setT('avatarMode', v)}
        />
        <TweakSection label="Tier" />
        <TweakRadio
          value={t.tier}
          options={['pro','vip','community']}
          onChange={(v) => setT('tier', v)}
        />
        <TweakSection label="Tier badge variant" />
        <TweakRadio
          value={t.badgeVariant}
          options={BADGES}
          onChange={(v) => setT('badgeVariant', v)}
        />
        <TweakSection label="Pillar progress" />
        <TweakRadio
          value={t.pillarState}
          options={[
            { value: 'starter',     label: 'Starter (1/6)' },
            { value: 'midJourney',  label: 'Mid (3/6)' },
            { value: 'almostThere', label: 'Almost (5/6)' },
            { value: 'complete',    label: 'Done (6/6)' },
          ]}
          onChange={(v) => setT('pillarState', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          value={t.showAll ? 'all' : 'one'}
          options={['one','all']}
          onChange={(v) => setT('showAll', v === 'all')}
        />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
