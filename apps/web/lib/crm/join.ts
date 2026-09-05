/**
 * Join / signup CRM intake (Phase B).
 *
 * /join and /signup 308 to /login?mode=signup. After password signUp or a
 * magic-link send in signup mode, the client posts /api/auth/provision.
 * onboarding/complete is the backstop for anyone who skipped the client hook.
 *
 * Tag: `join`. New rows land in community (free membership). Existing paid
 * or comped rows are never demoted.
 */

import type { LoginMode } from '@/lib/auth/loginCopy'
import type { SignUpOutcome } from '@/lib/auth/passwordAuth'
import {
  JOIN_SOURCE,
  JOIN_TAG,
  isoDay,
  notifyIntakeAdmins,
  upsertIntakeProspect,
  type IntakeDb,
  type IntakeUpsertOutcome,
  type NotifyOutcome,
} from './intake'

const EMAIL_MAX = 320
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export { JOIN_SOURCE, JOIN_TAG }

export type JoinValidation =
  | { kind: 'ok'; email: string }
  | { kind: 'invalid'; error: string }
  | { kind: 'bot' }

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._+]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || 'New member'
}

export function validateJoinEmail(body: {
  email?: unknown
  website?: unknown
}): JoinValidation {
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { kind: 'bot' }
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, EMAIL_MAX) : ''
  if (!email || !EMAIL_RE.test(email)) {
    return { kind: 'invalid', error: 'A valid email address is required.' }
  }
  return { kind: 'ok', email }
}

export function shouldProvisionJoin(opts: {
  mode: LoginMode
  kind: 'password-signup' | 'magic-otp'
  outcome?: SignUpOutcome
}): boolean {
  if (opts.mode !== 'signup') return false
  if (opts.kind === 'magic-otp') return true
  return opts.outcome === 'signedIn' || opts.outcome === 'confirmEmail'
}

export function buildJoinNotesBlock(now: Date): string {
  return `[${isoDay(now)}] Join / signup`
}

export function joinNotificationCopy(email: string, fullName?: string | null): {
  title: string
  body: string
} {
  const parts = fullName && fullName !== displayNameFromEmail(email)
    ? [`Name: ${fullName}`, `Email: ${email}`]
    : [`Email: ${email}`]
  const summary = parts.join(' · ')
  return {
    title: `New join: ${summary}`,
    body: summary,
  }
}

export interface JoinWrite {
  email: string
  full_name?: string | null
  user_id?: string | null
}

export async function upsertJoinProspect(
  db: IntakeDb,
  input: JoinWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  const full_name = (input.full_name ?? '').trim() || displayNameFromEmail(input.email)
  return upsertIntakeProspect(
    db,
    {
      email: input.email,
      full_name,
      user_id: input.user_id ?? null,
      source: JOIN_SOURCE,
      tags: [JOIN_TAG],
      notesBlock: buildJoinNotesBlock(now),
      stage: 'community',
      consent_basis: 'express',
      keynote_interest: false,
      promoteStage: 'community',
    },
    now,
  )
}

export async function notifyJoinAdmins(
  db: IntakeDb,
  input: JoinWrite,
): Promise<NotifyOutcome> {
  const full_name = (input.full_name ?? '').trim() || null
  return notifyIntakeAdmins(db, joinNotificationCopy(input.email, full_name))
}

/** Backstop only: skip the bell when the join tag was already on the row. */
export function shouldNotifyJoinBackstop(outcome: IntakeUpsertOutcome): boolean {
  return outcome.kind !== 'error' && outcome.addedTags.includes(JOIN_TAG)
}

export async function requestJoinProvision(email: string): Promise<void> {
  try {
    await fetch('/api/auth/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    // Best-effort. Signup must not fail because CRM is down.
  }
}
