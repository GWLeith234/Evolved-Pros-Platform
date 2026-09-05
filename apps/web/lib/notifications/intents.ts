/**
 * Intent helpers for the existing notifications table.
 *
 * Do not invent types here — the CHECK on notifications.type only allows
 * community_reply / community_mention / event_reminder / course_unlock /
 * system_billing / system_general. WIG + daily progress ride system_general;
 * Academy drops reuse course_unlock; LIVE/event drops reuse event_reminder;
 * Media drops ride system_general with a /media action URL.
 */

export const INTENT_TYPE = {
  wig: 'system_general',
  daily: 'system_general',
  academy: 'course_unlock',
  media: 'system_general',
  live: 'event_reminder',
} as const

export const WIG_MILESTONES = [25, 50, 75, 100] as const

/** WelcomeBanner evening starts at 17:00 — same cutoff for daily nudges. */
export const DAILY_EVENING_HOUR_UTC = 17
export const WIG_STALE_DAYS = 7
export const WIG_DEDUPE_MS = 7 * 24 * 60 * 60 * 1000
export const DAILY_DEDUPE_MS = 20 * 60 * 60 * 1000
export const CONTENT_DEDUPE_MS = 7 * 24 * 60 * 60 * 1000

export type WigKind = 'complete' | 'update' | 'weekly' | 'milestone'
export type ContentKind = 'academy' | 'media' | 'live'
export type NotificationIntent = 'wig' | 'progress' | 'content' | 'other'

export function utcDateYmd(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function isoMondayYmd(now: Date = new Date()): string {
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff))
  return monday.toISOString().slice(0, 10)
}

export function isEveningUtc(now: Date = new Date(), hour = DAILY_EVENING_HOUR_UTC): boolean {
  return now.getUTCHours() >= hour
}

export function isStale(
  updatedAt: string | null | undefined,
  now: Date,
  staleDays = WIG_STALE_DAYS,
): boolean {
  if (!updatedAt) return true
  const then = new Date(updatedAt).getTime()
  if (Number.isNaN(then)) return true
  return now.getTime() - then >= staleDays * 24 * 60 * 60 * 1000
}

export function crossedMilestones(
  prev: number,
  next: number,
  marks: readonly number[] = WIG_MILESTONES,
): number[] {
  return marks.filter(m => prev < m && next >= m)
}

export function wigActionUrl(kind: WigKind, extra?: { milestone?: number; weekStart?: string }): string {
  if (kind === 'complete') return '/academy/strategic-approach?wig=complete'
  if (kind === 'milestone') return `/home?wig=milestone-${extra?.milestone ?? 0}`
  if (kind === 'weekly') return `/home?wig=weekly&w=${extra?.weekStart ?? isoMondayYmd()}`
  return '/home?wig=update'
}

export function dailyActionUrl(dateYmd: string): string {
  return `/home?nudge=daily&d=${dateYmd}`
}

export function wigCopy(
  kind: WigKind,
  opts?: { title?: string; milestone?: number },
): { title: string; body: string } {
  if (kind === 'complete') {
    return {
      title: 'Set your quarterly WIG',
      body: 'Your lag measure is empty. Write this quarter’s Wildly Important Goal so Home has something to chase.',
    }
  }
  if (kind === 'milestone') {
    const m = opts?.milestone ?? 0
    return {
      title: `WIG milestone: ${m}%`,
      body: opts?.title
        ? `**${opts.title}** just crossed ${m}%. Log the win and keep the lead measures moving.`
        : `Your quarterly WIG just crossed ${m}%. Keep the lead measures moving.`,
    }
  }
  if (kind === 'weekly') {
    return {
      title: 'Weekly WIG check-in',
      body: opts?.title
        ? `Update **${opts.title}** — a weekly lag check-in keeps the scoreboard honest.`
        : 'Update your quarterly WIG. A weekly lag check-in keeps the scoreboard honest.',
    }
  }
  return {
    title: 'Update your quarterly WIG',
    body: opts?.title
      ? `**${opts.title}** hasn’t moved in a week. Log lag progress or recalibrate.`
      : 'Your quarterly WIG needs an update. Log lag progress on Home.',
  }
}

export function dailyCopy(incomplete: number): { title: string; body: string } {
  return {
    title: 'Log today’s leading measures',
    body: incomplete === 1
      ? 'You still have **1** habit or commitment open. Close the day on Home.'
      : `You still have **${incomplete}** habits or commitments open. Close the day on Home.`,
  }
}

export function contentCopy(
  kind: ContentKind,
  title: string,
  eventType?: string | null,
): { title: string; body: string } {
  if (kind === 'academy') {
    return {
      title: 'New Academy lesson',
      body: `**${title}** just published. Open it while it’s fresh.`,
    }
  }
  if (kind === 'media') {
    return {
      title: 'New Media story',
      body: `**${title}** just dropped on Media.`,
    }
  }
  const live = !eventType || eventType === 'live'
  return {
    title: live ? 'New LIVE event' : 'New event',
    body: `**${title}** is on the calendar. Save your seat.`,
  }
}

export type WigDecision =
  | { kind: 'complete' }
  | { kind: 'update'; title: string }
  | null

export function decideWigNudge(input: {
  hasActiveGoal: boolean
  goalTitle?: string | null
  updatedAt?: string | null
  now?: Date
}): WigDecision {
  const now = input.now ?? new Date()
  if (!input.hasActiveGoal) return { kind: 'complete' }
  if (isStale(input.updatedAt, now)) {
    return { kind: 'update', title: input.goalTitle || 'your WIG' }
  }
  return null
}

export function decideDailyNudge(input: {
  habitsTotal: number
  habitsDone: number
  commitsTotal: number
  commitsDone: number
  hourUtc: number
  eveningHourUtc?: number
}): { incomplete: number } | null {
  const evening = input.eveningHourUtc ?? DAILY_EVENING_HOUR_UTC
  if (input.hourUtc < evening) return null
  const total = input.habitsTotal + input.commitsTotal
  if (total === 0) return null
  const incomplete =
    Math.max(0, input.habitsTotal - input.habitsDone) +
    Math.max(0, input.commitsTotal - input.commitsDone)
  if (incomplete <= 0) return null
  return { incomplete }
}

export function notificationIntent(n: {
  type: string
  title: string
  actionUrl?: string | null
}): NotificationIntent {
  const url = n.actionUrl ?? ''
  if (url.includes('wig=') || /\bWIG\b/i.test(n.title)) return 'wig'
  if (url.includes('nudge=daily') || /leading measures/i.test(n.title)) return 'progress'
  if (url.startsWith('/media/')) return 'content'
  if (n.type === 'course_unlock' && /^New Academy/i.test(n.title)) return 'content'
  if (n.type === 'event_reminder' && /^New /i.test(n.title)) return 'content'
  return 'other'
}

export const INTENT_META: Record<Exclude<NotificationIntent, 'other'>, { label: string; accent: string }> = {
  wig:      { label: 'WIG',      accent: 'var(--notif-academy)' },
  progress: { label: 'Progress', accent: 'var(--notif-community)' },
  content:  { label: 'Content',  accent: 'var(--notif-event)' },
}
