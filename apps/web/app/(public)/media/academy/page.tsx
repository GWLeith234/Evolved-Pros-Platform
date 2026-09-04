import type { Metadata } from 'next'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'

export const revalidate = 300

export const metadata: Metadata = publicPageMetadata('/media/academy', {
  title: mediaSectionTitle('Academy'),
  description: 'Preview the Evolved Pros Academy. Free weekly lesson teasers plus the full 6-pillar course catalog.',
})

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonRow {
  id: string
  title: string
  description: string | null
  course_id: string
  sort_order: number
  created_at: string
  courses: { title: string; pillar_number: number | null; slug: string } | null
}

interface CourseRow {
  id: string
  title: string
  slug: string
  pillar_number: number | null
  description: string | null
  is_published: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pillarName(num: number | null): string {
  if (!num) return 'General'
  return PILLAR_CONFIG[num]?.label ?? 'General'
}

function pillarColor(num: number | null): string {
  if (!num) return 'var(--muted)'
  return PILLAR_CONFIG[num]?.color ?? 'var(--muted)'
}

const PILLAR_GRADIENTS: Record<number, string> = {
  1: 'var(--media-grad-1)',
  2: 'var(--media-grad-2)',
  3: 'var(--media-grad-3)',
  4: 'var(--media-grad-4)',
  5: 'var(--media-grad-5)',
  6: 'var(--media-grad-6)',
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MediaAcademyPage() {
  const [{ data: lessons }, { data: courses }] = await Promise.all([
    adminClient
      .from('lessons')
      .select('id, title, description, course_id, sort_order, created_at, courses(title, pillar_number, slug)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(1),
    adminClient
      .from('courses')
      .select('id, title, slug, pillar_number, description, is_published')
      .eq('is_published', true)
      .order('pillar_number', { ascending: true }),
  ])

  const featured = (lessons as unknown as LessonRow[] | null)?.[0] ?? null
  const allCourses = (courses ?? []) as CourseRow[]

  // Count lessons per course
  const { data: lessonCounts } = await adminClient
    .from('lessons')
    .select('course_id')
    .eq('is_published', true)
  const countMap = new Map<string, number>()
  for (const lc of lessonCounts ?? []) {
    countMap.set(lc.course_id, (countMap.get(lc.course_id) ?? 0) + 1)
  }

  const coursePillar = featured?.courses?.pillar_number ?? null
  const courseTitle = featured?.courses?.title ?? 'Course'
  const rawPreview = featured?.description ? stripMarkdown(featured.description).slice(0, 400) : ''
  const previewText = rawPreview || (featured ? `This lesson covers key concepts in the ${pillarName(coursePillar)} pillar of the EVOLVED Architecture\u2122.` : '')

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 0' }}>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
          This week&apos;s free lesson
        </p>
        <h1 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 28, color: 'var(--media-ink)', textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}>
          {featured?.title ?? 'Academy Preview'}
        </h1>
      </div>

      {/* Lesson teaser card */}
      {featured && (
        <div style={{ border: '1px solid var(--paper-line)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
          {/* Header bar */}
          <div style={{ backgroundColor: 'var(--media-ink)', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Academy Preview · {pillarName(coursePillar)} Pillar
            </span>
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 9, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: 'rgba(201,168,76,0.15)', padding: '2px 8px', borderRadius: 2 }}>
              Free this week
            </span>
          </div>

          {/* Body */}
          <div style={{ backgroundColor: '#fff', padding: '14px 16px' }}>
            <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.45)', fontFamily: 'var(--font-condensed)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
              {courseTitle} · Lesson {featured.sort_order}
            </p>
            <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--media-ink)', margin: '0 0 10px', lineHeight: 1.2 }}>
              {featured.title}
            </h2>
            {previewText && (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 12, lineHeight: 1.75, color: 'var(--media-ink-slate)', margin: '0 0 16px' }}>
                {previewText}{previewText.length >= 400 ? '...' : ''}
              </p>
            )}

            {/* Lock wall */}
            <div style={{ backgroundColor: 'var(--media-cream-tint)', border: '1px solid var(--paper-line)', borderRadius: 4, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>🔒</div>
              <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--media-ink)', margin: '0 0 4px' }}>
                Lesson continues inside
              </p>
              <p style={{ fontSize: 11, color: 'rgba(43,58,90,0.5)', fontFamily: 'var(--font-body)', lineHeight: 1.5, margin: '0 0 12px' }}>
                Join Evolved Pros to access all lessons in the {pillarName(coursePillar)} pillar — plus 5 more pillars, live events, and the full community.
              </p>
              <Link
                href="/pricing"
                style={{ display: 'inline-block', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 12, color: '#fff', backgroundColor: 'var(--brand-red)', padding: '8px 20px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                Unlock full lesson →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Section divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 2, backgroundColor: 'var(--media-ink)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: 'var(--media-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          What&apos;s inside the Academy
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
      </div>

      {/* Course grid */}
      {allCourses.length > 0 ? (
        <div className="media-academy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {allCourses.map(c => {
            const pNum = c.pillar_number ?? 1
            const gradient = PILLAR_GRADIENTS[pNum] ?? PILLAR_GRADIENTS[1]
            const lessonCount = countMap.get(c.id) ?? 0
            return (
              <div key={c.id} style={{ backgroundColor: '#fff', border: '1px solid var(--paper-line)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/9', background: gradient }} />
                <div style={{ padding: '9px 10px 11px' }}>
                  <p style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', color: pillarColor(c.pillar_number), marginBottom: 3 }}>
                    {pillarName(c.pillar_number)} · {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--media-ink)', lineHeight: 1.25, margin: '0 0 6px' }}>
                    {c.title}
                  </p>
                  <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(43,58,90,0.35)', backgroundColor: 'rgba(43,58,90,0.06)', padding: '2px 6px', borderRadius: 2 }}>
                    🔒 Members only
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '40px 0', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>Courses coming soon.</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{ backgroundColor: 'var(--media-ink)', borderRadius: 4, padding: 20, textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 20, color: '#fff', textTransform: 'uppercase', lineHeight: 1.15, margin: '0 0 6px' }}>
          Ready to accelerate your sales career?
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', margin: '0 0 14px' }}>
          Join Evolved Pros to unlock all 6 pillars, live coaching, and the community.
        </p>
        <Link
          href="/pricing"
          style={{ display: 'inline-block', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 13, color: 'var(--media-ink)', backgroundColor: 'var(--brand-gold)', padding: '10px 24px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}
        >
          Start your journey →
        </Link>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 767px) {
          .media-academy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
