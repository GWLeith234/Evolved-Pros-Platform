/* global React, EVENTS_DATA, fmtTime, fmtDateLong, fmtRelative */
const { useState, useEffect } = React;

// ──────────────────────────────────────────────────────────────────────
// EVENTS HERO — full-bleed cover image with overlay
// Three variants surfaced via Tweaks:
//   'cinematic'   — full bleed, bottom-aligned content, red live dot
//   'split'       — image fills, content in a pinned left panel
//   'countdown'   — image fills, massive countdown clock centered
// ──────────────────────────────────────────────────────────────────────

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, total: diff };
}

function LiveDot({ color = '#ef0e30' }) {
  return (
    <span style={{
      position: 'relative',
      display: 'inline-flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        boxShadow: `0 0 0 0 ${color}`,
        animation: 'ev-pulse 1.6s ease-out infinite',
      }}/>
    </span>
  );
}

function AttendingAvatars({ initials = [], total = 0, color = '#fff' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'inline-flex' }}>
        {initials.slice(0, 4).map((i, idx) => (
          <span key={idx} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `hsl(${(idx * 67) % 360}, 42%, 44%)`,
            border: '2px solid #0A0F18',
            marginLeft: idx === 0 ? 0 : -8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 10,
            color: '#fff', letterSpacing: '0.04em',
          }}>{i}</span>
        ))}
      </div>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 600, fontSize: 11,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color,
      }}>{total} from your circle</span>
    </div>
  );
}

