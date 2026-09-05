import { Resend } from 'resend'
import { KeynoteInquiryEmail } from './KeynoteInquiry'
import type { CleanInquiry } from '@/lib/speaking/inquiry'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'Evolved Pros <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

/**
 * Who gets the internal keynote alert.
 *
 * There is no pre-existing admin-recipient convention in this codebase — every
 * other email module sends to a member address passed by the caller — so this
 * establishes one: ADMIN_NOTIFY_EMAIL, falling back to ADMIN_SCHEDULER_EMAIL
 * (already declared in .env.example) and finally to the address inside
 * RESEND_FROM_EMAIL, which is the domain owner. That last hop means the alert
 * still lands somewhere real on a fresh environment with nothing configured.
 */
export function adminNotifyRecipient(): string | null {
  const explicit = process.env.ADMIN_NOTIFY_EMAIL?.trim() || process.env.ADMIN_SCHEDULER_EMAIL?.trim()
  if (explicit) return explicit

  // RESEND_FROM_EMAIL is usually 'Display Name <box@domain>' — pull the address.
  const angled = FROM_ADDRESS.match(/<([^>]+)>/)
  const bare = (angled?.[1] ?? FROM_ADDRESS).trim()
  return bare.includes('@') ? bare : null
}

/**
 * Notify George about a new keynote inquiry. Best-effort by contract: the
 * caller fires this without awaiting the outcome, because a Resend outage must
 * never fail the visitor's submission — the inquiry is already durable in
 * crm_prospects and in the in-app notification by the time this runs.
 *
 * Returns whether the send succeeded. Never throws, and never logs the
 * inquirer's email, name or message.
 */
export async function sendKeynoteInquiryEmail(inq: CleanInquiry): Promise<boolean> {
  const to = adminNotifyRecipient()
  if (!to) return false

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      // Resend v3 spells this snake_case. Replying in the inbox goes straight
      // to the inquirer rather than to the from-address.
      reply_to: inq.email,
      subject: `Booking inquiry: ${inq.full_name}`,
      react: KeynoteInquiryEmail({
        inquiry: inq,
        crmUrl: `${APP_URL}/admin/crm`,
      }),
    })
    return !error
  } catch {
    return false
  }
}
