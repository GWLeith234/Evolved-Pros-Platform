/**
 * Conversion CRM intake: welcome claim, redeem, Stripe checkout (Phase B).
 *
 * These are not cold leads. The shared upsert merges by email, promotes
 * stage to the granted / paid tier (never demotes), and fans out one admin
 * NotifBell per event.
 *
 * Tags (George YES): welcome = `friend of george`, redeem = `comp`, Stripe = `paid`.
 */

import {
  COMP_TAG,
  FRIEND_OF_GEORGE_TAG,
  PAID_SOURCE,
  PAID_TAG,
  REDEEM_SOURCE,
  WELCOME_SOURCE,
  crmStageForTier,
  isoDay,
  notifyIntakeAdmins,
  upsertIntakeProspect,
  type IntakeDb,
  type IntakeUpsertOutcome,
  type NotifyOutcome,
} from './intake'
import { displayNameFromEmail } from './join'

export { COMP_TAG, FRIEND_OF_GEORGE_TAG, PAID_TAG }

export interface ConversionWrite {
  email: string
  full_name?: string | null
  user_id?: string | null
  tier?: string | null
}

function nameOf(input: ConversionWrite): string {
  const given = (input.full_name ?? '').trim()
  return given || displayNameFromEmail(input.email)
}

function conversionSummary(input: ConversionWrite, extra?: string | null): string {
  const parts = [`Email: ${input.email}`]
  if (input.tier) parts.push(`Tier: ${input.tier}`)
  if (extra) parts.push(extra)
  return parts.join(' · ')
}

export function welcomeNotificationCopy(input: ConversionWrite): { title: string; body: string } {
  const summary = conversionSummary(input)
  return { title: `Welcome claim: ${summary}`, body: summary }
}

export function redeemNotificationCopy(input: ConversionWrite): { title: string; body: string } {
  const summary = conversionSummary(input)
  return { title: `Comp redeemed: ${summary}`, body: summary }
}

export function paidNotificationCopy(input: ConversionWrite): { title: string; body: string } {
  const summary = conversionSummary(input)
  return { title: `Paid checkout: ${summary}`, body: summary }
}

export function buildWelcomeNotesBlock(input: ConversionWrite, now: Date): string {
  return [`[${isoDay(now)}] Welcome claim`, conversionSummary(input)].join('\n')
}

export function buildRedeemNotesBlock(input: ConversionWrite, now: Date): string {
  return [`[${isoDay(now)}] Comp code redeemed`, conversionSummary(input)].join('\n')
}

export function buildPaidNotesBlock(input: ConversionWrite, now: Date): string {
  return [`[${isoDay(now)}] Paid checkout`, conversionSummary(input)].join('\n')
}

async function upsertConversion(
  db: IntakeDb,
  input: ConversionWrite,
  spec: {
    source: string
    tags: string[]
    notesBlock: string
  },
  now: Date,
): Promise<IntakeUpsertOutcome> {
  const stage = crmStageForTier(input.tier)
  return upsertIntakeProspect(
    db,
    {
      email: input.email.trim().toLowerCase(),
      full_name: nameOf(input),
      user_id: input.user_id ?? null,
      source: spec.source,
      tags: spec.tags,
      notesBlock: spec.notesBlock,
      stage,
      consent_basis: 'express',
      keynote_interest: false,
      promoteStage: stage === 'lead' ? null : stage,
    },
    now,
  )
}

export async function upsertWelcomeProspect(
  db: IntakeDb,
  input: ConversionWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  return upsertConversion(
    db,
    input,
    {
      source: WELCOME_SOURCE,
      tags: [FRIEND_OF_GEORGE_TAG, COMP_TAG],
      notesBlock: buildWelcomeNotesBlock(input, now),
    },
    now,
  )
}

export async function upsertRedeemProspect(
  db: IntakeDb,
  input: ConversionWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  return upsertConversion(
    db,
    input,
    {
      source: REDEEM_SOURCE,
      tags: [COMP_TAG],
      notesBlock: buildRedeemNotesBlock(input, now),
    },
    now,
  )
}

export async function upsertPaidProspect(
  db: IntakeDb,
  input: ConversionWrite,
  now: Date = new Date(),
): Promise<IntakeUpsertOutcome> {
  return upsertConversion(
    db,
    input,
    {
      source: PAID_SOURCE,
      tags: [PAID_TAG],
      notesBlock: buildPaidNotesBlock(input, now),
    },
    now,
  )
}

export async function notifyWelcomeAdmins(db: IntakeDb, input: ConversionWrite): Promise<NotifyOutcome> {
  return notifyIntakeAdmins(db, welcomeNotificationCopy(input))
}

export async function notifyRedeemAdmins(db: IntakeDb, input: ConversionWrite): Promise<NotifyOutcome> {
  return notifyIntakeAdmins(db, redeemNotificationCopy(input))
}

export async function notifyPaidAdmins(db: IntakeDb, input: ConversionWrite): Promise<NotifyOutcome> {
  return notifyIntakeAdmins(db, paidNotificationCopy(input))
}

/** Swallow CRM failures so the primary grant / payment path still succeeds. */
export async function bestEffortConversion(
  label: string,
  run: () => Promise<IntakeUpsertOutcome>,
  notify: () => Promise<NotifyOutcome>,
  notifyAlso = true,
): Promise<void> {
  try {
    const out = await run()
    if (out.kind === 'error') {
      console.error(`[${label}] prospect write failed`, out.code ?? 'unknown')
      return
    }
    if (!notifyAlso) return
    const n = await notify()
    if (n.code) console.error(`[${label}] admin notify failed`, n.code)
  } catch {
    console.error(`[${label}] crm intake threw`)
  }
}