function EventsHero({ event, variant = 'cinematic', onRsvp, onShare, onInvite, rsvpd }) {
  const { h, m, s } = useCountdown(event.starts.getTime());
  const live = event.starts.getTime() - Date.now() < 3600000; // within 1h
  const pad = (n) => String(n).padStart(2, '0');

  if (variant === 'split') return (
    <SplitHero event={event} onRsvp={onRsvp} onShare={onShare} onInvite={onInvite} rsvpd={rsvpd}/>
  );
  if (variant === 'countdown') return (
    <CountdownHero event={event} h={h} m={m} s={s} onRsvp={onRsvp} onShare={onShare} onInvite={onInvite} rsvpd={rsvpd}/>
  );

  // CINEMATIC (default)
  return (
    <section style={{
      position: 'relative',
      height: 560,
      marginBottom: 32,
      overflow: 'hidden',
      background: '#0A0F18',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: 'scale(1.02)',
      }}/>
      {/* Overlays: vertical fade for legibility + colored accent wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,15,24,0.0) 0%, rgba(10,15,24,0.55) 55%, rgba(10,15,24,0.95) 100%)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 20% 70%, ${event.accent}33 0%, transparent 55%)`,
      }}/>

      {/* Content */}
      <div style={{
        position: 'relative',
        maxWidth: 1280, height: '100%',
        margin: '0 auto',
        padding: '0 24px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Top row — live tag + meta */}
        <div style={{
          position: 'absolute', top: 32, left: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: live ? 'rgba(239,14,48,0.18)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${live ? 'rgba(239,14,48,0.55)' : 'rgba(255,255,255,0.2)'}`,
            backdropFilter: 'blur(10px)',
          }}>
            {live && <LiveDot/>}
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: live ? '#fff' : 'rgba(255,255,255,0.85)',
            }}>{live ? 'Starting soon · Live' : 'Live event'}</span>
          </span>
          {event.myEvents && (
            <span style={{
              padding: '6px 10px',
              background: 'rgba(201,168,76,0.18)',
              border: '1px solid rgba(201,168,76,0.55)',
              backdropFilter: 'blur(10px)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#E8B547',
            }}>✓ On your calendar</span>
          )}
          <span style={{ flex: 1 }}/>
          {/* Countdown pill */}
          {event.starts.getTime() > Date.now() && (
            <span style={{
              padding: '8px 14px',
              background: 'rgba(10,15,24,0.5)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(10px)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#fff',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Starts in</span>
              <span>{pad(h)}:{pad(m)}:{pad(s)}</span>
            </span>
          )}
        </div>

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{
            width: 4, height: 20, background: event.pillarColor,
          }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: event.pillarColor,
          }}>{event.pillar.replace('-',' ')} · Featured</span>
        </div>

        {/* Title */}
        <h1 style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: 'clamp(36px, 5vw, 60px)',
          lineHeight: 1.05, letterSpacing: '-0.015em',
          color: '#fff', textWrap: 'pretty',
          maxWidth: 900,
        }}>{event.title}</h1>

        <p style={{
          margin: '16px 0 0',
          fontFamily: 'Barlow, sans-serif',
          fontSize: 18, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.8)',
          maxWidth: 640,
        }}>{event.subtitle || event.description}</p>

        {/* Meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          marginTop: 24, flexWrap: 'wrap',
        }}>
          {/* Host */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={event.host.avatar} alt={event.host.name}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}/>
            <div>
              <p style={{ margin: 0, fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>{event.host.name}</p>
              <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{event.host.role}</p>
            </div>
          </div>
          <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }}/>
          <div>
            <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>When</p>
            <p style={{ margin: '2px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>{fmtDateLong(event.starts)} · {fmtTime(event.starts)} PT</p>
          </div>
          <span style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }}/>
          <div>
            <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Price</p>
            <p style={{ margin: '2px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: event.price === 'Included' ? '#19C9A6' : '#fff' }}>{event.price}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <button type="button" onClick={onRsvp} style={{
            padding: '14px 28px',
            background: rsvpd ? 'transparent' : '#ef0e30',
            color: rsvpd ? '#fff' : '#fff',
            border: `1px solid ${rsvpd ? 'rgba(255,255,255,0.3)' : '#ef0e30'}`,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 13,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>{rsvpd ? '✓ On your calendar' : 'Add to my events'}</button>
          <button type="button" onClick={onShare} style={{
            padding: '14px 20px',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 12,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            Share
          </button>
          <button type="button" onClick={onInvite} style={{
            padding: '14px 20px',
            background: 'transparent',
            color: '#E8B547',
            border: '1px solid rgba(232,181,71,0.5)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 12,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 11h-6M20 8v6"/><circle cx="8.5" cy="7" r="4"/></svg>
            Invite a friend
          </button>
          <span style={{ flex: 1 }}/>
          {event.circleGoing && event.circleGoing.length > 0 && (
            <AttendingAvatars initials={event.circleGoing} total={event.circleGoing.length}/>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Split hero: image right, content left panel ──────────────
function SplitHero({ event, onRsvp, onShare, onInvite, rsvpd }) {
  return (
    <section style={{
      position: 'relative',
      height: 560, marginBottom: 32,
      display: 'grid', gridTemplateColumns: '5fr 7fr',
      background: '#0A0F18', overflow: 'hidden',
    }}>
      {/* Left panel */}
      <div style={{
        padding: '48px 48px 48px 24px',
        maxWidth: 640,
        marginLeft: 'auto', width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0F18 0%, #111926 100%)',
        borderRight: `4px solid ${event.accent}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 4, height: 20, background: event.pillarColor }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: event.pillarColor,
          }}>{event.pillar.replace('-', ' ')} · Featured</span>
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: 'clamp(32px, 4vw, 48px)',
          lineHeight: 1.1, letterSpacing: '-0.01em',
          color: '#fff', textWrap: 'pretty',
        }}>{event.title}</h1>
        <p style={{
          margin: '14px 0 0',
          fontFamily: 'Barlow, sans-serif', fontSize: 16, lineHeight: 1.55,
          color: 'rgba(255,255,255,0.75)',
        }}>{event.subtitle || event.description}</p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 0, marginTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { k: 'When',   v: fmtDateLong(event.starts) },
            { k: 'Time',   v: `${fmtTime(event.starts)} PT` },
            { k: 'Price',  v: event.price, highlight: event.price === 'Included' ? '#19C9A6' : null },
          ].map((x, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{x.k}</p>
              <p style={{ margin: '4px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 600, color: x.highlight || '#fff' }}>{x.v}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button type="button" onClick={onRsvp} style={{
            padding: '12px 24px',
            background: rsvpd ? 'transparent' : '#ef0e30',
            color: '#fff',
            border: `1px solid ${rsvpd ? 'rgba(255,255,255,0.3)' : '#ef0e30'}`,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 12,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>{rsvpd ? '✓ Added' : 'Add to my events'}</button>
          <button type="button" onClick={onShare} style={{
            padding: '12px 16px', background: 'rgba(255,255,255,0.06)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>Share</button>
          <button type="button" onClick={onInvite} style={{
            padding: '12px 16px', background: 'transparent', color: '#E8B547',
            border: '1px solid rgba(232,181,71,0.5)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>Invite</button>
        </div>

        {event.circleGoing && event.circleGoing.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <AttendingAvatars initials={event.circleGoing} total={event.circleGoing.length}/>
          </div>
        )}
      </div>

      {/* Right image */}
      <div style={{
        position: 'relative',
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, rgba(10,15,24,0.6) 0%, transparent 30%), radial-gradient(ellipse at 80% 20%, ${event.accent}44 0%, transparent 60%)`,
        }}/>
      </div>
    </section>
  );
}

// ─── Countdown hero: massive clock dominant ─────────
function CountdownHero({ event, h, m, s, onRsvp, onShare, onInvite, rsvpd }) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <section style={{
      position: 'relative',
      height: 560, marginBottom: 32,
      overflow: 'hidden',
      background: '#0A0F18',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.45) blur(2px)',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${event.accent}22 0%, transparent 55%), linear-gradient(180deg, rgba(10,15,24,0.3) 0%, rgba(10,15,24,0.85) 100%)`,
      }}/>

      <div style={{
        position: 'relative',
        maxWidth: 1280, height: '100%', margin: '0 auto',
        padding: '0 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ width: 28, height: 1, background: event.pillarColor }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.38em', textTransform: 'uppercase',
            color: event.pillarColor,
          }}>Next Live · {event.pillar.replace('-', ' ')}</span>
          <span style={{ width: 28, height: 1, background: event.pillarColor }}/>
        </div>

        {/* Giant countdown */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 24,
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 20,
        }}>
          {[
            { v: pad(h), k: 'Hours' },
            { v: pad(m), k: 'Minutes' },
            { v: pad(s), k: 'Seconds' },
          ].map((x, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 96, lineHeight: 1, color: event.accent,
                  opacity: 0.4,
                }}>:</span>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 'clamp(80px, 10vw, 140px)', lineHeight: 1,
                  color: '#fff',
                  letterSpacing: '0.02em',
                }}>{x.v}</div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.38em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 6,
                }}>{x.k}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <h1 style={{
          margin: 0, maxWidth: 820,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontWeight: 700, fontSize: 'clamp(28px, 3.2vw, 40px)',
          lineHeight: 1.15, letterSpacing: '-0.01em',
          color: '#fff', textWrap: 'pretty',
        }}>{event.title}</h1>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginTop: 20,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600, fontSize: 12,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.7)',
        }}>
          <span>{event.host.name}</span>
          <span style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: '50%' }}/>
          <span>{fmtDateLong(event.starts)} · {fmtTime(event.starts)} PT</span>
          <span style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: '50%' }}/>
          <span style={{ color: event.price === 'Included' ? '#19C9A6' : '#fff' }}>{event.price}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28 }}>
          <button type="button" onClick={onRsvp} style={{
            padding: '14px 32px',
            background: rsvpd ? 'transparent' : '#ef0e30',
            color: '#fff',
            border: `1px solid ${rsvpd ? 'rgba(255,255,255,0.3)' : '#ef0e30'}`,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 13,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>{rsvpd ? '✓ On your calendar' : 'Add to my events'}</button>
          <button type="button" onClick={onInvite} style={{
            padding: '14px 20px', background: 'transparent', color: '#E8B547',
            border: '1px solid rgba(232,181,71,0.5)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}>Invite a friend</button>
        </div>
      </div>
    </section>
  );
}

// Keyframes injected once
(function injectEventsKeyframes() {
  if (document.getElementById('ev-keyframes')) return;
  const css = `
@keyframes ev-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(239,14,48,0.7); }
  70%  { box-shadow: 0 0 0 10px rgba(239,14,48,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,14,48,0); }
}
@keyframes ev-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
  `;
  const style = document.createElement('style');
  style.id = 'ev-keyframes';
  style.textContent = css;
  document.head.appendChild(style);
})();

Object.assign(window, { EventsHero });
