/* global React, SPEAKING_STATS */
const { useState: useHeroState } = React;

// ──────────────────────────────────────────────────────────────────────
// LIVE — Masthead (parchment-style title strip, matches Podcast)
// ──────────────────────────────────────────────────────────────────────
function LiveMasthead() {
  return (
    <header style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '32px 24px 20px',
      borderBottom: '1px solid var(--border-soft2)',
      fontFamily: 'Barlow, sans-serif',
    }}>
      <p style={{
        margin: 0,
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.42em', textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.85)',
      }}>Evolved Pros</p>
      <h1 style={{
        margin: '6px 0 8px',
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 96, letterSpacing: '0.06em',
        color: 'var(--text-strong)',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>Live</h1>
      <p style={{
        margin: 0,
        fontFamily: 'Playfair Display, Georgia, serif',
        fontStyle: 'italic',
        fontSize: 16, lineHeight: 1.5,
        color: 'var(--text-2)',
        maxWidth: 720,
      }}>Keynotes, panels, and workshops &mdash; from the field, from the trenches, and on stages around the world.</p>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────────────
// LiveSplitHero — photo right, copy left (matches Events split variant)
// ──────────────────────────────────────────────────────────────────────
function LiveSplitHero({ photo, onBook, onReel }) {
  const stats = window.SPEAKING_STATS;
  return (
    <section style={{
      position: 'relative',
      maxWidth: 1280, margin: '0 auto',
      padding: '32px 24px 0',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '6fr 6fr',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-soft2)',
        borderTop: '3px solid #C9A84C',
        minHeight: 520,
        overflow: 'hidden',
      }}>
        {/* LEFT — copy panel */}
        <div style={{
          padding: '44px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef0e30' }}/>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: '#ef0e30',
            }}>Evolved Pros Live</span>
          </div>

          <h2 style={{
            margin: 0,
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 'clamp(34px, 4vw, 52px)',
            lineHeight: 1.05, letterSpacing: '-0.015em',
            color: 'var(--text-strong)', textWrap: 'pretty',
          }}>Bring the <span style={{ color: '#C9A84C' }}>EVOLVED</span> system to your stage.</h2>

          <p style={{
            margin: '18px 0 0',
            fontFamily: 'Barlow, sans-serif',
            fontSize: 17, lineHeight: 1.55,
            color: 'var(--text-2)',
            maxWidth: 540,
          }}>High-energy keynotes, workshops, and mastermind formats for sales conferences, SKOs, and revenue leadership summits. Powered by the EVOLVED Architecture™.</p>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            marginTop: 32,
            borderTop: '1px solid var(--border-soft)',
            borderBottom: '1px solid var(--border-soft)',
          }}>
            {[
              { k: 'stages worldwide',  v: `${stats.talks}+` },
              { k: 'countries',         v: stats.countries },
              { k: 'mentees coached',   v: stats.mentees },
            ].map((x, i) => (
              <div key={i} style={{
                padding: '16px 14px',
                borderLeft: i === 0 ? 'none' : '1px solid var(--border-soft)',
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 36, lineHeight: 1, letterSpacing: '0.04em',
                  color: '#C9A84C',
                }}>{x.v}</p>
                <p style={{
                  margin: '4px 0 0',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}>{x.k}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <button type="button" onClick={onBook} style={{
              padding: '14px 28px',
              background: '#ef0e30',
              color: '#fff',
              border: '1px solid #ef0e30',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 13,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>Inquire about booking</button>
          </div>
        </div>

        {/* RIGHT — photo */}
        <div style={{
          position: 'relative',
          minHeight: 520,
          background: '#0A0F18',
        }}>
          {photo ? (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}/>
          ) : (
            <PhotoPlaceholder/>
          )}
          {/* Inner edge fade for legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(10,15,24,0.55) 0%, transparent 25%), linear-gradient(180deg, transparent 60%, rgba(10,15,24,0.55) 100%)',
          }}/>
          {/* Photo caption */}
          <div style={{
            position: 'absolute', bottom: 20, right: 20,
            padding: '8px 12px',
            background: 'rgba(10,15,24,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
          }}>On Stage &middot; 2024</div>
        </div>
      </div>
    </section>
  );
}

// Striped placeholder when no photo provided yet
function PhotoPlaceholder() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-linear-gradient(135deg, #1A2332 0 22px, #14202F 22px 44px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{
          margin: 0,
          fontFamily: 'Courier New, monospace',
          fontSize: 12, letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}>[ speaker photo ]</p>
        <p style={{
          margin: '8px 0 0',
          fontFamily: 'Courier New, monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.32)',
        }}>drop image into /assets &amp; pass photo prop</p>
      </div>
    </div>
  );
}

window.LiveMasthead = LiveMasthead;
window.LiveSplitHero = LiveSplitHero;
