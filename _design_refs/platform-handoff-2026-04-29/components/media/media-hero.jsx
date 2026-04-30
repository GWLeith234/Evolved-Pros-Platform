/* global React, EdPlaceholder, EdCategoryChip, EdBookmark, EdMeta, EdShare, ED */

// ──────────────────────────────────────────────────────────────────────
// MediaHero — TorontoToday-style: big lead on the left, 4 featured tiles right
// ──────────────────────────────────────────────────────────────────────

function MediaHero({ savedSet, onToggleSave }) {
  const { LEAD_STORY, FEATURED } = window.MEDIA_DATA;
  const lead = LEAD_STORY;

  return (
    <section style={{ maxWidth: 1280, margin: '32px auto 0', padding: '0 24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
        gap: 32,
      }}>
        {/* LEAD STORY ── left */}
        <article style={{
          background: ED.surface,
          border: `1px solid ${ED.border}`,
          padding: 0,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ position: 'relative' }}>
            <EdPlaceholder tone={lead.imageTone} ratio="16 / 10" label={lead.imageLabel}/>
            <span style={{
              position: 'absolute', top: 14, left: 14,
              padding: '5px 10px',
              background: ED.red, color: '#fff',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800, fontSize: 10,
              letterSpacing: '0.32em', textTransform: 'uppercase',
            }}>The Lead</span>
          </div>
          <div style={{ padding: '28px 32px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <EdCategoryChip category={lead.category}/>
              <EdBookmark saved={savedSet.has(lead.id)} onToggle={() => onToggleSave(lead.id)}/>
            </div>
            <h2 style={{
              margin: 0,
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700,
              fontSize: 'clamp(30px, 3.2vw, 42px)',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              color: ED.text,
              textWrap: 'pretty',
            }}>{lead.title}</h2>
            <p style={{
              margin: '16px 0 0',
              fontFamily: 'Merriweather, Georgia, serif',
              fontSize: 17, lineHeight: 1.6,
              color: ED.text,
              textWrap: 'pretty',
            }}>{lead.dek}</p>
            <div style={{
              marginTop: 22, paddingTop: 16, borderTop: `1px solid ${ED.borderSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
            }}>
              <EdMeta byline={lead.byline} date={lead.date} readTime={lead.readTime}/>
              <window.EdShare title={lead.title} articleId={lead.id}/>
            </div>
          </div>
        </article>

        {/* FEATURED 2x2 ── right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 16,
        }}>
          {FEATURED.map((f) => (
            <article key={f.id} style={{
              display: 'flex', flexDirection: 'column',
              background: ED.surface,
              border: `1px solid ${ED.border}`,
              minWidth: 0,
            }}>
              <EdPlaceholder tone={f.imageTone} ratio="16 / 10" label={f.imageLabel}/>
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <EdCategoryChip category={f.category} size="sm"/>
                <h3 style={{
                  margin: '8px 0 0',
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontWeight: 700, fontSize: 17, lineHeight: 1.25,
                  color: ED.text,
                  textWrap: 'pretty',
                }}>{f.title}</h3>
                <div style={{ flex: 1 }}/>
                <div style={{
                  marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 500, fontSize: 10,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: ED.textMuted,
                }}>
                  <span>{f.date} · {f.readTime} min</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <window.EdShare title={f.title} articleId={f.id} size="sm"/>
                    <EdBookmark saved={savedSet.has(f.id)} onToggle={() => onToggleSave(f.id)} size={14}/>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.MediaHero = MediaHero;
