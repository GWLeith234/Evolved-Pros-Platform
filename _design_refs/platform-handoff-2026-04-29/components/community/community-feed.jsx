/* global React */
const { useState } = React;

// ──────────────────────────────────────────────────────────────────────
// COMMUNITY FEED — post cards + 3 sponsor ad formats interleaved
// ──────────────────────────────────────────────────────────────────────

const TIER_GRAD = {
  pro:       'linear-gradient(135deg, #C9A84C, #8b7332)',
  vip:       'linear-gradient(135deg, #ef0e30, #8b1820)',
  community: 'linear-gradient(135deg, #60A5FA, #3a73c8)',
};

const TIER_LABEL = { pro: 'Pro', vip: 'VIP', community: 'Member' };

function PillarLookup(key, list) { return list.find(p => p.key === key); }

// ──────────────────────────────────────────────────────────────────────
// POST CARD
// ──────────────────────────────────────────────────────────────────────
function PostCard({ post, pillars }) {
  const [reacted, setReacted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reactions, setReactions] = useState(post.reactions);
  const [bookmarks, setBookmarks] = useState(post.bookmarks);
  const [activeReact, setActiveReact] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const pillar = PillarLookup(post.pillar, pillars);
  const REACTIONS = [
    { key: 'fire',   emoji: '🔥' },
    { key: '100',    emoji: '💯' },
    { key: 'clap',   emoji: '🙌' },
    { key: 'heart',  emoji: '❤️' },
    { key: 'mind',   emoji: '🤯' },
  ];

  const onReact = (key) => {
    if (activeReact === key) {
      setActiveReact(null); setReacted(false); setReactions(reactions - 1);
    } else if (activeReact) {
      setActiveReact(key);
    } else {
      setActiveReact(key); setReacted(true); setReactions(reactions + 1);
    }
    setShowEmojis(false);
  };
  const toggleBookmark = () => {
    setBookmarks(bookmarks + (bookmarked ? -1 : 1));
    setBookmarked(!bookmarked);
  };

  const kindBadge = post.kind === 'win' ? { label: '🏆 Win', color: '#19C9A6' }
                  : post.kind === 'question' ? { label: '? Question', color: '#3FB8E8' }
                  : post.kind === 'poll' ? { label: '📊 Poll', color: '#A78BFA' }
                  : null;

  return (
    <article style={{
      position: 'relative',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderLeft: `2px solid ${pillar?.color || '#C9A84C'}`,
      padding: '18px 20px',
    }}>
      {/* header row */}
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, flexShrink: 0,
          borderRadius: '50%',
          background: TIER_GRAD[post.tier],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 12,
          color: '#0A0F18', letterSpacing: '0.04em',
        }}>{post.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14,
              color: 'var(--text-strong)',
            }}>{post.author}</span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: post.tier === 'vip' ? '#ef0e30' : post.tier === 'pro' ? '#C9A84C' : 'var(--text-4)',
              padding: '1px 6px',
              border: `1px solid ${post.tier === 'vip' ? '#ef0e3055' : post.tier === 'pro' ? '#C9A84C55' : 'var(--border-strong)'}`,
            }}>{TIER_LABEL[post.tier]}</span>
            {kindBadge && (
              <span style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: kindBadge.color,
              }}>{kindBadge.label}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {pillar && (
              <>
                <span style={{ width: 5, height: 5, background: pillar.color }}/>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 9,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: pillar.color,
                }}>{pillar.label}</span>
                <span style={{ color: 'var(--text-6)' }}>·</span>
              </>
            )}
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 9,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text-5)',
            }}>{post.age}</span>
          </div>
        </div>
        <button type="button" aria-label="More" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-5)', padding: 4,
        }}>⋯</button>
      </header>

      {/* body */}
      <p style={{
        margin: 0,
        fontFamily: 'Barlow, sans-serif', fontSize: 14.5, lineHeight: 1.6,
        color: 'var(--text-1)',
      }}>{post.body}</p>

      {/* actions */}
      <footer style={{
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
        marginTop: 14, paddingTop: 12,
        borderTop: '1px solid var(--border-soft)',
      }}>
        {/* React */}
        <div style={{ position: 'relative' }} onMouseLeave={() => setShowEmojis(false)}>
          <button type="button" onClick={() => activeReact ? onReact(activeReact) : setShowEmojis(!showEmojis)}
            onMouseEnter={() => setShowEmojis(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: activeReact ? '#ef0e30' : 'var(--text-3)',
              background: 'transparent',
              border: 'none', cursor: 'pointer',
            }}>
            {activeReact
              ? <span style={{ fontSize: 14 }}>{REACTIONS.find(r => r.key === activeReact).emoji}</span>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
            React · {reactions}
          </button>
          {showEmojis && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 4px)', left: 0,
              display: 'flex', gap: 2,
              padding: '4px 6px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-med)',
              zIndex: 5,
            }}>
              {REACTIONS.map(r => (
                <button key={r.key} type="button" onClick={() => onReact(r.key)}
                  style={{
                    width: 28, height: 28, fontSize: 16,
                    background: activeReact === r.key ? 'rgba(239,14,48,0.15)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}>{r.emoji}</button>
              ))}
            </div>
          )}
        </div>

        <button type="button" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--text-3)',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Reply · {post.replies}
        </button>

        <button type="button" onClick={toggleBookmark}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: bookmarked ? '#C9A84C' : 'var(--text-3)',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? '#C9A84C' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          {bookmarked ? 'Saved' : 'Save'} · {bookmarks}
        </button>

        <button type="button" style={{
          marginLeft: 'auto',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--text-4)',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
          Share
        </button>
      </footer>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────
// AD FORMATS — 3 styles
// ──────────────────────────────────────────────────────────────────────

// Inline card — same width as posts, 2px accent stripe
function AdInline({ ad }) {
  const [hover, setHover] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'block',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: `2px solid ${ad.accent}`,
        padding: '18px 20px',
        textDecoration: 'none', color: 'inherit',
        overflow: 'hidden',
        transition: 'border-color 160ms ease',
        borderRightColor: hover ? `${ad.accent}55` : 'var(--border)',
        borderTopColor: hover ? `${ad.accent}55` : 'var(--border)',
        borderBottomColor: hover ? `${ad.accent}55` : 'var(--border)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36,
          background: `${ad.accent}1a`, border: `1px solid ${ad.accent}55`,
          color: ad.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.04em',
        }}>{ad.name[0]}</div>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.14em',
          color: 'var(--text-strong)',
        }}>{ad.wordmark}</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'var(--text-5)',
          padding: '2px 6px', border: '1px solid var(--border-med)',
        }}>Sponsored</span>
      </div>
      <p style={{
        margin: 0,
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 17, lineHeight: 1.3, fontWeight: 700,
        color: 'var(--text-strong)',
      }}>{ad.tagline}</p>
      <p style={{
        margin: '6px 0 12px',
        fontFamily: 'Barlow, sans-serif', fontSize: 13, lineHeight: 1.5,
        color: 'var(--text-3)',
      }}>{ad.body}</p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: hover ? '#0A0F18' : ad.accent,
        background: hover ? ad.accent : 'transparent',
        border: `1px solid ${ad.accent}`,
        transition: 'all 160ms ease',
      }}>
        {ad.cta}
        <span style={{ display: 'inline-block', transform: hover ? 'translateX(2px)' : 'none', transition: 'transform 160ms ease' }}>→</span>
      </span>
    </a>
  );
}

