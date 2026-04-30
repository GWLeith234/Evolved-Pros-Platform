/* global React, ReactDOM, TopNav,
   CommunityHeader, FilterRail, Composer, CommunityFeed, CommunitySideRail,
   COMMUNITY_DATA,
   useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle */

const { useState } = React;

const PROFILE = {
  id: 'u_george', display_name: 'George Leith', full_name: 'George Leith',
  avatar_url: 'https://i.pravatar.cc/200?img=15', tier: 'pro',
  tier_expires_at: '2026-08-12',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showRail": true,
  "adDensity": "medium",
  "theme": "dark"
}/*EDITMODE-END*/;

function CommunityPage() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const [kind, setKind] = useState('all');
  const [pillar, setPillar] = useState('all');

  React.useEffect(() => {
    document.body.setAttribute('data-theme', t.theme);
  }, [t.theme]);

  const { POSTS, SPONSORS_FEED, PILLARS } = COMMUNITY_DATA;

  // Density: light=6, medium=3, heavy=2
  const stride = t.adDensity === 'light' ? 6 : t.adDensity === 'heavy' ? 2 : 3;

  // Filter posts
  const filtered = POSTS.filter(p => {
    if (kind === 'wins'      && p.kind !== 'win') return false;
    if (kind === 'questions' && p.kind !== 'question') return false;
    if (kind === 'polls'     && p.kind !== 'poll') return false;
    if (pillar !== 'all' && p.pillar !== pillar) return false;
    return true;
  });

  // Build interleaved feed
  const buildFeed = () => {
    const items = [];
    let adIdx = 0;
    filtered.forEach((post, i) => {
      items.push({ kind: 'post', data: post });
      if ((i + 1) % stride === 0 && i < filtered.length - 1) {
        const isFeature = (i + 1) === 9;
        const candidates = isFeature
          ? SPONSORS_FEED.filter(s => s.kind === 'feature')
          : SPONSORS_FEED.filter(s => s.kind !== 'feature');
        const ad = candidates[adIdx % candidates.length];
        if (ad) items.push({ kind: ad.kind, data: ad });
        adIdx++;
      }
    });
    return items;
  };

  return (
    <>
      <TopNav profile={PROFILE} unreadCount={3} pathname="/community"
        aiVariant="pill" theme={t.theme} showRenewalBanner={false}/>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 64px' }}>
        <CommunityHeader/>

        <div style={{
          display: 'grid',
          gridTemplateColumns: t.showRail ? '1fr 320px' : '1fr',
          gap: 32,
          alignItems: 'start',
        }}>
          {/* MAIN COLUMN */}
          <div>
            <Composer/>
            <FilterRail kind={kind} setKind={setKind} pillar={pillar} setPillar={setPillar}/>
            <FeedWithAds items={buildFeed()}/>

            {filtered.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#111926',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.32em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}>No posts match these filters</p>
              </div>
            )}
          </div>

          {/* RIGHT RAIL */}
          {t.showRail && <CommunitySideRail/>}
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
        <TweakRadio
          value={t.theme}
          options={[
            { value: 'dark',  label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
          onChange={(v) => setT('theme', v)}
        />
        <TweakSection label="Right rail"/>
        <TweakToggle label="Show side rail" value={t.showRail} onChange={(v) => setT('showRail', v)}/>
        <TweakSection label="Ad density"/>
        <TweakRadio
          value={t.adDensity}
          options={[
            { value: 'light',  label: '1 / 6' },
            { value: 'medium', label: '1 / 3' },
            { value: 'heavy',  label: '1 / 2' },
          ]}
          onChange={(v) => setT('adDensity', v)}
        />
      </TweaksPanel>
    </>
  );
}

// Render the prebuilt items list
function FeedWithAds({ items }) {
  // Lazy-import the components from window
  const { PostCard, AdInline, AdRibbon, AdFeature } = window;
  const { PILLARS } = COMMUNITY_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => {
        if (item.kind === 'post')    return <PostCard key={`p-${item.data.id}-${i}`} post={item.data} pillars={PILLARS}/>;
        if (item.kind === 'ribbon')  return <AdRibbon key={`a-${item.data.id}-${i}`} ad={item.data}/>;
        if (item.kind === 'feature') return <AdFeature key={`a-${item.data.id}-${i}`} ad={item.data}/>;
        return <AdInline key={`a-${item.data.id}-${i}`} ad={item.data}/>;
      })}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CommunityPage/>);
