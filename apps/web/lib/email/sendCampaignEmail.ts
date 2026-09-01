/**
 * sendCampaignEmail — the ONLY path campaign email may take (SPRINT EM-1).
 *
 * Everything CASL requires is enforced here rather than left to each campaign:
 * suppression and consent are checked before anything is built, the footer is
 * injected rather than opted into, the unsubscribe headers are always set, and
 * every outcome — including refusals — is written to campaign_sends.
 *
 * Campaign mail goes out from CAMPAIGN_FROM_EMAIL, a separate subdomain
 * identity from the transactional sender. That separation is the point: if a
 * campaign draws spam complaints, the reputation damage lands on the campaign
 * subdomain and password resets and receipts keep arriving.
 *
 * PII: nothing here logs an address, a name, or a subject line. Provider and
 * Postgres error MESSAGES can embed the recipient address, so only codes are
 * logged and only codes are persisted.
 *
 * Single recipient by design. No batching or looping helper exists yet — EM-2
 * builds that on top of this, so there is exactly one place the compliance
 * rules can be enforced.
 */

import React from 'react'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'
import { CampaignFooter, campaignFooterText } from '@/lib/resend/emails/CampaignFooter'
import { oneClickUnsubscribeUrl, unsubscribeUrl } from './unsubscribe'
import type { CrmProspect } from '@/lib/admin/crm'

const resend = new Resend(process.env.RESEND_API_KEY)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = adminClient as any

export type CampaignSendStatus = 'sent' | 'failed' | 'suppressed'

export type SuppressionReason = 'unsubscribed' | 'consent_unknown' | 'no_email'

export interface CampaignSendResult {
  status: CampaignSendStatus
  /** Set when status is 'suppressed'. */
  reason?: SuppressionReason
  /** Set when status is 'failed' — a code, never a provider message. */
  errorCode?: string
  resendId?: string
}

/** The prospect fields a campaign send actually depends on. */
export type CampaignRecipient = Pick<
  CrmProspect,
  'id' | 'email' | 'full_name' | 'consent_basis' | 'unsubscribed_at'
>

export interface SendCampaignEmailArgs {
  prospect: CampaignRecipient
  subject: string
  /** The campaign body. The CASL footer is appended to it here. */
  react: React.ReactElement
  /** Stable campaign identifier, e.g. 'webinar-invite-1'. */
  campaignKey: string
}

function campaignFrom(): string | null {
  return process.env.CAMPAIGN_FROM_EMAIL?.trim() || null
}

function senderIdentity(): string {
  return (
    process.env.CAMPAIGN_SENDER_IDENTITY?.trim() ||
    // Deliberately not a fake address: an empty-ish default is a visible defect
    // in a test send, whereas an invented address would be a compliance lie.
    'GWLeith Revenue Growth Solutions'
  )
}

/**
 * Persist the outcome. Never throws into the caller: a logging failure must not
 * turn a delivered email into a caller-visible error, nor a refusal into one.
 */
async function record(
  args: {
    prospectId: string
    email: string
    campaignKey: string
    status: CampaignSendStatus
    resendId?: string
    errorCode?: string
  },
): Promise<void> {
  try {
    const { error } = await db.from('campaign_sends').insert({
      prospect_id: args.prospectId,
      email: args.email,
      campaign_key: args.campaignKey,
      resend_id: args.resendId ?? null,
      status: args.status,
      error_code: args.errorCode ?? null,
    })
    if (error) {
      console.error('[sendCampaignEmail] send log insert failed', error.code ?? 'unknown')
    }
  } catch {
    console.error('[sendCampaignEmail] send log threw')
  }
}

export async function sendCampaignEmail({
  prospect,
  subject,
  react,
  campaignKey,
}: SendCampaignEmailArgs): Promise<CampaignSendResult> {
  const email = (prospect.email ?? '').trim().toLowerCase()

  // ── 1. Refuse before building anything ──────────────────────────────────
  if (!email) {
    return { status: 'suppressed', reason: 'no_email' }
  }
  if (prospect.unsubscribed_at) {
    await record({ prospectId: prospect.id, email, campaignKey, status: 'suppressed' })
    return { status: 'suppressed', reason: 'unsubscribed' }
  }
  if (prospect.consent_basis === 'unknown') {
    // No established consent basis — under CASL that is not a list we may mail.
    await record({ prospectId: prospect.id, email, campaignKey, status: 'suppressed' })
    return { status: 'suppressed', reason: 'consent_unknown' }
  }

  const from = campaignFrom()
  if (!from) {
    console.error('[sendCampaignEmail] CAMPAIGN_FROM_EMAIL is not set')
    await record({
      prospectId: prospect.id,
      email,
      campaignKey,
      status: 'failed',
      errorCode: 'missing_campaign_from',
    })
    return { status: 'failed', errorCode: 'missing_campaign_from' }
  }

  // ── 2. Footer + unsubscribe headers ─────────────────────────────────────
  let visibleUrl: string
  let oneClickUrl: string
  try {
    visibleUrl = unsubscribeUrl(prospect.id)
    oneClickUrl = oneClickUnsubscribeUrl(prospect.id)
  } catch {
    // UNSUBSCRIBE_SECRET missing — we cannot mint a working unsubscribe link,
    // and sending commercial email without one is exactly what CASL forbids.
    console.error('[sendCampaignEmail] cannot mint unsubscribe token')
    await record({
      prospectId: prospect.id,
      email,
      campaignKey,
      status: 'failed',
      errorCode: 'missing_unsubscribe_secret',
    })
    return { status: 'failed', errorCode: 'missing_unsubscribe_secret' }
  }

  const identity = senderIdentity()
  const footerProps = { unsubscribeUrl: visibleUrl, senderIdentity: identity }

  const body = React.createElement(
    React.Fragment,
    null,
    react,
    React.createElement(CampaignFooter, footerProps),
  )

  // ── 3. Send from the campaign identity ──────────────────────────────────
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject,
      react: body,
      text: campaignFooterText(footerProps),
      headers: {
        // URL form is required for One-Click; the mailto is a courtesy fallback
        // for clients that don't implement RFC 8058.
        'List-Unsubscribe': `<${oneClickUrl}>, <mailto:unsubscribe@evolvedpros.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      const code = (error as { name?: string }).name ?? 'send_error'
      console.error('[sendCampaignEmail] provider rejected', code)
      await record({ prospectId: prospect.id, email, campaignKey, status: 'failed', errorCode: code })
      return { status: 'failed', errorCode: code }
    }

    const resendId = data?.id
    await record({ prospectId: prospect.id, email, campaignKey, status: 'sent', resendId })
    return { status: 'sent', resendId }
  } catch {
    console.error('[sendCampaignEmail] send threw')
    await record({
      prospectId: prospect.id,
      email,
      campaignKey,
      status: 'failed',
      errorCode: 'exception',
    })
    return { status: 'failed', errorCode: 'exception' }
  }
}