// Ribbon — thin one-line sponsored row, low intrusion
function AdRibbon({ ad }) {
  const [hover, setHover] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        background: 'transparent',
        border: '1px dashed var(--border-med)',
        borderLeft: `2px dashed ${ad.accent}`,
        textDecoration: 'none', color: 'inherit',
        transition: 'background 160ms ease',
        backgroundColor: hover ? 'var(--border-soft)' : 'transparent',
      }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 8,
        letterSpacing: '0.36em', textTransform: 'uppercase',
        color: 'var(--text-5)',
        padding: '2px 6px', border: '1px solid var(--border-med)',
        flexShrink: 0,
      }}>Ad</span>
      <span style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: '0.14em',
        color: ad.accent,
        flexShrink: 0,
      }}>{ad.wordmark}</span>
      <span style={{
        fontFamily: 'Barlow, sans-serif', fontSize: 13,
        color: 'var(--text-2)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flex: 1, minWidth: 0,
      }}>{ad.tagline}</span>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 10,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: ad.accent,
        flexShrink: 0,
      }}>{ad.cta} →</span>
    </a>
  );
}

// Feature — wide visual card every ~10 posts
function AdFeature({ ad }) {
  const [hover, setHover] = useState(false);
  return (
    <a href="#" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', display: 'block',
        background: `linear-gradient(135deg, ${ad.accent}1a 0%, #0A0F18 60%)`,
        border: `1px solid ${ad.accent}33`,
        padding: '32px',
        textDecoration: 'none', color: 'inherit',
        overflow: 'hidden',
        transition: 'border-color 200ms ease',
        borderColor: hover ? `${ad.accent}66` : `${ad.accent}33`,
      }}>
      {/* corner accent */}
      <span style={{
        position: 'absolute', top: 0, right: 0,
        width: 200, height: 200,
        background: `radial-gradient(circle at top right, ${ad.accent}22, transparent 60%)`,
        pointerEvents: 'none',
      }}/>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 9,
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'var(--text-4)',
        padding: '3px 8px', border: '1px solid var(--border-strong)',
        position: 'relative', zIndex: 1,
      }}>Featured Sponsor</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 44, height: 44,
          background: `${ad.accent}26`, border: `1px solid ${ad.accent}66`,
          color: ad.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.04em',
        }}>{ad.name[0]}</div>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, letterSpacing: '0.16em',
          color: 'var(--text-strong)',
        }}>{ad.wordmark}</span>
      </div>
      <p style={{
        margin: '14px 0 8px',
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 28, lineHeight: 1.2, fontWeight: 700,
        color: 'var(--text-strong)',
        maxWidth: 560,
        position: 'relative', zIndex: 1,
      }}>{ad.tagline}</p>
      <p style={{
        margin: '0 0 20px',
        fontFamily: 'Barlow, sans-serif', fontSize: 15, lineHeight: 1.5,
        color: 'var(--text-2)',
        maxWidth: 560,
        position: 'relative', zIndex: 1,
      }}>{ad.body}</p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 20px',
        fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11,
        letterSpacing: '0.24em', textTransform: 'uppercase',
        color: hover ? '#0A0F18' : ad.accent,
        background: hover ? ad.accent : 'transparent',
        border: `1px solid ${ad.accent}`,
        transition: 'all 160ms ease',
        position: 'relative', zIndex: 1,
      }}>
        {ad.cta}
        <span style={{ display: 'inline-block', transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 160ms ease' }}>→</span>
      </span>
    </a>
  );
}

