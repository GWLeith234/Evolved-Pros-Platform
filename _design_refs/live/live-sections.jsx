/* global React, UPCOMING_DATES, LIVE_TOPICS, LIVE_TESTIMONIALS, SPEAKER_LOGOS */

// ──────────────────────────────────────────────────────────────────────
// LIVE — Globe section wrapper (header + globe)
// ──────────────────────────────────────────────────────────────────────
function GlobeSection({ pins }) {
  const SpeakingGlobe = window.SpeakingGlobe;
  const stats = window.SPEAKING_STATS;
  const countries = new Set(pins.map(p => p.country)).size;
  return (
    <section style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 24px' }}>
      <SectionHeader
        eyebrow="The Tour"
        title={`${stats.talks}+ stages. ${countries} countries. ${stats.yearsActive} years.`}
        kicker="Every gold pin is a stage George has stood on."
      />
      <div style={{
        marginTop: 24,
        border: '1px solid var(--border-soft2)',
        borderTop: '3px solid #C9A84C',
        background: 'var(--bg-page)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <SpeakingGlobe pins={pins} height={620}/>
      </div>
    </section>
  );
}

// Reusable section header
function SectionHeader({ eyebrow, title, kicker }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <p style={{
          margin: 0,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 11,
          letterSpacing: '0.42em', textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.85)',
        }}>{eyebrow}</p>
        <h3 style={{
          margin: '6px 0 0',
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 40, lineHeight: 1, letterSpacing: '0.04em',
          color: 'var(--text-strong)', textTransform: 'uppercase',
        }}>{title}</h3>
      </div>
      {kicker && (
        <p style={{
          margin: 0, maxWidth: 360,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 16, lineHeight: 1.4,
          color: 'var(--text-2)',
        }}>{kicker}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// UpcomingDates — confirmed/hold list
// ──────────────────────────────────────────────────────────────────────
function UpcomingDates() {
  const dates = window.UPCOMING_DATES;
  return (
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <SectionHeader eyebrow="Where He's Headed" title="Upcoming dates"
        kicker="The 2026 calendar. Confirmed dates, plus a few holds."/>
      <div style={{ marginTop: 24, border: '1px solid var(--border-soft2)' }}>
        {dates.map((d, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 140px',
            alignItems: 'start', gap: 24,
            padding: '24px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
            background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
          }}>
            <div>
              <p style={{
                margin: 0,
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 28, lineHeight: 1, letterSpacing: '0.04em',
                color: '#C9A84C',
              }}>{d.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} {d.date.getDate()}</p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600, fontSize: 10,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}>{d.date.getFullYear()}</p>
            </div>
            <div>
              <p style={{
                margin: 0,
                fontFamily: 'Playfair Display, Georgia, serif',
                fontWeight: 700, fontSize: 20, lineHeight: 1.2,
                color: 'var(--text-strong)',
              }}>{d.event}</p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 600, fontSize: 10,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: '#C9A84C',
              }}>{d.country ? `${d.city} · ${d.country}` : d.city}</p>
              {d.detail && (
                <p style={{
                  margin: '12px 0 0',
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)',
                  maxWidth: 620,
                }}>{d.detail}</p>
              )}
              {d.linkUrl && (
                <a href={d.linkUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-block', marginTop: 12,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  color: '#C9A84C', textDecoration: 'none',
                  borderBottom: '1px solid rgba(201,168,76,0.4)',
                  paddingBottom: 2,
                }}>{d.linkLabel || 'Details'} →</a>
              )}
            </div>
            <div style={{ justifySelf: 'end' }}>
              <span style={{
                padding: '4px 10px',
                background: d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.12)' : 'rgba(201,168,76,0.12)',
                border: `1px solid ${d.tag === 'CONFIRMED' ? 'rgba(10,191,163,0.4)' : 'rgba(201,168,76,0.4)'}`,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 9,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: d.tag === 'CONFIRMED' ? '#0ABFA3' : '#C9A84C',
              }}>{d.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Topics — what George speaks on
// ──────────────────────────────────────────────────────────────────────
function TopicsSection() {
  const topics = window.LIVE_TOPICS;
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <SectionHeader eyebrow="The Six Pillars" title="What George speaks on"
        kicker="Pick one as a keynote. Combine two or three for a half-day workshop. All six for the full EVOLVED Architecture\u2122 mainstage."/>
      <div style={{
        marginTop: 28,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {topics.map((t, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-soft2)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'transform 200ms ease, border-color 200ms ease',
            cursor: 'pointer',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = t.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-soft2)'; }}
          >
            {/* Image */}
            <div style={{
              position: 'relative',
              aspectRatio: '16 / 10',
              background: `#0A0F18 url(${t.img}) center/cover no-repeat`,
              borderBottom: `3px solid ${t.color}`,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(10,15,24,0.0) 35%, rgba(10,15,24,0.78) 100%)',
              }}/>
              <div style={{
                position: 'absolute', top: 14, left: 14,
                padding: '4px 9px',
                background: 'rgba(10,15,24,0.55)',
                border: `1px solid ${t.color}`,
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 13, letterSpacing: '0.18em',
                color: t.color,
              }}>{t.num}</div>
              <p style={{
                position: 'absolute', bottom: 14, left: 16, right: 16, margin: 0,
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: 26, letterSpacing: '0.06em',
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>{t.tag.toUpperCase()}</p>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{
                margin: 0,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 10,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}>{t.format}</p>
              <h4 style={{
                margin: '8px 0 10px',
                fontFamily: 'Playfair Display, Georgia, serif',
                fontWeight: 700, fontSize: 22, lineHeight: 1.2,
                color: 'var(--text-strong)',
                textWrap: 'pretty',
              }}>{t.title}</h4>
              <p style={{
                margin: 0,
                fontFamily: 'Barlow, sans-serif',
                fontSize: 14, lineHeight: 1.55,
                color: 'var(--text-2)',
              }}>{t.blurb}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Testimonials — quotes from past hosts
// ──────────────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const items = window.LIVE_TESTIMONIALS;
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <SectionHeader eyebrow="From the Hosts" title="What organizers say"/>
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
      }}>
        {items.map((t, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-soft2)',
            borderTop: '3px solid #C9A84C',
            padding: '32px 28px 28px',
            display: 'flex', flexDirection: 'column',
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 400,
              fontSize: 56, lineHeight: 0.6,
              color: '#C9A84C',
              opacity: 0.6,
            }}>&ldquo;</p>
            <p style={{
              margin: '8px 0 0',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 18, lineHeight: 1.45,
              color: 'var(--text-1)',
              flex: 1,
            }}>{t.quote}</p>
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
              <p style={{ margin: 0, fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{t.author}</p>
              <p style={{ margin: '2px 0 0', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'var(--text-3)' }}>{t.role}</p>
              <p style={{
                margin: '8px 0 0',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 9,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: '#C9A84C',
              }}>{t.event}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// PhotoRotator — large stage shots that auto-rotate
// ──────────────────────────────────────────────────────────────────────
function PhotoRotator() {
  const photos = [
    { src: 'assets/george-cloud-broker.jpg',      caption: 'The Rise of the Cloud Broker' },
    { src: 'assets/george-stage-blue-jacket.jpg', caption: 'Mainstage Keynote' },
  ];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <div style={{
        position: 'relative',
        aspectRatio: '21 / 9',
        background: '#0A0F18',
        border: '1px solid var(--border-soft2)',
        borderTop: '3px solid #C9A84C',
        overflow: 'hidden',
      }}>
        {photos.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${p.src})`,
            backgroundSize: 'cover', backgroundPosition: 'center 35%',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 1200ms ease',
          }}/>
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 55%, rgba(10,15,24,0.85) 100%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', left: 32, bottom: 28, right: 32,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.42em', textTransform: 'uppercase',
              color: '#C9A84C',
            }}>On Stage</p>
            <p style={{
              margin: '6px 0 0',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700, fontSize: 'clamp(24px, 3vw, 36px)',
              lineHeight: 1.1, color: '#fff',
            }}>{photos[idx].caption}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {photos.map((_, i) => (
              <button key={i} type="button" aria-label={`Show photo ${i + 1}`} onClick={() => setIdx(i)} style={{
                width: i === idx ? 32 : 12, height: 4,
                background: i === idx ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 240ms ease',
              }}/>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// BookCTA — final closer
// ──────────────────────────────────────────────────────────────────────
function BookCTA({ onBook }) {
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 80px', padding: '0 24px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A2332 0%, #0D1B2A 100%)',
        border: '1px solid rgba(201,168,76,0.3)',
        padding: '56px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gold corner accents */}
        <span style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 3, background: '#C9A84C' }}/>
        <span style={{ position: 'absolute', top: 0, left: 0, width: 3, height: 80, background: '#C9A84C' }}/>
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 80, height: 3, background: '#C9A84C' }}/>
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 3, height: 80, background: '#C9A84C' }}/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.42em', textTransform: 'uppercase',
              color: '#C9A84C',
            }}>Now Booking</p>
            <h3 style={{
              margin: '6px 0 14px',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(56px, 7vw, 96px)',
              lineHeight: 0.95, letterSpacing: '0.02em',
              color: '#fff',
              textTransform: 'uppercase',
            }}>2026 <span style={{ color: '#C9A84C' }}>·</span> 2027</h3>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow, sans-serif',
              fontSize: 16, lineHeight: 1.55,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: 540,
            }}>Tell us about the room, the audience, and what you need them to walk out with. We'll come back within 48 hours.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
            <button type="button" onClick={onBook} style={{
              padding: '16px 32px',
              background: '#ef0e30', color: '#fff',
              border: '1px solid #ef0e30',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 13,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>Request a date</button>
            <button type="button" style={{
              padding: '16px 32px',
              background: 'transparent', color: '#C9A84C',
              border: '1px solid rgba(201,168,76,0.5)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>Download speaker kit</button>
          </div>
        </div>
      </div>
    </section>
  );
}

window.GlobeSection = GlobeSection;
window.UpcomingDates = UpcomingDates;
window.TopicsSection = TopicsSection;
window.TestimonialsSection = TestimonialsSection;
window.PhotoRotator = PhotoRotator;
window.BookCTA = BookCTA;
