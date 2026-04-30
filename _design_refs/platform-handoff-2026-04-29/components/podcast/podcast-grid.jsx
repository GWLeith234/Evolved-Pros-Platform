/* global React */
const { useState: usePGState, useRef: usePGRef, useMemo: usePGMemo } = React;

// ─────────────────────────────────────────────────────────────────
// Apple-TV-style episode grid — PORTRAIT 2:3 poster cards
// ─────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',           label: 'All episodes',    color: '#C9A84C' },
  { key: 'foundation',    label: 'Foundation',      color: '#FFA538' },
  { key: 'identity',      label: 'Identity',        color: '#A78BFA' },
  { key: 'mental-toughness', label: 'Mental Toughness', color: '#F87171' },
  { key: 'strategy',      label: 'Strategy',        color: '#60A5FA' },
  { key: 'accountability', label: 'Accountability', color: '#C9A84C' },
  { key: 'execution',     label: 'Execution',       color: '#0ABFA3' },
];

const SORTS = [
  { key: 'newest',  label: 'Newest first' },
  { key: 'oldest',  label: 'Oldest first' },
  { key: 'longest', label: 'Longest first' },
];

// ─────────────────────────────────────────────────────────────────
// EpisodeTile — PORTRAIT 2:3 poster (Apple TV+ style)
// Hover lift + parallax tilt + pillar focus ring + play button
// Title + meta render BELOW the poster (Apple TV pattern)
// ─────────────────────────────────────────────────────────────────
function EpisodeTile({ episode, focused, onFocus, onBlur, onPlay }) {
  const PILLARS = window.PODCAST_DATA.PILLARS;
  const fmtDate = window.PODCAST_DATA.fmtDate;
  const pillar = PILLARS[episode.pillar];
  const tileRef = usePGRef(null);
  const [hovered, setHovered] = usePGState(false);
  const [tilt, setTilt] = usePGState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px, y: py });
  };
  const handleEnter = () => { setHovered(true); onFocus && onFocus(episode.id); };
  const handleLeave = () => { setHovered(false); setTilt({ x: 0, y: 0 }); onBlur && onBlur(); };

  const lift = focused || hovered;
  const tx = tilt.x * 6;
  const ty = tilt.y * 6;

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      {/* POSTER — 2:3 portrait */}
      <button
        ref={tileRef}
        type="button"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMouseMove}
        onClick={() => onPlay && onPlay(episode)}
        onFocus={() => onFocus && onFocus(episode.id)}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%', aspectRatio: '2 / 3',
          padding: 0,
          background: '#0A0F18',
          border: 'none',
          cursor: 'pointer',
          outline: 'none',
          overflow: 'hidden',
          transform: lift
            ? `perspective(1200px) rotateY(${tx * 0.4}deg) rotateX(${-ty * 0.4}deg) translateY(-6px) scale(1.04)`
            : 'perspective(1200px) rotateY(0) rotateX(0) translateY(0) scale(1)',
          transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 280ms ease',
          boxShadow: lift
            ? `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 2px ${pillar.color}, 0 0 0 4px rgba(255,255,255,0.12)`
            : '0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)',
          zIndex: lift ? 2 : 1,
          willChange: 'transform',
        }}>
        {/* Cover art */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${episode.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: lift ? `scale(1.08) translate(${tx * -0.6}px, ${ty * -0.6}px)` : 'scale(1) translate(0,0)',
          transition: 'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}/>

        {/* Heavy bottom fade for poster legibility */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,15,24,0) 30%, rgba(10,15,24,0.45) 60%, rgba(10,15,24,0.92) 100%)',
        }}/>
        {/* pillar accent wash on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${pillar.color}1F 0%, transparent 55%)`,
          opacity: lift ? 1 : 0,
          transition: 'opacity 240ms ease',
        }}/>

        {/* TOP-LEFT: episode number — large, branded */}
        <div style={{
          position: 'absolute', top: 14, left: 16,
          display: 'flex', alignItems: 'baseline', gap: 4,
        }}>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 22,
            color: '#C9A84C',
            lineHeight: 1,
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          }}>#</span>
          <span style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 24, lineHeight: 1,
            color: '#fff',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          }}>{String(episode.episode).padStart(2,'0')}</span>
        </div>

        {/* TOP-RIGHT: New / watched */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end',
        }}>
          {episode.isNew && (
            <span style={{
              padding: '3px 7px',
              background: '#C9302A', color: '#fff',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 9,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>New</span>
          )}
          {episode.watched >= 1 && (
            <span style={{
              padding: '3px 7px',
              background: 'rgba(10,15,24,0.7)',
              color: '#0ABFA3',
              border: '1px solid rgba(10,191,163,0.45)',
              backdropFilter: 'blur(8px)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 9,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>✓ Watched</span>
          )}
        </div>

        {/* CENTER: play button on hover */}
        <span style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scale(${lift ? 1 : 0.7})`,
          opacity: lift ? 1 : 0,
          width: 64, height: 64,
          borderRadius: '50%',
          background: '#ef0e30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 12px 36px rgba(239,14,48,0.5), 0 0 0 8px rgba(255,255,255,0.08)',
          transition: 'all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          pointerEvents: 'none',
        }}>
          <svg width="22" height="22" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.5 2 L10 6 L3.5 10 Z"/>
          </svg>
        </span>

        {/* BOTTOM: pillar tag + duration */}
        <div style={{
          position: 'absolute', left: 16, right: 16, bottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.24em', textTransform: 'uppercase',
            color: pillar.color,
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: pillar.color,
              flexShrink: 0,
            }}/>
            {pillar.label}
          </span>
          <span style={{
            padding: '3px 7px',
            background: 'rgba(10,15,24,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.16em',
            flexShrink: 0,
          }}>{episode.duration}M</span>
        </div>

        {/* Watched progress bar (in-progress) */}
        {episode.watched > 0 && episode.watched < 1 && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            height: 3, background: 'rgba(255,255,255,0.15)',
          }}>
            <div style={{
              width: `${Math.round(episode.watched * 100)}%`,
              height: '100%', background: pillar.color,
            }}/>
          </div>
        )}
      </button>

      {/* META BELOW POSTER (Apple TV pattern) */}
      <div style={{ padding: '14px 2px 0' }}>
        <h3 style={{
          margin: 0,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 16, fontWeight: 700, lineHeight: 1.25,
          color: 'var(--text-strong)',
          textWrap: 'pretty',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.5em',
        }}>{episode.title}</h3>
        <p style={{
          margin: '6px 0 0',
          fontFamily: 'Barlow, sans-serif',
          fontSize: 12,
          color: 'var(--text-3)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textAlign: 'left',
        }}>
          {episode.guest.name}
          <span style={{ color: 'var(--text-5)', margin: '0 6px' }}>&middot;</span>
          {fmtDate(episode.releasedAt)}
        </p>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────
// PodcastGrid
// ─────────────────────────────────────────────────────────────────
function PodcastGrid({ episodes, onPlay }) {
  const [filter, setFilter] = usePGState('all');
  const [sort, setSort] = usePGState('newest');
  const [focused, setFocused] = usePGState(null);

  const filtered = usePGMemo(() => {
    let list = filter === 'all' ? episodes : episodes.filter(e => e.pillar === filter);
    if (sort === 'newest')  list = [...list].sort((a, b) => b.releasedAt - a.releasedAt);
    if (sort === 'oldest')  list = [...list].sort((a, b) => a.releasedAt - b.releasedAt);
    if (sort === 'longest') list = [...list].sort((a, b) => b.duration - a.duration);
    return list;
  }, [episodes, filter, sort]);

  return (
    <section style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '40px 24px 96px',
    }}>
      {/* Section heading — matches community subhead pattern */}
      <header style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 16, marginBottom: 24,
        borderBottom: '1px solid var(--border-soft2)',
        paddingBottom: 22,
      }}>
        <div>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.42em', textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.85)',
          }}>The archive</p>
          <h2 style={{
            margin: '6px 0 0',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 36, letterSpacing: '0.04em',
            color: 'var(--text-strong)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>All Episodes</h2>
        </div>
        <p style={{
          margin: 0,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600, fontSize: 12,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}>{filtered.length} episodes</p>
      </header>

      {/* Filter pills + sort */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: 10, marginBottom: 32,
      }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 14px',
                background: active ? f.color : 'transparent',
                color: active ? '#0A0F18' : f.color,
                border: `1px solid ${active ? f.color : f.color + '66'}`,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 11,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}>{f.label}</button>
          );
        })}
        <span style={{ flex: 1 }}/>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 10,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: 'var(--text-4)',
          }}>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '8px 32px 8px 12px',
              background: 'var(--bg-surface)',
              color: 'var(--text-strong)',
              border: '1px solid var(--border-strong)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 0,
              appearance: 'none',
            }}>
            {SORTS.map(s => <option key={s.key} value={s.key} style={{ background: 'var(--bg-surface)', color: 'var(--text-strong)' }}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grid — portrait posters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '32px 22px',
      }}>
        {filtered.map(ep => (
          <EpisodeTile key={ep.id}
            episode={ep}
            focused={focused === ep.id}
            onFocus={setFocused}
            onBlur={() => setFocused(null)}
            onPlay={onPlay}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          padding: 60, textAlign: 'center',
          border: '1px solid var(--border-soft2)',
          background: 'var(--bg-surface)',
          fontFamily: 'Barlow, sans-serif',
        }}>
          <p style={{
            margin: 0, fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: 'var(--text-4)',
          }}>No episodes</p>
          <h3 style={{
            margin: '10px 0 0', fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 22, color: 'var(--text-strong)',
          }}>Nothing in this pillar yet.</h3>
        </div>
      )}
    </section>
  );
}

window.PodcastGrid = PodcastGrid;
window.EpisodeTile = EpisodeTile;
