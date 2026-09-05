/**
 * Podcast guest submit CRM intake (Phase B).
 *
 * POST /api/guest/submit already writes guest_engagements + users. This
 * module upserts crm_prospects with tag `podcast guest`, links user_id, and
 * fans out the admin NotifBell.
 */

import {
  GUEST_SOURCE,
  PODCAST_GUEST_TAG,
  isoDay,
  notifyIntakeAdmins,
  upsertIntakeProspect,
  type IntakeDb,
  type IntakeUpsertOutcome,
  type NotifyOutcome,
} from './intake'

export { GUEST_SOURCE, PODCAST_GUEST_TAG }

export interface GuestIntakeWrite {
  email: string
  full_name: string
  user_id?: string | null
  company?: string | null
  title?: string | null
}

export function guestFieldSummary(input: GuestIntakeWrite): string {
  const parts = [`Name: ${input.full_name}`, `Email: ${input.email}`]
  if (input.company) parts.push(`Company: ${input.company}`)
  if (input.title) parts.push(`Title: ${input.title}`)
  return parts.join(' · ')
}

export function buildGuestNotesBlock(input: GuestIntakeWrite, now: Date): string {
  return [`[${isoDay(now)}] Podcast guest intake`, guestFieldSummary(input)].join('\n')
}

export function guestNotificationCopy(input: GuestIntakeWrite): { title: string; body: string } {
  const summary = guestFieldSummary(input)
  return {
    title: `Podcast guest: ${summary}`,
    body: summary,
  }
}

export async function upsertGuestProspect(
  db: IntakeDb,
  input: GuestIntakeWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  return upsertIntakeProspect(
    db,
    {
      email: input.email,
      full_name: input.full_name,
      user_id: input.user_id ?? null,
      company: input.company ?? null,
      title: input.title ?? null,
      source: GUEST_SOURCE,
      tags: [PODCAST_GUEST_TAG],
      notesBlock: buildGuestNotesBlock(input, now),
      stage: 'professional',
      consent_basis: 'express',
      keynote_interest: false,
      promoteStage: 'professional',
    },
    now,
  )
}

export async function notifyGuestAdmins(
  db: IntakeDb,
  input: GuestIntakeWrite,
): Promise<NotifyOutcome> {
  return notifyIntakeAdmins(db, guestNotificationCopy(input))
}

export function guestWriteFromSubmit(input: {
  email: string | null | undefined
  full_name: string | null | undefined
  user_id: string
  company?: string | null
  title?: string | null
}): GuestIntakeWrite | null {
  const email = (input.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return null
  const full_name = (input.full_name ?? '').trim() || email.split('@')[0] || 'Podcast guest'
  return {
    email,
    full_name,
    user_id: input.user_id,
    company: input.company ?? null,
    title: input.title ?? null,
  }
}
