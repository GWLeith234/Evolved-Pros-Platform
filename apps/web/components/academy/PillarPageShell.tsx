import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { hasTierAccess } from '@/lib/tier'
import {
  fetchUserProfile,
  fetchCourseBySlug,
  fetchCourseByPillarNumber,
  fetchLessonsWithProgress,
} from '@/lib/academy/fetchers'
import { PillarModuleAccordion } from '@/components/academy/PillarModuleAccordion'
import { ReflectionPrompt } from '@/components/academy/ReflectionPrompt'
import { PillarAudit } from '@/components/academy/PillarAudit'
import { adminClient } from '@/lib/supabase/admin'
import { ProfileAdUnit } from '@/components/profile/ProfileAdUnit'

interface Props {
  pillarNumber?: number
  pillarSlug?: string
  showReflection?: boolean
  showAudit?: boolean
  /** Optional slot rendered below module list */
  children?: ReactNode
}

const PILLAR_REFLECTION_PROMPTS: Record<number, string> = {
  1: 'What is one foundational belief or habit that has shaped your professional identity? How will you actively strengthen it going forward?',
  2: 'Describe the professional identity you are intentionally building. What three words define the person you are becoming?',
  3: 'Recall a high-pressure situation where your mental resolve was tested. What did you learn about your mindset, and how will you apply it?',
  4: 'What is one area where your strategy has been reactive rather than proactive? What will you change?',
  5: 'Who holds you accountable in your professional life? How has that relationship shaped your growth?',
  6: 'Identify one goal where you\'ve struggled to execute consistently. What specific system will you build to close that gap?',
}

const PILLAR_AUDIT_QUESTIONS: Record<number, { id: string; text: string }[]> = {
  1: [
    { id: 'p1q1', text: 'I can clearly articulate my core professional values.' },
    { id: 'p1q2', text: 'My daily habits align with my long-term goals.' },
    { id: 'p1q3', text: 'I have a clear personal mission that guides my decisions.' },
    { id: 'p1q4', text: 'I regularly evaluate and adjust my foundational principles.' },
    { id: 'p1q5', text: 'I know my non-negotiables and hold to them under pressure.' },
  ],
  2: [
    { id: 'p2q1', text: 'I have a clearly defined professional identity I act from.' },
    { id: 'p2q2', text: 'I consistently present myself with confidence and intention.' },
    { id: 'p2q3', text: 'My personal brand is aligned with my goals and values.' },
    { id: 'p2q4', text: 'I actively curate how others perceive me professionally.' },
    { id: 'p2q5', text: 'I know the difference between who I am and who I\'m becoming.' },
  ],
  3: [
    { id: 'p3-1', text: 'How consistently do you show up with full energy regardless of results?' },
    { id: 'p3-2', text: 'How well do you separate your identity from your performance?' },
    { id: 'p3-3', text: 'How quickly do you bounce back after a significant loss?' },
  ],
  4: [
    { id: 'p4-1', text: 'How clearly defined is your Wildly Important Goal right now?' },
    { id: 'p4-2', text: 'How well do you distinguish lead measures from lag measures?' },
    { id: 'p4-3', text: 'How consistently do you execute your weekly strategic priorities?' },
  ],
  5: [
    { id: 'p5-1', text: 'How clearly defined are your lead measures right now?' },
    { id: 'p5-2', text: 'How consistently do you track and update your scoreboard each week?' },
    { id: 'p5-3', text: 'How accountable do you hold yourself to your weekly commitments?' },
  ],
  6: [
    { id: 'p6-1', text: 'How consistent is your daily execution right now — honestly?' },
    { id: 'p6-2', text: 'How clearly defined is your daily habit stack and when each habit fires?' },
    { id: 'p6-3', text: 'How well do you review your own performance each week and adjust?' },
  ],
}

const PILLAR_TAGLINES: Record<number, string> = {
  1: 'Establish the non-negotiable bedrock of your professional identity.',
  2: 'Architect who you are and who you\'re becoming — on purpose.',
  3: 'Build an unshakeable mind that performs under any pressure.',
  4: 'Develop the strategic thinking that separates top performers.',
  5: 'Create the systems and relationships that make excellence inevitable.',
  6: 'Transform decisions and plans into consistent, measurable results.',
}

const PILLAR_QUOTES: Record<number, string> = {
  1: 'Your foundation determines your ceiling. Build it unshakeable.',
  2: 'Who you are in private determines how far you go in public.',
  3: 'The mind breaks before the body. Master one, master both.',
  4: 'Strategy without execution is fantasy. Execution without strategy is chaos.',
  5: 'Accountability is not a burden — it\'s your unfair advantage.',
  6: 'Vision is common. Execution is rare. Be rare.',
}

