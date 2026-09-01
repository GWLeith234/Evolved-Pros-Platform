'use client'

import { useRouter } from 'next/navigation'
import { ProgressBar } from '@evolved-pros/ui'
import type { CourseWithProgress } from '@/lib/academy/types'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import { buildUpgradeHref, tierBadgeLabel, tierPlanName } from '@/lib/academy/gating'

interface CourseCardProps {
  course: CourseWithProgress
  isLocked: boolean
  userTier: string | null
}

/**
 * Immersive pillar course card — standardized progress, done state, hover
 * (Sprint 2). Visual language matches InProgressPillarHero + design tokens.
 *
 * SPRINT TIER-1 — the grid is a STOREFRONT. A locked card is not a dead,
 * dimmed placeholder: it keeps its title, pillar color, artwork and lesson
 * count, wears a VIP/PRO badge, and the whole card is a live link to the
 * pricing page pre-scoped to this pillar. The only thing a lock removes is
 * the member's own progress (there is none) and the route into the content.
 */
export function CourseCard({ course, isLocked, userTier }: CourseCardProps) {
  const router = useRouter()
  const isComplete = course.progressPct === 100
  // Fall back to the Pillar 1 config rather than a raw hex literal: the color
  // is concatenated with alpha suffixes below, so it has to stay a hex string
  // (a var() would produce invalid CSS), and lib/pillar-colors is the token
  // source of truth for those six values.
  const config = PILLAR_CONFIG[course.pillarNumber] ?? PILLAR_CONFIG[1]
  const imageUrl = config.image
  const pillarColor = config.color
  const pillar =
    course.pillarNumber >= 1 && course.pillarNumber <= 6
      ? (course.pillarNumber as 1 | 2 | 3 | 4 | 5 | 6)
      : undefined

  void userTier
  const tierBadge = tierBadgeLabel(course.requiredTier)
  const planName = tierPlanName(course.requiredTier)
  const upgradeHref = buildUpgradeHref({
    from: 'academy',
    tier: course.requiredTier,
    pillar: course.pillarNumber,
  })
  const destination = isLocked ? upgradeHref : `/academy/${course.slug}`

  function handleClick() {
    router.push(destination)
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={
        isLocked
          ? `Pillar ${course.pillarNumber}: ${course.title} — unlock with ${planName}`
          : undefined
      }
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
      className={`ep-course-card relative overflow-hidden${isLocked ? ' ep-course-card--locked' : ''}${isComplete ? ' ep-course-card--done' : ''}`}
      style={{
        // Mobile overrides height via .ep-course-card (Sprint 4A aspect-ratio).
        height: 240,
        width: '100%',
        maxWidth: '100%',
        // Locked cards take the pillar's own accent border, not the neutral
        // one: the card is merchandise, so it should look as alive as an
        // unlocked one. (Was opacity 0.72 + a grey edge — it read as broken.)
        border: `1px solid ${isComplete || isLocked ? `${pillarColor}66` : 'var(--border-color)'}`,
        borderRadius: 0,
        cursor: 'pointer',
        boxShadow: isComplete ? `0 0 0 1px ${pillarColor}33` : undefined,
      }}
    >
      {/* Background pillar photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="ep-course-card__media absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.40) 52%, transparent 100%)',
        }}
      />

      {/* Pillar accent top bar */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: pillarColor, zIndex: 2 }}
      />

      {/* Large ghost pillar number */}
      <span
        className="absolute top-1 left-3 font-display font-black select-none leading-none"
        style={{ fontSize: 96, color: 'rgba(255,255,255,0.16)', lineHeight: 1 }}
      >
        {course.pillarNumber}
      </span>

      {/* Done badge */}
      {isComplete && !isLocked && (
        <span
          className="absolute top-3 right-3 z-10 font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-2 py-1"
          style={{
            color: 'var(--navy-abyss)',
            background: 'var(--brand-gold)',
            boxShadow: 'var(--shadow-glow-gold)',
          }}
        >
          ✓ Done
        </span>
      )}

      {/* Tier badge — replaces the old grey padlock. The padlock said "you
          can't have this"; the badge says which plan this belongs to, which is
          the whole point of showing the card. Solid pillar color with abyss
          ink: the card art behind it is always dark in both themes. */}
      {isLocked && tierBadge && (
        <span
          className="absolute top-3 right-3 z-10 font-condensed font-black uppercase tracking-[0.16em] text-[11px] px-2 py-1"
          style={{ color: 'var(--navy-abyss)', background: pillarColor }}
        >
          {tierBadge}
        </span>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-[1]">
        {/* Eyebrow = pillar label. Suppress when it duplicates the title
            (e.g. a course literally titled "Foundation") so the card doesn't
            render "FOUNDATION / FOUNDATION". */}
        {(() => {
          const eyebrow = PILLAR_CONFIG[course.pillarNumber]?.label
          if (!eyebrow || eyebrow.trim().toLowerCase() === course.title.trim().toLowerCase()) return null
          return (
            <p
              className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] mb-1"
              style={{ color: pillarColor }}
            >
              {eyebrow}
            </p>
          )
        })()}

        <p className="font-condensed font-bold uppercase text-[14px] text-[#F5F0E8] leading-tight mb-3">
          {course.title}
        </p>

        {isLocked ? (
          /* Lesson count stays visible — it is the merchandise. The whole
             card is the link (see handleClick), so this is text, not a
             nested control. */
          <div className="space-y-1">
            <p
              className="font-condensed uppercase tracking-[0.12em] text-[11px]"
              style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}
            >
              {typeof course.totalLessons === 'number' && course.totalLessons > 0
                ? `${course.totalLessons} ${course.totalLessons === 1 ? 'lesson' : 'lessons'}`
                : 'Lessons coming soon'}
            </p>
            <p
              className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px]"
              style={{ color: pillarColor, margin: 0 }}
            >
              Unlock with {planName} →
            </p>
          </div>
        ) : course.totalLessons === null ? (
          <p className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Lessons coming soon
          </p>
        ) : (
          <div className="space-y-1.5">
            <ProgressBar
              value={course.progressPct}
              pillar={pillar}
              color={isComplete ? '#22c55e' : pillarColor}
              size="sm"
              trackColor="rgba(255,255,255,0.15)"
              meta={
                isComplete
                  ? '✓ Done'
                  : `${course.completedLessons}/${course.totalLessons}`
              }
              showPercent={!isComplete}
              label={undefined}
            />
            <p
              className="font-condensed uppercase tracking-[0.12em] text-[11px]"
              style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}
            >
              {course.totalLessons} {course.totalLessons === 1 ? 'lesson' : 'lessons'}
              {course.progressPct > 0 && !isComplete ? ` · ${course.progressPct}%` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
