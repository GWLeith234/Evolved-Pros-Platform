/* global React, EVENTS_DATA, fmtTime, fmtDay, fmtRelative */
const { useState, useRef } = React;

// ──────────────────────────────────────────────────────────────────────
// EVENT CARDS + NETFLIX-STYLE SHELVES
// Cards come in three sizes/shapes:
//   Standard (16:9 cover, used in most shelves)
//   Tall    (2:3 portrait, spotlight shelf)
//   Podcast (1:1 square, episode shelf)
// ──────────────────────────────────────────────────────────────────────

function FormatChip({ format }) {
  const map = {
    live:        { label: 'Live', color: '#ef0e30', bg: 'rgba(239,14,48,0.18)' },
    replay:      { label: 'Replay', color: '#A86CFF', bg: 'rgba(168,108,255,0.15)' },
    'in-person': { label: 'In Person', color: '#E8B547', bg: 'rgba(232,181,71,0.16)' },
    podcast:     { label: 'Podcast', color: '#3FB8E8', bg: 'rgba(63,184,232,0.15)' },
  };
  const x = map[format] || map.live;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px',
      background: x.bg,
      border: `1px solid ${x.color}55`,
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 800, fontSize: 9,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: x.color,
      backdropFilter: 'blur(8px)',
    }}>
      {format === 'live' && <span style={{
        width: 6, height: 6, borderRadius: '50%', background: x.color,
        animation: 'ev-pulse 1.6s ease-out infinite',
      }}/>}
      {x.label}
    </span>
  );
}

function StandardEventCard({ event, saved, onToggle, onOpen }) {
  const isFuture = event.starts.getTime() > Date.now();
  const pct = event.capacity ? Math.min(100, (event.attending / event.capacity) * 100) : null;

  return (
    <article
      onClick={onOpen}
      style={{
        position: 'relative', cursor: 'pointer',
        width: '100%',
        background: '#111926',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 160ms ease, border-color 160ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Cover 16:9 */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderBottom: `2px solid ${event.accent}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(10,15,24,0.1) 0%, rgba(10,15,24,0.65) 100%)`,
        }}/>
        {/* Top chips */}
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
        }}>
          <FormatChip format={event.format}/>
          {event.myEvents && (
            <span style={{
              padding: '3px 8px',
              background: 'rgba(201,168,76,0.18)',
              border: '1px solid rgba(201,168,76,0.55)',
              backdropFilter: 'blur(8px)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 9,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#E8B547',
            }}>✓ Mine</span>
          )}
        </div>
        {/* Bottom left: pillar + start-in */}
        <div style={{
          position: 'absolute', left: 12, bottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 3, height: 14, background: event.pillarColor }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: event.pillarColor,
          }}>{event.pillar.replace('-',' ')}</span>
        </div>
        {/* Attending count top-right mini (hide if 0 for podcast) */}
        {event.attending > 0 && event.format !== 'podcast' && (
          <span style={{
            position: 'absolute', bottom: 10, right: 12,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600, fontSize: 10,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.8)',
          }}>{event.attending} going</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 16, fontWeight: 700, lineHeight: 1.25,
          color: '#fff',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textWrap: 'pretty',
        }}>{event.title}</h3>
        <p style={{
          margin: 0,
          fontFamily: 'Barlow, sans-serif', fontSize: 12, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.6)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{event.description}</p>

        {/* Host row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <img src={event.host.avatar} alt=""
            style={{ width: 22, height: 22, borderRadius: '50%' }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.85)',
          }}>{event.host.name}</span>
        </div>
      </div>

      {/* Footer meta */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: isFuture ? '#fff' : 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isFuture
              ? `${fmtDay(event.starts)} · ${fmtTime(event.starts)}`
              : event.endsLabel || `${fmtRelative(event.starts)}`}
          </p>
          <p style={{
            margin: '2px 0 0',
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: event.price === 'Included' ? '#19C9A6' : event.price === 'Pro only' ? '#E8B547' : 'rgba(255,255,255,0.55)',
          }}>{event.price}{event.location ? ` · ${event.location.split(' · ')[0]}` : ''}</p>
        </div>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            padding: '7px 10px',
            background: saved ? event.accent : 'transparent',
            color: saved ? '#0A0F18' : event.accent,
            border: `1px solid ${event.accent}`,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            cursor: 'pointer',
            flexShrink: 0,
          }}>{saved ? '✓ Added' : '+ Add'}</button>
      </div>
    </article>
  );
}

