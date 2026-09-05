import Link from 'next/link'
import { ProgressBar } from '@evolved-pros/ui'
import { remainingLessonLabel } from '@/lib/home/bands'
import {
  ACADEMY_STILL_ALT,
  ACADEMY_STILL_DARK,
  ACADEMY_STILL_LIGHT,
  stripEmDashCopy,
} from '@/lib/home/cardImagery'
import { eventCardImageAlt, eventCardImageUrl } from '@/lib/events/cityStock'

export interface HomeFuelAcademy {
  title: string
  href: string
  pillarName: string
  moduleLabel: string
  remainingLabel: string | null
  progressPct: number
}

export interface HomeFuelThread {
  title: string
  href: string
  authorName: string
  replyLabel: string
  age: string
}

export interface HomeFuelLive {
  title: string
  href: string
  whenLabel: string
  isLive: boolean
  imageUrl: string | null
  city: string | null
}

interface HomeFuelBandProps {
  academy: HomeFuelAcademy | null
  thread: HomeFuelThread | null
  live: HomeFuelLive | null
}

export function HomeFuelBand({ academy, thread, live }: HomeFuelBandProps) {
  const liveTitle = live ? stripEmDashCopy(live.title) : 'No live session on the board'
  const liveImage = eventCardImageUrl(live?.imageUrl)
  const liveAlt = eventCardImageAlt(live?.city)

  return (
    <section aria-label="Fuel" className="ep-stack--tight">
      <div>
        <p className="font-condensed text-ep-label font-bold uppercase tracking-[0.18em] text-tertiary m-0">
          Fuel
        </p>
        <h2 className="font-bebas text-[26px] leading-none tracking-[0.04em] uppercase text-primary mt-1 mb-0">
          Stay on track
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FuelCard
          eyebrow="Academy"
          title={academy ? `Continue: ${stripEmDashCopy(academy.title)}` : 'Open the Academy'}
          meta={
            academy
              ? [academy.moduleLabel, academy.pillarName, academy.remainingLabel]
                  .filter(Boolean)
                  .join(' · ')
              : 'Start Foundation when you are ready.'
          }
          href={academy?.href ?? '/academy'}
          cta="Resume lesson"
          accent="var(--teal)"
          progress={academy?.progressPct}
          image={{
            src: ACADEMY_STILL_LIGHT,
            srcDark: ACADEMY_STILL_DARK,
            alt: ACADEMY_STILL_ALT,
          }}
        />
        <FuelCard
          eyebrow="Community"
          title={thread ? stripEmDashCopy(thread.title) : 'Share a question or a win'}
          meta={
            thread
              ? `${thread.authorName} · ${thread.replyLabel} · ${thread.age}`
              : 'The feed is quiet. Be the first post.'
          }
          href={thread?.href ?? '/community'}
          cta="Join thread"
          accent="var(--teal)"
        />
        <FuelCard
          eyebrow="Live"
          title={liveTitle}
          meta={live?.whenLabel ?? 'Watch the calendar for the next workshop.'}
          href={live?.href ?? '/events'}
          cta={live ? 'Save my seat' : 'View events'}
          accent="var(--red)"
          live={live?.isLive}
          image={live ? { src: liveImage, alt: liveAlt } : undefined}
        />
      </div>
    </section>
  )
}

function FuelCard({
  eyebrow,
  title,
  meta,
  href,
  cta,
  accent,
  progress,
  live,
  image,
}: {
  eyebrow: string
  title: string
  meta: string
  href: string
  cta: string
  accent: string
  progress?: number
  live?: boolean
  image?: { src: string; srcDark?: string; alt: string }
}) {
  return (
    <article
      className="ep-surface-card flex flex-col min-w-0"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        padding: 'var(--space-card)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <p
          className="font-condensed text-ep-label font-extrabold uppercase tracking-[0.18em] m-0"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        {live && (
          <span className="inline-flex items-center gap-1.5 font-condensed text-ep-label font-extrabold uppercase tracking-[0.14em]" style={{ color: 'var(--red)' }}>
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--red)' }}
            />
            Live
          </span>
        )}
      </div>
      <h3 className="font-condensed text-[18px] font-bold leading-snug text-primary m-0">
        {title}
      </h3>
      <p className="font-body text-ep-body-sm text-secondary m-0 mt-2">{meta}</p>
      {progress != null && (
        <div className="mt-3">
          <ProgressBar value={progress} color="var(--teal)" size="sm" showPercent={false} />
        </div>
      )}
      {image && (
        <div
          className="relative mt-4 overflow-hidden"
          style={{
            aspectRatio: '16 / 9',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            width={640}
            height={360}
            loading="lazy"
            decoding="async"
            className={
              image.srcDark
                ? 'absolute inset-0 h-full w-full object-cover dark:hidden'
                : 'absolute inset-0 h-full w-full object-cover'
            }
          />
          {image.srcDark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.srcDark}
              alt=""
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              aria-hidden
              className="absolute inset-0 hidden h-full w-full object-cover dark:block"
            />
          ) : null}
        </div>
      )}
      <Link
        href={href}
        className="mt-auto pt-4 font-condensed text-[12px] font-extrabold uppercase tracking-[0.14em] no-underline"
        style={{ color: accent }}
      >
        {cta} →
      </Link>
    </article>
  )
}

export function academyFuelFromProgress(input: {
  nextLessonTitle: string | null
  pillarName: string
  courseSlug: string
  nextLessonSlug: string | null
  completedLessons: number
  totalLessons: number
  progressPct: number
  nextLessonDurationSeconds: number | null
}): HomeFuelAcademy {
  const remaining = Math.max(0, input.totalLessons - input.completedLessons)
  const href = input.nextLessonSlug
    ? `/academy/${input.courseSlug}/${input.nextLessonSlug}`
    : `/academy/${input.courseSlug}`
  return {
    title: input.nextLessonTitle ?? input.pillarName,
    href,
    pillarName: `${input.pillarName} pillar`,
    moduleLabel:
      input.totalLessons > 0
        ? `Module ${Math.min(input.totalLessons, input.completedLessons + 1)} of ${input.totalLessons}`
        : 'Academy',
    remainingLabel: remainingLessonLabel(input.nextLessonDurationSeconds, remaining),
    progressPct: input.progressPct,
  }
}
