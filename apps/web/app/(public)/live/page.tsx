import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InquiryForm } from '@/components/live/InquiryForm'

export const metadata: Metadata = {
  title: 'Evolved Pros LIVE — Keynotes & Workshops',
  description: 'High-energy keynotes, workshops, and mastermind formats for sales conferences, SKOs, and revenue leadership summits.',
}

const FORMATS = [
  { name: 'Keynote', desc: 'Conference-ready. The EVOLVED Architecture\u2122 at full energy.', duration: '45\u201390 min' },
  { name: 'Workshop', desc: 'Interactive. Teams leave with a built plan, not just inspiration.', duration: 'Half or full day' },
  { name: 'Mastermind', desc: 'Small group intensive. One pillar deep-dive. Transformational, not motivational.', duration: 'Custom' },
]

const TALKS = [
  { num: '01', pillar: 'All 6 Pillars \u00b7 Keynote 45\u201390 min', title: 'The EVOLVED Seller', desc: 'The full EVOLVED Architecture\u2122 system. The signature keynote for annual SKOs and conference mainstages.' },
  { num: '02', pillar: 'Mental Toughness \u00b7 Half-day workshop', title: 'Mental Toughness for Revenue Teams', desc: 'Interactive. Reps leave with a personal resilience plan and a daily practice they can start tomorrow.' },
  { num: '03', pillar: 'Identity \u00b7 60 min keynote or breakout', title: 'Identity-Driven Performance', desc: 'The gap between your reps\u2019 results and their self-image \u2014 and how to close it permanently.' },
  { num: '04', pillar: 'Execution + Accountability \u00b7 Full-day or executive track', title: 'Building a Culture of Execution', desc: 'Connecting daily discipline systems to pipeline outcomes. For revenue leaders, not just reps.' },
]

const STATS = [
  { value: '500+', label: 'stages worldwide' },
  { value: '4', label: 'signature talks' },
  { value: '20yr', label: 'in revenue leadership' },
]

interface EventRow { id: string; title: string; starts_at: string; event_type: string; description: string | null }

const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  keynote:    { bg: 'rgba(201,48,42,.12)',  color: '#C9302A', border: 'rgba(201,48,42,.25)' },
  workshop:   { bg: 'rgba(10,191,163,.1)',  color: '#0ABFA3', border: 'rgba(10,191,163,.2)' },
  mastermind: { bg: 'rgba(201,168,76,.1)',  color: '#C9A84C', border: 'rgba(201,168,76,.25)' },
}

export default async function LivePage() {
  const supabase = createClient()
  const { data: events } = await supabase
    .from('events')
    .select('id, title, starts_at, event_type, description')
    .eq('is_published', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(4)

  const upcomingEvents = (events ?? []) as EventRow[]

  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100vh', color: '#F5F0E8' }}>

      {/* ── SECTION 1: HERO ── */}
      <section style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#C9302A' }} />
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C9302A', fontFamily: 'sans-serif' }}>Evolved Pros Live</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 500, color: '#F5F0E8', lineHeight: 1.15, marginTop: 12 }}>
            Bring the EVOLVED system to your stage.
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', maxWidth: 420, lineHeight: 1.7, marginTop: 10, fontFamily: 'sans-serif' }}>
            High-energy keynotes, workshops, and mastermind formats for sales conferences, SKOs, and revenue leadership summits. Powered by the EVOLVED Architecture&trade;.
          </p>
          <div className="flex flex-wrap gap-2.5" style={{ marginTop: 24 }}>
            <a href="#inquire" style={{ padding: '10px 24px', backgroundColor: '#C9302A', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: 'sans-serif', textDecoration: 'none' }}>Inquire about booking</a>
            <a href="#talks" style={{ padding: '10px 24px', border: '0.5px solid rgba(245,240,232,.2)', color: 'rgba(245,240,232,.55)', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: 'sans-serif', textDecoration: 'none' }}>View signature talks</a>
          </div>
          <div className="flex flex-wrap gap-8" style={{ marginTop: 28, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,.08)' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: 500, color: '#C9A84C' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(245,240,232,.4)', marginTop: 2, fontFamily: 'sans-serif' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: FORMAT CARDS ── */}
      <section style={{ backgroundColor: '#111926', padding: '28px 24px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ maxWidth: 900, margin: '0 auto' }}>
          {FORMATS.map(f => (
            <div key={f.name} style={{ backgroundColor: '#0D1520', border: '0.5px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8', fontFamily: 'sans-serif' }}>{f.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(245,240,232,.5)', marginTop: 6, lineHeight: 1.5, fontFamily: 'sans-serif' }}>{f.duration}. {f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: SIGNATURE TALKS ── */}
      <section id="talks" style={{ backgroundColor: '#0D1219', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,.35)', marginBottom: 14, fontFamily: 'sans-serif' }}>Signature talks</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {TALKS.map(t => (
              <div key={t.num} style={{ backgroundColor: '#111926', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#C9302A', marginBottom: 5, fontFamily: 'sans-serif' }}>{t.pillar}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8', marginBottom: 5, fontFamily: 'sans-serif' }}>{t.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(245,240,232,.5)', lineHeight: 1.5, fontFamily: 'sans-serif' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: UPCOMING EVENTS ── */}
      {upcomingEvents.length > 0 && (
        <section style={{ backgroundColor: '#0D1219', padding: '20px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,.35)', marginBottom: 12, fontFamily: 'sans-serif' }}>Upcoming LIVE events</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {upcomingEvents.map(ev => {
                const tag = TAG_STYLES[ev.event_type] ?? { bg: 'rgba(245,240,232,.06)', color: 'rgba(245,240,232,.4)', border: 'rgba(245,240,232,.1)' }
                return (
                  <div key={ev.id} style={{ backgroundColor: '#111926', borderRadius: 8, padding: 13 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#C9A84C', fontFamily: 'sans-serif' }}>
                      {new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#F5F0E8', marginTop: 4, fontFamily: 'sans-serif' }}>{ev.title}</div>
                    {ev.description && <div style={{ fontSize: 10, color: 'rgba(245,240,232,.4)', marginTop: 3, fontFamily: 'sans-serif' }}>{ev.description}</div>}
                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: 8, textTransform: 'uppercase', fontWeight: 500, padding: '2px 6px', borderRadius: 3, backgroundColor: tag.bg, color: tag.color, border: `0.5px solid ${tag.border}`, fontFamily: 'sans-serif' }}>{ev.event_type}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 5: INQUIRY FORM ── */}
      <section id="inquire" style={{ backgroundColor: '#0D1219', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,.35)', marginBottom: 14, fontFamily: 'sans-serif' }}>Book George for your event</div>
          <InquiryForm />
        </div>
      </section>
    </div>
  )
}
