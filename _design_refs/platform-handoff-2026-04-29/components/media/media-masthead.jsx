/* global React */

// ──────────────────────────────────────────────────────────────────────
// Editorial primitives — used across all media-* files
// ──────────────────────────────────────────────────────────────────────

const ED = {
  bg:        '#F5F0E8',
  surface:   '#FFFFFF',
  border:    '#E0D8CC',
  borderSoft:'#EAE3D5',
  text:      '#1B2A4A',
  textMuted: '#6B7A8D',
  textSubtle:'#8A9099',
  navy:      '#1B2A4A',
  red:       '#C9302A',
  gold:      '#8B6A00',
  goldSoft:  '#C9A84C',
  cream:     '#FAF6EE',
};

// Striped placeholder image. tone picks the wash color.
function EdPlaceholder({ tone = 'navy', label = 'Photo', ratio = '16 / 10', height }) {
  const TONES = {
    navy:    { base: '#1B2A4A', stripe: '#243557', accent: '#C9A84C' },
    gold:    { base: '#C9A84C', stripe: '#B59238', accent: '#1B2A4A' },
    crimson: { base: '#C9302A', stripe: '#A82923', accent: '#F5F0E8' },
    forge:   { base: '#7A2A2A', stripe: '#642121', accent: '#F87171' },
    teal:    { base: '#0A9980', stripe: '#08826D', accent: '#F5F0E8' },
    blue:    { base: '#3D6BB8', stripe: '#345C9F', accent: '#F5F0E8' },
    amber:   { base: '#E08C2A', stripe: '#C57820', accent: '#1B2A4A' },
    violet:  { base: '#7A5FD9', stripe: '#664DC4', accent: '#F5F0E8' },
    cream:   { base: '#E8DFC9', stripe: '#DCD2BB', accent: '#1B2A4A' },
  };
  const t = TONES[tone] || TONES.navy;
  return (
    <div style={{
      position: 'relative',
      aspectRatio: height ? undefined : ratio,
      height: height || undefined,
      width: '100%',
      background: `repeating-linear-gradient(135deg, ${t.base} 0 24px, ${t.stripe} 24px 48px)`,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, transparent 50%, ${t.base}AA 100%)`,
      }}/>
      <span style={{
        position: 'absolute', left: 14, bottom: 12,
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.4)',
        color: t.accent,
        fontFamily: '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace',
        fontSize: 10,
        letterSpacing: '0.04em',
      }}>{label}</span>
    </div>
  );
}

// Category chip
function EdCategoryChip({ category, size = 'md' }) {
  const colors = (window.MEDIA_DATA && window.MEDIA_DATA.CATEGORY_COLORS) || {};
  const color = colors[category] || ED.navy;
  const px = size === 'sm' ? '3px 7px' : '4px 9px';
  const fs = size === 'sm' ? 9 : 10;
  return (
    <span style={{
      display: 'inline-block',
      padding: px,
      background: 'transparent',
      borderLeft: `3px solid ${color}`,
      paddingLeft: size === 'sm' ? 7 : 9,
      paddingRight: 0,
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 700,
      fontSize: fs,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color,
    }}>{category}</span>
  );
}

// Bookmark icon button (saves visually toggled)
function EdBookmark({ saved, onToggle, size = 16 }) {
  return (
    <button type="button" onClick={onToggle} aria-label={saved ? 'Saved' : 'Save for later'}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, padding: 0,
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: saved ? ED.red : ED.textMuted,
        transition: 'color 120ms ease',
      }}
      onMouseEnter={(e) => { if (!saved) e.currentTarget.style.color = ED.text; }}
      onMouseLeave={(e) => { if (!saved) e.currentTarget.style.color = ED.textMuted; }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  );
}

// Share icon button (used inside EdShare)
function EdShareIcon({ label, onClick, children, accent }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, padding: 0,
        background: 'transparent',
        border: `1px solid ${hover ? (accent || ED.text) : ED.border}`,
        borderRadius: '50%',
        cursor: 'pointer',
        color: hover ? (accent || ED.text) : ED.textMuted,
        transition: 'color 120ms ease, border-color 120ms ease',
      }}>
      {children}
    </button>
  );
}

// Social share row — X / LinkedIn / Email / Copy link
function EdShare({ title, articleId, size = 'md' }) {
  const [copied, setCopied] = React.useState(false);
  const url = (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '') + (articleId ? `#${articleId}` : '');
  const text = encodeURIComponent(title || '');
  const u = encodeURIComponent(url);
  const stop = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn(); };
  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer');

  const onX = stop(() => open(`https://twitter.com/intent/tweet?text=${text}&url=${u}`));
  const onLI = stop(() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`));
  const onEmail = stop(() => open(`mailto:?subject=${text}&body=${u}`));
  const onCopy = stop(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  });

  const ic = size === 'sm' ? 11 : 13;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {size !== 'sm' && (
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 9,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: ED.textMuted, marginRight: 4,
        }}>Share</span>
      )}
      <EdShareIcon label="Share on X" onClick={onX} accent={ED.text}>
        <svg width={ic} height={ic} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.86l-5.37-6.93L4.1 22H.84l8.02-9.16L.5 2h7.04l4.86 6.43L18.244 2zm-2.4 18h1.9L7.26 4H5.27l10.574 16z"/>
        </svg>
      </EdShareIcon>
      <EdShareIcon label="Share on LinkedIn" onClick={onLI} accent="#0A66C2">
        <svg width={ic} height={ic} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zM10 9.5h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.32-1.96 2.7V21h-4V9.5z"/>
        </svg>
      </EdShareIcon>
      <EdShareIcon label="Email this story" onClick={onEmail} accent={ED.red}>
        <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="1"/>
          <path d="M3 7l9 6 9-6"/>
        </svg>
      </EdShareIcon>
      <EdShareIcon label={copied ? 'Link copied' : 'Copy link'} onClick={onCopy} accent={ED.gold}>
        {copied ? (
          <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : (
          <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/>
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>
          </svg>
        )}
      </EdShareIcon>
    </div>
  );
}

// Read-time + meta block
function EdMeta({ byline, date, readTime, compact }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 500,
      fontSize: compact ? 10 : 11,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      color: ED.textMuted,
    }}>
      {byline && <span style={{ color: ED.text, fontWeight: 700 }}>By {byline}</span>}
      {byline && <span style={{ opacity: 0.4 }}>·</span>}
      <span>{date}</span>
      {readTime != null && <span style={{ opacity: 0.4 }}>·</span>}
      {readTime != null && <span>{readTime} min read</span>}
    </div>
  );
}

// Hairline section header
function EdSectionHeader({ eyebrow, title, action, accent = ED.gold }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 24, flexWrap: 'wrap',
      paddingBottom: 12,
      borderBottom: `1px solid ${ED.border}`,
      position: 'relative',
    }}>
      <span style={{ position: 'absolute', left: 0, bottom: -1, width: 64, height: 2, background: accent }}/>
      <div>
        {eyebrow && <p style={{
          margin: 0,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: accent,
        }}>{eyebrow}</p>}
        <h2 style={{
          margin: eyebrow ? '4px 0 0' : 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: 28,
          letterSpacing: '-0.01em',
          color: ED.text,
        }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

// IAB Ad placeholders
function EdAdSlot({ size = 'leaderboard', label }) {
  const SIZES = {
    leaderboard:  { w: 728, h: 90,  display: 'Leaderboard 728\u00d790' },
    medRect:      { w: 300, h: 250, display: 'Medium Rectangle 300\u00d7250' },
    halfPage:     { w: 300, h: 600, display: 'Half Page 300\u00d7600' },
    billboard:    { w: 970, h: 250, display: 'Billboard 970\u00d7250' },
    mobileBanner: { w: 320, h: 50,  display: 'Mobile Banner 320\u00d750' },
  };
  const s = SIZES[size] || SIZES.medRect;
  return (
    <aside aria-label="Advertisement"
      style={{
        width: s.w, maxWidth: '100%', height: s.h,
        background: '#EFE9DC',
        border: `1px dashed ${ED.border}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 6,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
      <span style={{
        position: 'absolute', top: 6, left: 8,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 9,
        letterSpacing: '0.32em', textTransform: 'uppercase',
        color: ED.textSubtle,
      }}>Advertisement</span>
      <span style={{
        fontFamily: '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace',
        fontSize: 11, color: ED.textMuted,
      }}>{s.display}</span>
      {label && (
        <span style={{
          fontFamily: 'Barlow, sans-serif',
          fontSize: 12, color: ED.textSubtle,
        }}>{label}</span>
      )}
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
// MEDIA MASTHEAD — the publication identity, sits below the platform topnav
// ──────────────────────────────────────────────────────────────────────

function MediaMasthead({ activeNav = 'Top Stories', onNav }) {
  const today = new Date('2026-04-27T08:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const issueNo = '№ 0421';
  const nav = (window.MEDIA_DATA && window.MEDIA_DATA.MEDIA_NAV) || [];

  return (
    <header style={{ background: ED.bg, borderBottom: `1px solid ${ED.border}` }}>
      {/* Date strip */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '14px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 11, fontWeight: 500,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: ED.textMuted,
      }}>
        <span>{today}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span>Issue {issueNo}</span>
          <span style={{ width: 1, height: 12, background: ED.border }}/>
          <a href="#community" style={{ color: ED.text, textDecoration: 'none' }}>Community</a>
          <a href="#events" style={{ color: ED.text, textDecoration: 'none' }}>Events</a>
          <a href="#podcast" style={{ color: ED.text, textDecoration: 'none' }}>Podcast</a>
          <a href="#live" style={{ color: ED.text, textDecoration: 'none' }}>Live</a>
        </span>
      </div>

      {/* Masthead title */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '20px 24px 12px',
        textAlign: 'center', position: 'relative',
      }}>
        <h1 style={{
          margin: '6px 0 0',
          fontFamily: 'Abril Fatface, "Playfair Display", Georgia, serif',
          fontWeight: 400,
          fontSize: 'clamp(56px, 9vw, 108px)',
          lineHeight: 0.95,
          letterSpacing: '0.005em',
          color: ED.text,
        }}>
          <span style={{ color: ED.red }}>Evolved</span> <span style={{ color: ED.navy }}>Media</span>
        </h1>
        <p style={{
          margin: '10px 0 0',
          fontFamily: 'Playfair Display, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 16,
          color: ED.textMuted,
        }}>Promoting evolution — the topics George is actively researching, learning, and teaching.</p>
      </div>

      {/* Hairlines */}
      <div style={{ maxWidth: 1280, margin: '8px auto 0', padding: '0 24px' }}>
        <div style={{ height: 1, background: ED.text }}/>
        <div style={{ height: 3, background: 'transparent' }}/>
        <div style={{ height: 1, background: ED.text }}/>
      </div>

      {/* Category nav */}
      <nav style={{
        maxWidth: 1280, margin: '0 auto', padding: '12px 24px 14px',
        display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
      }}>
        {nav.map((n) => {
          const active = n.label === activeNav;
          return (
            <a key={n.label} href={n.href}
              onClick={(e) => { e.preventDefault(); onNav && onNav(n.label); }}
              style={{
                position: 'relative',
                padding: '6px 10px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: active ? ED.red : ED.text,
                textDecoration: 'none',
                borderBottom: active ? `2px solid ${ED.red}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 120ms ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = ED.red; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = ED.text; }}
            >{n.label}</a>
          );
        })}
        <span style={{ flex: 1 }}/>
        <button type="button" aria-label="Search"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'transparent',
            border: `1px solid ${ED.border}`,
            color: ED.text, cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          Search
        </button>
      </nav>
    </header>
  );
}

// Make primitives available globally
window.ED = ED;
window.EdPlaceholder = EdPlaceholder;
window.EdCategoryChip = EdCategoryChip;
window.EdBookmark = EdBookmark;
window.EdMeta = EdMeta;
window.EdShare = EdShare;
window.EdSectionHeader = EdSectionHeader;
window.EdAdSlot = EdAdSlot;
window.MediaMasthead = MediaMasthead;