// Tall spotlight card (for retreats shelf)
function SpotlightEventCard({ event, saved, onToggle, onOpen }) {
  return (
    <article onClick={onOpen} style={{
      position: 'relative', cursor: 'pointer',
      width: '100%', aspectRatio: '3/4',
      background: '#111926',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'transform 160ms ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, rgba(10,15,24,0.1) 0%, rgba(10,15,24,0.4) 45%, rgba(10,15,24,0.95) 100%)`,
      }}/>

      {/* Top chips */}
      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <FormatChip format={event.format}/>
        {event.myEvents && (
          <span style={{
            padding: '3px 8px',
            background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.55)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800, fontSize: 9,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#E8B547',
          }}>✓ Mine</span>
        )}
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '20px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 3, height: 14, background: event.pillarColor }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: event.pillarColor,
          }}>{event.pillar.replace('-',' ')}</span>
        </div>
        <h3 style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 22, fontWeight: 700, lineHeight: 1.15,
          color: '#fff', textWrap: 'pretty',
        }}>{event.title}</h3>
        <p style={{
          margin: '8px 0 14px',
          fontFamily: 'Barlow, sans-serif', fontSize: 12.5, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.75)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{event.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <img src={event.host.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.85)',
          }}>{event.host.name}</span>
          <span style={{ flex: 1 }}/>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: event.price === 'Included' ? '#19C9A6' : '#E8B547',
          }}>{event.price}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            flex: 1,
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
          }}>{event.endsLabel || `${fmtDay(event.starts)} · ${fmtTime(event.starts)}`}</span>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{
              padding: '8px 14px',
              background: saved ? event.accent : 'rgba(10,15,24,0.6)',
              backdropFilter: 'blur(8px)',
              color: saved ? '#0A0F18' : '#fff',
              border: `1px solid ${event.accent}`,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>{saved ? '✓ Added' : '+ Add to events'}</button>
        </div>
      </div>
    </article>
  );
}

// Podcast square card (for episode shelf)
function PodcastEventCard({ event, saved, onToggle, onOpen }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article onClick={onOpen} style={{
      position: 'relative', cursor: 'pointer',
      width: '100%',
      background: '#111926',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      transition: 'transform 160ms ease, border-color 160ms ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(63,184,232,0.35)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div style={{
        position: 'relative', aspectRatio: '1/1',
        backgroundImage: `url(${event.cover})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, transparent 30%, rgba(10,15,24,0.85) 100%), linear-gradient(135deg, ${event.accent}22 0%, transparent 50%)`,
        }}/>
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <FormatChip format="podcast"/>
          {event.isNew && (
            <span style={{
              padding: '3px 7px',
              background: '#ef0e30', color: '#fff',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>New</span>
          )}
        </div>
        {/* Giant episode number */}
        <div style={{
          position: 'absolute', left: 14, bottom: 12,
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 54, lineHeight: 0.9,
          color: '#fff',
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 2px 20px rgba(0,0,0,0.6)',
        }}>{event.episodeNum}</div>
        {/* Play button */}
        <button type="button"
          onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            position: 'absolute', right: 12, bottom: 12,
            width: 44, height: 44,
            background: playing ? event.accent : 'rgba(10,15,24,0.7)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${event.accent}`,
            borderRadius: '50%',
            color: playing ? '#0A0F18' : event.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 120ms ease',
          }}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8"/><rect x="7" y="2" width="3" height="8"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z"/></svg>
          )}
        </button>
      </div>
      <div style={{ padding: 14 }}>
        <p style={{
          margin: 0,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600, fontSize: 9,
          letterSpacing: '0.28em', textTransform: 'uppercase',
          color: event.pillarColor,
        }}>{event.pillar.replace('-',' ')} · {event.duration}m</p>
        <h3 style={{
          margin: '6px 0 0',
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 15, fontWeight: 700, lineHeight: 1.25,
          color: '#fff',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{event.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <img src={event.host.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }}/>
          <span style={{
            flex: 1,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 600, fontSize: 10, letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{event.host.name}</span>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{
              padding: 0, width: 26, height: 26,
              background: 'transparent',
              border: `1px solid ${saved ? event.accent : 'rgba(255,255,255,0.2)'}`,
              color: saved ? event.accent : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────
// SHELF — horizontal scrolling row of cards with title + arrows
// ──────────────────────────────────────────────────────────────────────
function Shelf({ title, subtitle, accent = '#E8B547', kind = 'standard', events, mine, onToggle, onOpen }) {
  const scrollerRef = useRef(null);
  const scroll = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * w * 0.85, behavior: 'smooth' });
  };

  const CardComp = kind === 'spotlight' ? SpotlightEventCard
                 : kind === 'podcast'   ? PodcastEventCard
                 : StandardEventCard;

  // Card widths per shelf kind (responsive via minmax)
  const cardMin = kind === 'spotlight' ? 320
                : kind === 'podcast'   ? 240
                : 300;

  return (
    <section style={{ marginBottom: 44 }}>
      <header style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '0 24px 14px', gap: 16,
      }}>
        <div>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: accent,
          }}>{subtitle}</p>
          <h2 style={{
            margin: '4px 0 0',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 30, letterSpacing: '0.03em',
            color: '#fff', textTransform: 'uppercase',
          }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left"
            style={arrowStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18 L9 12 L15 6"/></svg>
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Scroll right"
            style={arrowStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6 L15 12 L9 18"/></svg>
          </button>
        </div>
      </header>

      <div ref={scrollerRef} style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: `minmax(${cardMin}px, 1fr)`,
        gridTemplateColumns: `24px repeat(${events.length}, minmax(${cardMin}px, 1fr)) 24px`,
        gap: 16,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        paddingBottom: 4,
        scrollbarWidth: 'thin',
      }}>
        <span/>
        {events.map(ev => (
          <div key={ev.id} style={{ scrollSnapAlign: 'start' }}>
            <CardComp
              event={ev}
              saved={mine.has(ev.id)}
              onToggle={() => onToggle(ev.id)}
              onOpen={() => onOpen && onOpen(ev)}
            />
          </div>
        ))}
        <span/>
      </div>
    </section>
  );
}

const arrowStyle = {
  width: 36, height: 36,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 120ms ease',
};

Object.assign(window, {
  Shelf, StandardEventCard, SpotlightEventCard, PodcastEventCard,
});