// ──────────────────────────────────────────────────────────────────────
// FEED — interleaves posts with ads at every 3rd item
// ──────────────────────────────────────────────────────────────────────
function CommunityFeed({ posts, sponsors, pillars }) {
  // Build interleaved list: post post post AD post post post AD ...
  // Sponsors cycle, with the featured one used at position 9
  const items = [];
  let adIdx = 0;
  posts.forEach((post, i) => {
    items.push({ kind: 'post', data: post });
    if ((i + 1) % 3 === 0 && i < posts.length - 1) {
      const isFeature = (i + 1) === 9; // big feature ad after 9 posts
      const candidates = isFeature
        ? sponsors.filter(s => s.kind === 'feature')
        : sponsors.filter(s => s.kind !== 'feature');
      const ad = candidates[adIdx % candidates.length];
      items.push({ kind: ad.kind, data: ad });
      adIdx++;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => {
        if (item.kind === 'post')    return <PostCard key={`p-${item.data.id}-${i}`} post={item.data} pillars={pillars}/>;
        if (item.kind === 'ribbon')  return <AdRibbon key={`a-${item.data.id}-${i}`} ad={item.data}/>;
        if (item.kind === 'feature') return <AdFeature key={`a-${item.data.id}-${i}`} ad={item.data}/>;
        return <AdInline key={`a-${item.data.id}-${i}`} ad={item.data}/>;
      })}
    </div>
  );
}

Object.assign(window, { CommunityFeed, PostCard, AdInline, AdRibbon, AdFeature });
