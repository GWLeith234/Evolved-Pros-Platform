/* global React, EdPlaceholder, EdCategoryChip, EdBookmark, EdMeta, EdSectionHeader, EdAdSlot, ED */

// ──────────────────────────────────────────────────────────────────────
// Breaking news ticker — runs above the masthead optionally
// ──────────────────────────────────────────────────────────────────────
function MediaTicker() {
  const items = [
    'Now reading: a16z on agentic enterprise org design',
    'New dossier: AI in B2B Sales (14 pieces)',
    'Just published: The compensation plan is dead',
    "George\u2019s next live: Toronto, June 12",
  ];
  return (
    <div style={{
      background: ED.text, color: ED.bg,
      borderBottom: `1px solid ${ED.text}`,
      overflow: 'hidden',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'stretch', height: 32,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 14px',
          background: ED.red, color: '#fff',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }}/>
          On the Desk
        </span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 32,
          padding: '0 16px', overflow: 'hidden',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 500, fontSize: 12,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.85)',
          flex: 1, whiteSpace: 'nowrap',
        }}>
          {items.map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ opacity: 0.4 }}>◆</span>}
              <span>{t}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Latest grid + Sidebar (TorontoToday density: 2-col grid w/ trending sidebar)
// ──────────────────────────────────────────────────────────────────────
function LatestWithSidebar({ savedSet, onToggleSave }) {
  const { LATEST, TRENDING, CATEGORY_COLORS } = window.MEDIA_DATA;

  return (
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <EdSectionHeader eyebrow="The Stream" title="Latest"
        action={<a href="#all" style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 11,
          letterSpacing: '0.24em', textTransform: 'uppercase',
          color: ED.gold, textDecoration: 'none',
          borderBottom: `1px solid ${ED.gold}`,
          paddingBottom: 2,
        }}>View all stories →</a>}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 32,
        marginTop: 24,
      }}>
        {/* Main column ─ 2 cols of articles, list-style after the first 2 */}
        <div>
          {/* Top 2 list articles full bleed */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            paddingBottom: 28,
            borderBottom: `1px solid ${ED.border}`,
          }}>
            {LATEST.slice(0, 2).map((a) => (
              <article key={a.id} style={{ minWidth: 0 }}>
                <EdPlaceholder tone={a.imageTone} ratio="16 / 10" label={a.imageLabel}/>
                <div style={{ paddingTop: 14 }}>
                  <EdCategoryChip category={a.category} size="sm"/>
                  <h3 style={{
                    margin: '8px 0 0',
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontWeight: 700, fontSize: 22, lineHeight: 1.22,
                    color: ED.text, textWrap: 'pretty',
                  }}>{a.title}</h3>
                  <div style={{
                    marginTop: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, flexWrap: 'wrap',
                  }}>
                    <EdMeta byline={a.byline} date={a.date} readTime={a.readTime} compact/>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <window.EdShare title={a.title} articleId={a.id} size="sm"/>
                      <EdBookmark saved={savedSet.has(a.id)} onToggle={() => onToggleSave(a.id)} size={15}/>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Remaining 6 in a denser 2-col list with thumbnails */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: 32, rowGap: 0,
            marginTop: 8,
          }}>
            {LATEST.slice(2).map((a, i) => {
              const isLeftCol = i % 2 === 0;
              return (
                <article key={a.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '128px 1fr',
                  gap: 14,
                  padding: '20px 0',
                  borderBottom: `1px solid ${ED.borderSoft}`,
                  borderRight: isLeftCol ? `1px solid ${ED.borderSoft}` : 'none',
                  paddingRight: isLeftCol ? 24 : 0,
                  paddingLeft: isLeftCol ? 0 : 24,
                  minWidth: 0,
                }}>
                  <div>
                    <EdPlaceholder tone={a.imageTone} ratio="1 / 1" label="" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <EdCategoryChip category={a.category} size="sm"/>
                    <h4 style={{
                      margin: '6px 0 0',
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontWeight: 700, fontSize: 16, lineHeight: 1.25,
                      color: ED.text, textWrap: 'pretty',
                    }}>{a.title}</h4>
                    <div style={{
                      marginTop: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 500, fontSize: 10,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: ED.textMuted,
                      }}>{a.date} · {a.readTime} min</span>
                      <EdBookmark saved={savedSet.has(a.id)} onToggle={() => onToggleSave(a.id)} size={13}/>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Trending */}
          <div style={{
            background: ED.cream,
            border: `1px solid ${ED.border}`,
            padding: '20px 22px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{
                width: 8, height: 8, background: ED.red, borderRadius: '50%',
                boxShadow: '0 0 0 3px rgba(201,48,42,0.18)',
              }}/>
              <h3 style={{
                margin: 0,
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 22, letterSpacing: '0.06em',
                color: ED.text, textTransform: 'uppercase',
              }}>Trending this week</h3>
            </div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {TRENDING.map((t, i) => (
                <li key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr',
                  gap: 12,
                  padding: '14px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${ED.borderSoft}`,
                }}>
                  <span style={{
                    fontFamily: 'Abril Fatface, Georgia, serif',
                    fontSize: 28, lineHeight: 1,
                    color: CATEGORY_COLORS[t.category] || ED.gold,
                  }}>{String(t.rank).padStart(2, '0')}</span>
                  <div>
                    <EdCategoryChip category={t.category} size="sm"/>
                    <h4 style={{
                      margin: '4px 0 0',
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontWeight: 700, fontSize: 14, lineHeight: 1.3,
                      color: ED.text, textWrap: 'pretty',
                    }}>{t.title}</h4>
                    <p style={{
                      margin: '4px 0 0',
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 500, fontSize: 10,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: ED.textSubtle,
                    }}>{t.views} reads</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* IAB Half Page Ad */}
          <EdAdSlot size="halfPage"/>

          {/* Newsletter card */}
          <div style={{
            background: ED.text, color: ED.bg,
            padding: '24px 22px 26px',
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 10,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: ED.goldSoft,
            }}>The Tuesday Edit</p>
            <h3 style={{
              margin: '6px 0 8px',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700, fontSize: 22, lineHeight: 1.2,
            }}>One email. Tuesday morning. The five things George read this week.</h3>
            <p style={{
              margin: '0 0 16px',
              fontFamily: 'Merriweather, Georgia, serif',
              fontSize: 13, lineHeight: 1.55,
              color: 'rgba(245,240,232,0.78)',
            }}>No takes you've already seen. Just the cleanest signal from his desk to yours.</p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 0 }}>
              <input type="email" placeholder="you@company.com"
                style={{
                  flex: 1, minWidth: 0,
                  padding: '11px 12px',
                  background: 'rgba(245,240,232,0.08)',
                  border: '1px solid rgba(245,240,232,0.2)',
                  borderRight: 'none',
                  color: ED.bg,
                  fontFamily: 'Barlow, sans-serif', fontSize: 13,
                  outline: 'none',
                }}/>
              <button type="submit" style={{
                padding: '11px 16px',
                background: ED.red, color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 11,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>Subscribe</button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// George's Desk — curated reads with his commentary
// ──────────────────────────────────────────────────────────────────────
function GeorgesDesk({ savedSet, onToggleSave }) {
  const { CURATED } = window.MEDIA_DATA;
  return (
    <section id="desk" style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <EdSectionHeader
        eyebrow="George’s Desk"
        title="What he’s reading this week"
        accent={ED.red}
        action={
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: ED.textMuted,
          }}>Curated outside reads, with his marginalia</span>
        }
      />
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 24,
      }}>
        {CURATED.map((c) => (
          <article key={c.id} style={{
            background: ED.surface,
            border: `1px solid ${ED.border}`,
            padding: '24px 26px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 14,
            position: 'relative',
          }}>
            {/* External link mark */}
            <span style={{
              position: 'absolute', top: 18, right: 18,
              color: ED.textSubtle,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7"/><path d="M9 7h8v8"/>
              </svg>
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 10,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: ED.textMuted,
            }}>
              <span>From</span>
              <span style={{ color: ED.text }}>{c.source}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{c.readTime} min</span>
            </div>
            <h3 style={{
              margin: 0,
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700, fontSize: 22, lineHeight: 1.25,
              color: ED.text, textWrap: 'pretty',
            }}>{c.title}</h3>

            {/* George's take */}
            <blockquote style={{
              margin: 0, paddingLeft: 16,
              borderLeft: `3px solid ${ED.red}`,
              fontFamily: 'Merriweather, Georgia, serif',
              fontSize: 14.5, lineHeight: 1.6,
              color: ED.text,
              fontStyle: 'italic',
            }}>
              <span style={{
                display: 'block',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 9,
                letterSpacing: '0.32em', textTransform: 'uppercase',
                color: ED.red,
                fontStyle: 'normal',
                marginBottom: 4,
              }}>George’s Take</span>
              {c.take}
            </blockquote>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 12, borderTop: `1px solid ${ED.borderSoft}`,
            }}>
              <EdCategoryChip category={c.category} size="sm"/>
              <EdBookmark saved={savedSet.has(c.id)} onToggle={() => onToggleSave(c.id)} size={15}/>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Dossiers — 3 large editorial collection cards
// ──────────────────────────────────────────────────────────────────────
function DossiersStrip() {
  const { DOSSIERS } = window.MEDIA_DATA;
  return (
    <section id="dossiers" style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <EdSectionHeader
        eyebrow="Long Reads"
        title="The dossiers"
        accent={ED.gold}
        action={
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: ED.textMuted,
          }}>Sustained reporting on a single topic</span>
        }
      />
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
      }}>
        {DOSSIERS.map((d, i) => (
          <article key={d.id} style={{
            position: 'relative',
            border: `1px solid ${ED.border}`,
            display: 'flex', flexDirection: 'column',
            background: ED.surface,
            minHeight: 360,
            cursor: 'pointer',
            overflow: 'hidden',
          }}>
            <div style={{ height: 200, position: 'relative' }}>
              <EdPlaceholder tone={d.cover} height={200} label="Dossier cover"/>
              <span style={{
                position: 'absolute', top: 14, left: 14,
                padding: '5px 10px',
                background: 'rgba(245,240,232,0.94)',
                color: ED.text,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800, fontSize: 10,
                letterSpacing: '0.32em', textTransform: 'uppercase',
              }}>Dossier № {String(i + 1).padStart(2, '0')}</span>
            </div>
            <div style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{
                margin: 0,
                fontFamily: 'Abril Fatface, "Playfair Display", Georgia, serif',
                fontWeight: 400, fontSize: 28, lineHeight: 1.05,
                color: ED.text, textWrap: 'pretty',
              }}>{d.title}</h3>
              <p style={{
                margin: '12px 0 0',
                fontFamily: 'Merriweather, Georgia, serif',
                fontSize: 14, lineHeight: 1.55,
                color: ED.textMuted, flex: 1,
              }}>{d.blurb}</p>
              <div style={{
                marginTop: 18, paddingTop: 14,
                borderTop: `1px solid ${ED.borderSoft}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  color: ED.gold,
                }}>{d.pieces} pieces</span>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  color: ED.text,
                }}>Open dossier →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Book excerpt — wide editorial block with a gold rule
// ──────────────────────────────────────────────────────────────────────
function BookExcerptBlock() {
  const { BOOK_EXCERPT } = window.MEDIA_DATA;
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <article style={{
        background: ED.surface,
        border: `1px solid ${ED.border}`,
        borderTop: `3px solid ${ED.gold}`,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
      }}>
        <div style={{ position: 'relative', minHeight: 340 }}>
          <EdPlaceholder tone="cream" ratio={undefined} height="100%" label="Book cover"/>
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
            color: ED.text,
            background: 'rgba(245,240,232,0.86)',
          }}>
            <span style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: ED.gold,
            }}>The Book</span>
            <span style={{
              marginTop: 8,
              fontFamily: 'Abril Fatface, Georgia, serif',
              fontSize: 36, lineHeight: 1.05,
            }}>EVOLVED</span>
            <span style={{
              marginTop: 8, maxWidth: 220,
              fontFamily: 'Playfair Display, Georgia, serif',
              fontStyle: 'italic',
              fontSize: 14, color: ED.textMuted,
            }}>A Field Guide for the Modern Operator · 287pp</span>
          </span>
        </div>
        <div style={{ padding: '36px 40px 36px' }}>
          <p style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: ED.red,
          }}>Excerpt · {BOOK_EXCERPT.chapter}</p>
          <h2 style={{
            margin: '8px 0 18px',
            fontFamily: 'Playfair Display, Georgia, serif',
            fontWeight: 700, fontSize: 28, lineHeight: 1.2,
            color: ED.text,
          }}>{BOOK_EXCERPT.title}</h2>
          <p style={{
            margin: 0,
            fontFamily: 'Merriweather, Georgia, serif',
            fontSize: 17, lineHeight: 1.7,
            color: ED.text,
            textWrap: 'pretty',
            position: 'relative',
            paddingLeft: 16,
            borderLeft: `2px solid ${ED.gold}`,
          }}>{BOOK_EXCERPT.excerpt}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <a href="#read" style={{
              padding: '11px 22px',
              background: ED.red, color: '#fff',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>Read the chapter</a>
            <a href="#book" style={{
              padding: '11px 22px',
              background: 'transparent', color: ED.gold,
              border: `1px solid ${ED.gold}`,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>Get the book</a>
          </div>
        </div>
      </article>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Video clips — Live/Podcast cross-promo
// ──────────────────────────────────────────────────────────────────────
function VideoClips() {
  const { VIDEO_CLIPS } = window.MEDIA_DATA;
  return (
    <section id="video" style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <EdSectionHeader
        eyebrow="Watch"
        title="From the stage and the studio"
        accent={ED.red}
        action={
          <a href="#all-video" style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.24em', textTransform: 'uppercase',
            color: ED.gold, textDecoration: 'none',
            borderBottom: `1px solid ${ED.gold}`, paddingBottom: 2,
          }}>All clips →</a>
        }
      />
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
      }}>
        {VIDEO_CLIPS.map((v, i) => {
          const tones = ['navy', 'gold', 'crimson'];
          return (
            <article key={v.id} style={{
              background: ED.surface,
              border: `1px solid ${ED.border}`,
              overflow: 'hidden',
              cursor: 'pointer',
            }}>
              <div style={{ position: 'relative' }}>
                <EdPlaceholder tone={tones[i % 3]} ratio="16 / 10" label={v.source}/>
                {/* Play button */}
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(245,240,232,0.95)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={ED.red}>
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </span>
                </span>
                <span style={{
                  position: 'absolute', bottom: 12, right: 12,
                  padding: '3px 8px',
                  background: 'rgba(27,42,74,0.92)',
                  color: '#fff',
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11,
                }}>{v.duration}</span>
              </div>
              <div style={{ padding: '14px 18px 18px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: ED.gold,
                }}>{v.source}</p>
                <h4 style={{
                  margin: '6px 0 0',
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontWeight: 700, fontSize: 17, lineHeight: 1.3,
                  color: ED.text, textWrap: 'pretty',
                }}>{v.title}</h4>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Inline ad (Billboard)
// ──────────────────────────────────────────────────────────────────────
function InlineAd({ size = 'billboard' }) {
  return (
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <EdAdSlot size={size}/>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────────────────
function MediaFooter() {
  return (
    <footer style={{
      marginTop: 96,
      background: '#1B2A4A',
      color: ED.bg,
      padding: '48px 0 32px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: 32,
          paddingBottom: 32,
          borderBottom: '1px solid rgba(245,240,232,0.12)',
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.42em', textTransform: 'uppercase',
              color: ED.goldSoft,
            }}>Evolved Pros</p>
            <p style={{
              margin: '6px 0 0',
              fontFamily: 'Abril Fatface, Georgia, serif',
              fontSize: 36, lineHeight: 1,
            }}><span style={{ color: '#C9302A' }}>Evolved</span> <span style={{ color: ED.bg }}>Media</span></p>
            <p style={{
              margin: '14px 0 0', maxWidth: 360,
              fontFamily: 'Merriweather, Georgia, serif',
              fontSize: 13, lineHeight: 1.6,
              color: 'rgba(245,240,232,0.7)',
            }}>The publication of Evolved Pros. Reporting on what the modern operator is reading, learning, and putting into practice.</p>
          </div>
          {[
            { title: 'Sections', items: ['Top Stories', 'Revenue', 'AI', 'Leadership', 'Pillars'] },
            { title: 'From George', items: ['George’s Desk', 'The Tuesday Edit', 'The Book'] },
            { title: 'Platform',   items: ['Home', 'Community', 'Events', 'Podcast', 'Live', 'Academy'] },
          ].map((col) => (
            <div key={col.title}>
              <p style={{
                margin: 0,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 10,
                letterSpacing: '0.32em', textTransform: 'uppercase',
                color: ED.goldSoft,
              }}>{col.title}</p>
              <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0 }}>
                {col.items.map((it) => (
                  <li key={it} style={{ padding: '5px 0' }}>
                    <a href={`#${it}`} style={{
                      fontFamily: 'Barlow, sans-serif',
                      fontSize: 14,
                      color: 'rgba(245,240,232,0.78)',
                      textDecoration: 'none',
                    }}>{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 18,
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 500, fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(245,240,232,0.5)',
        }}>
          <span>© 2026 Evolved Pros</span>
          <span>An independent publication. Editorial decisions are made independent of advertisers.</span>
        </div>
      </div>
    </footer>
  );
}

window.MediaTicker = MediaTicker;
window.LatestWithSidebar = LatestWithSidebar;
window.GeorgesDesk = GeorgesDesk;
window.DossiersStrip = DossiersStrip;
window.BookExcerptBlock = BookExcerptBlock;
window.VideoClips = VideoClips;
window.InlineAd = InlineAd;
window.MediaFooter = MediaFooter;
