/* global React */
const { useState: useStateHero } = React;

// ─────────────────────────────────────────────────────────────────
// PodcastLatestStrip — sits below TopNav, full-width
// "LATEST EPISODE" red chip + title + meta + Watch on YouTube CTA
// ─────────────────────────────────────────────────────────────────
function PodcastLatestStrip({ episode, onWatch }) {
  const fmtDate = window.PODCAST_DATA.fmtDate;

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid var(--border-soft2)',
      background: 'var(--bg-surface)',
      fontFamily: 'Barlow, sans-serif',
    }}>
      {/* Red latest-episode chip */}
      <div style={{
        background: '#C9302A', color: '#fff',
        padding: '0 18px',
        display: 'flex', alignItems: 'center',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800, fontSize: 11,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        flexShrink: 0,
      }}>Latest episode</div>

      {/* Episode title + meta */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', gap: 18,
        padding: '12px 24px',
        minWidth: 0,
      }}>
        <span style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 16, fontWeight: 700, color: 'var(--text-strong)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1, minWidth: 0,
        }}>{episode.title}</span>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--text-5)', flexShrink: 0,
        }}/>
        <span style={{ fontSize: 13, color: 'var(--text-2)', flexShrink: 0 }}>{episode.guest.name}</span>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--text-5)', flexShrink: 0,
        }}/>
        <span style={{ fontSize: 13, color: 'var(--text-3)', flexShrink: 0 }}>{fmtDate(episode.releasedAt)}</span>
      </div>

      {/* YouTube CTA */}
      <button type="button" onClick={onWatch}
        style={{
          background: '#C9302A', color: '#fff',
          border: 'none', cursor: 'pointer',
          padding: '0 22px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800, fontSize: 12,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          flexShrink: 0,
          transition: 'background 120ms ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#a8231f'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#C9302A'}
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z"/></svg>
        Watch on YouTube
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PodcastMasthead — matches Community/Events header pattern
// EYEBROW (Barlow Condensed, gold, 0.42em) → TITLE (Bebas Neue 56px)
// → SUBTITLE (Playfair Italic 16px)
// ─────────────────────────────────────────────────────────────────
function PodcastMasthead() {
  return (
    <header style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '32px 24px 24px',
      borderBottom: '1px solid var(--border-soft2)',
      fontFamily: 'Barlow, sans-serif',
    }}>
      <p style={{
        margin: 0,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.85)',
      }}>The Evolved Pros</p>
      <h1 style={{
        margin: '6px 0 8px',
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 56, letterSpacing: '0.04em',
        color: 'var(--text-strong)',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>The Podcast</h1>
      <p style={{
        margin: 0,
        fontFamily: 'Playfair Display, Georgia, serif',
        fontStyle: 'italic',
        fontSize: 16, lineHeight: 1.5,
        color: 'var(--text-2)',
        maxWidth: 640,
      }}>Real conversations with the pros who are crushing it &mdash; from the field, from the trenches, and in real life.</p>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────
// PodcastHero — full-bleed cinematic hero matching Events.
// Background image (guest portrait), heavy bottom fade, content
// bottom-aligned with red LATEST chip, gold #N, Playfair title,
// guest line, blurb, watch CTAs.
// ─────────────────────────────────────────────────────────────────
function PodcastHero({ episode, onWatch }) {
  const PILLARS = window.PODCAST_DATA.PILLARS;
  const fmtDate = window.PODCAST_DATA.fmtDate;
  const pillar = PILLARS[episode.pillar];

  return (
    <React.Fragment>
      {/* ── 1. IMAGE-ONLY BANNER ─────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: 460,
        overflow: 'hidden',
        background: '#0A0F18',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${episode.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 28%',
        }}/>
        {/* Subtle bottom fade so the card edge sits cleanly */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,15,24,0) 60%, rgba(10,15,24,0.45) 100%)',
        }}/>
        {/* Pillar accent wash */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 18% 75%, ${pillar.color}26 0%, transparent 55%)`,
        }}/>

        {/* Top row — latest tag + runtime — floats over image */}
        {/* Top row — runtime only — floats over image */}
        <div style={{
          position: 'absolute', top: 28, left: 0, right: 0,
          maxWidth: 1280, margin: '0 auto',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: 'flex-end',
        }}>
          <span style={{
            padding: '8px 14px',
            background: 'rgba(10,15,24,0.55)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 13,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#fff',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Runtime</span>
            <span>{episode.duration}:00</span>
          </span>
        </div>
      </section>

      {/* ── 2. EPISODE INTRO CARD ────────────────────────────── */}
      <section style={{
        maxWidth: 1280, margin: '-72px auto 0',
        padding: '0 24px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft2)',
          borderTop: `3px solid ${pillar.color}`,
          padding: '36px 40px 32px',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.35)',
        }}>
          {/* Eyebrow: LATEST EPISODE · pillar · #N · date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 10px',
              background: 'rgba(201,48,42,0.12)',
              border: '1px solid rgba(201,48,42,0.5)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: '#C9302A',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#ef0e30',
                boxShadow: '0 0 8px #ef0e30',
              }}/>
              Latest episode
            </span>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: pillar.color,
            }}>{pillar.label}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-5)' }}/>
            <span style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 18, color: '#C9A84C',
            }}>Episode #{episode.episode}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-5)' }}/>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600, fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}>{fmtDate(episode.releasedAt)}</span>
          </div>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 'clamp(32px, 4.2vw, 48px)',
            lineHeight: 1.08, letterSpacing: '-0.015em',
            color: 'var(--text-strong)', textWrap: 'pretty',
            maxWidth: 880,
          }}>{episode.title}</h1>

          <p style={{
            margin: '14px 0 0',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 17, lineHeight: 1.55,
            color: 'var(--text-2)',
            maxWidth: 720,
          }}>{episode.blurb}</p>

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 24,
            marginTop: 24, paddingTop: 20, flexWrap: 'wrap',
            borderTop: '1px solid var(--border-soft)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={episode.guest.photo} alt={episode.guest.name}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--border-med2)', objectFit: 'cover' }}/>
              <div>
                <p style={{ margin: 0, fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{episode.guest.name}</p>
                <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{episode.guest.role}</p>
              </div>
            </div>
            <span style={{ width: 1, height: 28, background: 'var(--border-soft2)' }}/>
            <div>
              <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-4)' }}>Released</p>
              <p style={{ margin: '2px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{fmtDate(episode.releasedAt)}, 2026</p>
            </div>
            <span style={{ width: 1, height: 28, background: 'var(--border-soft2)' }}/>
            <div>
              <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-4)' }}>Watch on</p>
              <p style={{ margin: '2px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>YouTube &middot; Spotify &middot; Apple</p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button type="button" onClick={onWatch} style={{
              padding: '14px 28px',
              background: '#ef0e30',
              color: '#fff',
              border: '1px solid #ef0e30',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 13,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'background 120ms ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ff1a40'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef0e30'}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z"/></svg>
              Watch episode
            </button>
            <button type="button" style={{
              padding: '14px 20px',
              background: 'transparent',
              color: 'var(--text-strong)',
              border: '1px solid var(--border-strong)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Save
            </button>
            {/* Share — channel-icon group */}
            <div style={{
              display: 'inline-flex', alignItems: 'stretch',
              border: '1px solid var(--border-strong)',
              height: 46,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '0 14px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 11,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: 'var(--text-3)',
                borderRight: '1px solid var(--border-soft2)',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </span>
              {[
                { key: 'x', label: 'Share on X', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { key: 'linkedin', label: 'Share on LinkedIn', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.268 2.37 4.268 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { key: 'facebook', label: 'Share on Facebook', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                { key: 'email', label: 'Share via email', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                { key: 'link', label: 'Copy link', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
              ].map((c, i) => (
                <button key={c.key} type="button" title={c.label} aria-label={c.label}
                  style={{
                    width: 44, height: '100%',
                    padding: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    color: 'var(--text-2)',
                    border: 'none',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--border-soft)',
                    cursor: 'pointer',
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.color = 'var(--text-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }}
                >
                  {c.svg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </React.Fragment>
  );
}

window.PodcastLatestStrip = PodcastLatestStrip;
window.PodcastMasthead = PodcastMasthead;
window.PodcastHero = PodcastHero;