export async function PillarPageShell({ pillarNumber, pillarSlug, showReflection, showAudit, children }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)

  // Fetch course by pillarNumber (named routes) or slug (dynamic route)
  const course = pillarNumber !== undefined
    ? await fetchCourseByPillarNumber(supabase, pillarNumber)
    : pillarSlug
    ? await fetchCourseBySlug(supabase, pillarSlug)
    : null

  if (!course) notFound()

  // Tier access check — redirect to pricing if user lacks required tier
  if (!hasTierAccess(profile?.tier, (course as Record<string, unknown>).required_tier as 'community' | 'vip' | 'pro')) {
    redirect('/pricing')
  }

  const pNum: number = ((course as Record<string, unknown>).pillar_number as number) ?? pillarNumber ?? 1
  const config = PILLAR_CONFIG[pNum]
  if (!config) notFound()

  const isCourseLocked = !!(course as Record<string, unknown>).is_locked

  const lessons = isCourseLocked
    ? []
    : await fetchLessonsWithProgress(supabase, (course as Record<string, unknown>).slug as string, user.id, profile?.tier)

  const completedCount = lessons.filter(l => l.completedAt).length
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const firstLesson = lessons.find(l => !l.completedAt && !l.isLocked) ?? lessons[0]
  const isAllComplete = lessons.length > 0 && completedCount === lessons.length

  // Group lessons by module_number
  const moduleMap = new Map<number, typeof lessons>()
  for (const lesson of lessons) {
    const mod = lesson.moduleNumber ?? 1
    if (!moduleMap.has(mod)) moduleMap.set(mod, [])
    moduleMap.get(mod)!.push(lesson)
  }
  const moduleGroups = Array.from(moduleMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([moduleNumber, lessonList]) => ({
      moduleNumber,
      lessons: lessonList.map(l => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        sortOrder: l.sortOrder,
        completedAt: l.completedAt,
        durationSeconds: l.durationSeconds,
      })),
    }))

  const courseSlug = (course as Record<string, unknown>).slug as string
  const tagline = PILLAR_TAGLINES[pNum] ?? ''
  const quote = PILLAR_QUOTES[pNum] ?? ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pillarAdData } = await (adminClient.from('platform_ads' as any) as any)
    .select('id, image_url, headline, tool_name, cta_text, link_url, click_url, sponsor_name')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pillarAd = (pillarAdData as any) ?? null

  return (
    <main style={{ backgroundColor: '#0A0F18', minHeight: '100vh', color: '#faf9f7' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '65vh', display: 'flex', alignItems: 'flex-end' }}>
        {/* Background image + color fallback */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${config.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: '#1b3c5a',
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(10,15,24,0.15) 0%, rgba(10,15,24,0.97) 100%)',
          }}
        />
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 clamp(24px, 8vw, 96px) 72px' }}>
          <p
            style={{
              color: config.color, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 10px',
            }}
          >
            Pillar {pNum}
          </p>
          <h1
            style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
              fontSize: 'clamp(56px, 10vw, 96px)', lineHeight: 0.88,
              textTransform: 'uppercase', color: '#faf9f7',
              margin: '0 0 20px', letterSpacing: '-0.02em',
            }}
          >
            {config.label}
          </h1>
          <p style={{ color: 'rgba(250,249,247,0.6)', fontSize: '16px', lineHeight: 1.6, margin: '0 0 36px', maxWidth: '500px' }}>
            {tagline}
          </p>

          {/* Progress bar */}
          {!isCourseLocked && lessons.length > 0 && progressPct > 0 && (
            <div style={{ maxWidth: '360px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '10px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.35)',
                  }}
                >
                  Progress
                </span>
                <span
                  style={{
                    fontSize: '10px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                    letterSpacing: '0.12em', color: config.color,
                  }}
                >
                  {progressPct}%
                </span>
              </div>
              <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: config.color, borderRadius: '2px' }} />
              </div>
            </div>
          )}

          {/* CTA */}
          {!isCourseLocked && firstLesson && (
            <a
              href={`/academy/${courseSlug}/${firstLesson.slug}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: config.color, color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '14px 28px', borderRadius: '4px', textDecoration: 'none',
              }}
            >
              {progressPct > 0 && !isAllComplete ? `Continue ${config.label}` : `Start ${config.label}`} →
            </a>
          )}
        </div>
      </section>

      {/* ── LOCK STATE ─────────────────────────────────────────── */}
      {isCourseLocked && (() => {
        const prevPillarNum = pNum - 1
        const prevConfig = PILLAR_CONFIG[prevPillarNum]
        const prevSlugMap: Record<number, string> = {
          2: '/academy/foundation',
          3: '/academy/identity',
          4: '/academy/mental-toughness',
          5: '/academy/strategic-approach',
          6: '/academy/accountability',
        }
        const prevHref = prevSlugMap[pNum] ?? '/academy'
        const prevLabel = prevConfig?.label ?? 'Previous Pillar'
        const GOLD = '#C9A84C'
        return (
          <section style={{ backgroundColor: 'var(--bg-surface)', padding: '80px clamp(24px, 8vw, 96px)' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              gap: '20px', maxWidth: '460px', margin: '0 auto',
            }}>
              {/* Gold lock icon */}
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: 'rgba(201,168,76,0.1)',
                border: `2px solid ${GOLD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              {/* Heading */}
              <h2 style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
                fontSize: 'clamp(24px, 4vw, 32px)', textTransform: 'uppercase',
                color: '#faf9f7', margin: 0, letterSpacing: '0.04em',
              }}>
                This Pillar is Locked
              </h2>

              {/* Subtext */}
              <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '15px', lineHeight: 1.65, margin: 0 }}>
                Complete <strong style={{ color: 'rgba(250,249,247,0.75)', fontWeight: 600 }}>{prevLabel}</strong> to unlock {config.label}.
                Pillars unlock in sequence as you complete each capstone.
              </p>

              {/* CTA */}
              <a
                href={prevHref}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  border: `1px solid ${GOLD}`,
                  color: GOLD,
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                  fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '12px 28px', borderRadius: '4px', textDecoration: 'none',
                  marginTop: '4px',
                  transition: 'background 0.2s',
                }}
              >
                Go to {prevLabel} →
              </a>

              {/* Back link */}
              <a
                href="/academy"
                style={{
                  color: 'rgba(250,249,247,0.25)', fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 700, fontSize: '11px', letterSpacing: '0.15em',
                  textTransform: 'uppercase', textDecoration: 'none',
                }}
              >
                ← All Pillars
              </a>
            </div>
          </section>
        )
      })()}

      {/* ── MODULE LIST ────────────────────────────────────────── */}
      {!isCourseLocked && moduleGroups.length > 0 && (
        <section style={{ backgroundColor: '#0A0F18', padding: '56px clamp(24px, 8vw, 96px)' }}>
          <div style={{ maxWidth: '820px' }}>
            <p
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px',
                letterSpacing: '0.25em', textTransform: 'uppercase',
                color: 'rgba(250,249,247,0.3)', marginBottom: '24px',
              }}
            >
              Course Modules · {lessons.length} Lessons
            </p>
            <PillarModuleAccordion
              modules={moduleGroups}
              courseSlug={courseSlug}
              pillarColor={config.color}
            />
          </div>
        </section>
      )}

      {!isCourseLocked && lessons.length === 0 && (
        <section style={{ backgroundColor: 'var(--bg-surface)', padding: '56px clamp(24px, 8vw, 96px)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(250,249,247,0.3)', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Lessons coming soon
          </p>
        </section>
      )}

      {/* ── REFLECTION / AUDIT / CHILDREN SLOT ─────────────── */}
      {!isCourseLocked && (showReflection || showAudit || children) && (
        <section style={{ backgroundColor: '#0A0F18', padding: '0 clamp(24px, 8vw, 96px) 56px' }}>
          <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {showReflection && (
              <ReflectionPrompt
                pillarId={String(pNum)}
                courseId={(course as Record<string, unknown>).id as string}
                promptText={PILLAR_REFLECTION_PROMPTS[pNum] ?? 'What stood out to you from this pillar?'}
              />
            )}
            {showAudit && (
              <PillarAudit
                pillarId={String(pNum)}
                courseId={(course as Record<string, unknown>).id as string}
                questions={PILLAR_AUDIT_QUESTIONS[pNum] ?? []}
                pillarColor={config.color}
              />
            )}
            {children}
          </div>
        </section>
      )}

      {/* ── QUOTE STRIP ────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '96px clamp(24px, 8vw, 96px)' }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${config.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center 40%',
            backgroundColor: '#1b3c5a',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,15,24,0.9)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              color: '#C9A84C',
              fontSize: 'clamp(20px, 2.8vw, 30px)',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontStyle: 'italic', lineHeight: 1.45, margin: 0,
            }}
          >
            &ldquo;{quote}&rdquo;
          </p>
          {pillarAd && (
            <div style={{ marginTop: '32px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              <ProfileAdUnit ad={pillarAd} />
            </div>
          )}
          <p
            style={{
              color: 'rgba(250,249,247,0.3)', fontSize: '11px',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '28px',
            }}
          >
            — The Evolved Architecture™
          </p>
        </div>
      </section>

      {/* ── COMPLETION ─────────────────────────────────────────── */}
      {isAllComplete && (
        <section
          style={{
            backgroundColor: 'var(--bg-surface)', padding: '72px clamp(24px, 8vw, 96px)',
            textAlign: 'center',
            borderTop: `1px solid ${config.color}22`,
          }}
        >
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: config.colorMuted,
                border: `2px solid ${config.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
                fontSize: '36px', textTransform: 'uppercase', color: '#faf9f7', margin: '0 0 12px',
              }}
            >
              {config.label} Complete
            </h2>
            <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 36px' }}>
              You&apos;ve finished all lessons in this pillar. On to the next.
            </p>
            <a
              href="/academy"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                backgroundColor: config.color, color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '12px 24px', borderRadius: '4px', textDecoration: 'none',
              }}
            >
              Back to Academy →
            </a>
          </div>
        </section>
      )}

    </main>
  )
}
