/* global React, ReactDOM, TopNav, WelcomeBanner,
   CommunityPulseCard, TopStoriesCard, PodcastReelCard, DailyPulseCard,
   RecentActivity, UpcomingEvents, YourAcademy, GoalsCard, SponsorRail,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle */

const PROFILE = {
  id: 'u_george',
  display_name: 'George Leith',
  full_name: 'George Leith',
  avatar_url: 'https://i.pravatar.cc/200?img=15',
  tier: 'pro',
  tier_expires_at: '2026-08-12',
};

const QUOTE = {
  quote_text: 'Never stop. The work on yourself is not a project with a completion date. It is the life you are building.',
  source: 'George Leith',
};

const PILLAR_DEFS = [
  { key: 'foundation',       num: 1, label: 'Foundation',       short: 'Foundtn.', color: '#D4862B' },
  { key: 'identity',         num: 2, label: 'Identity',         short: 'Identity', color: '#A86CFF' },
  { key: 'mental-toughness', num: 3, label: 'Mental Toughness', short: 'Mental',   color: '#ef0e30' },
  { key: 'strategy',         num: 4, label: 'Strategy',         short: 'Strategy', color: '#3FB8E8' },
  { key: 'accountability',   num: 5, label: 'Accountability',   short: 'Account.', color: '#E8B547' },
  { key: 'execution',        num: 6, label: 'Execution',        short: 'Exec.',    color: '#19C9A6' },
];

const PILLARS = PILLAR_DEFS.map((p, i) => ({
  ...p,
  earned: i < 3,
  earnedAt: i === 2 ? '2026-04-23' : i < 3 ? '2026-02-10' : null,
  progress: i === 3 ? 60 : i === 4 ? 20 : 0,
}));

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "period": "evening",
  "activeTab": "/home",
  "sponsorLayout": "duo"
}/*EDITMODE-END*/;

function HomePage() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <TopNav
        profile={PROFILE}
        unreadCount={3}
        pathname={t.activeTab}
        aiVariant="pill"
        theme="dark"
        showRenewalBanner={false}
      />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 64px' }}>
        {/* Welcome banner */}
        <WelcomeBanner
          displayName={PROFILE.display_name}
          avatarUrl={PROFILE.avatar_url}
          tier={PROFILE.tier}
          quote={QUOTE}
          unreadPostCount={12}
          upcomingEventCount={3}
          newPodcastCount={2}
          newStoryCount={5}
          pillars={PILLARS}
          period={t.period}
          badgeVariant="chevron"
        />

        {/* TILES — 4-up grid (below the fold) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 24,
        }}>
          <CommunityPulseCard/>
          <TopStoriesCard/>
          <PodcastReelCard/>
          <DailyPulseCard/>
        </div>

        {/* SPONSOR RAIL */}
        <SponsorRail layout={t.sponsorLayout}/>

        {/* Section divider */}
        <SectionDivider label="The Daily Practice"/>

        {/* Activity + Events */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          marginTop: 8,
        }}>
          <RecentActivity/>
          <UpcomingEvents/>
        </div>

        {/* Section divider */}
        <SectionDivider label="The Path Forward"/>

        {/* Academy + Goals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 32,
          marginTop: 8,
        }}>
          <YourAcademy/>
          <GoalsCard/>
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Time of day"/>
        <TweakRadio
          value={t.period}
          options={['early-morning','mid-morning','midday','early-evening','evening','night']}
          onChange={(v) => setT('period', v)}
        />
        <TweakSection label="Active tab"/>
        <TweakRadio
          value={t.activeTab}
          options={['/home','/community','/events','/academy']}
          onChange={(v) => setT('activeTab', v)}
        />
        <TweakSection label="Sponsor layout"/>
        <TweakRadio
          value={t.sponsorLayout}
          options={[
            { value: 'wide', label: '1 wide' },
            { value: 'duo',  label: '2-up' },
            { value: 'trio', label: '3-up' },
          ]}
          onChange={(v) => setT('sponsorLayout', v)}
        />
      </TweaksPanel>
    </>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      margin: '48px 0 24px',
    }}>
      <span style={{
        width: 28, height: 1, background: 'rgba(201,168,76,0.5)',
      }}/>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 10,
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.85)',
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HomePage/>);
