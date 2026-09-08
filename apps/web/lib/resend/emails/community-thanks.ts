import { Resend } from 'resend'
import { CommunityThanksEmail } from './CommunityThanks'
import { THANKS_TEMPLATE_IDS, thanksEmailCode, type ThanksCadenceStep } from '@/lib/thanks/constants'
import { buildThanksEmailCopy, type ThanksEmailVars } from '@/lib/thanks/copy'
import { resolveThanksFromAddress } from '@/lib/thanks/fromAddress'
import { loadThanksV12CidAttachments, renderThanksV12Html } from '@/lib/thanks/v12Html'

const resend = new Resend(process.env.RESEND_API_KEY)

export type ThanksSendResult = {
  delivered: boolean
  resendId?: string
  error?: string
}

/**
 * Gated send for thank-you Community cadence mail.
 * Callers MUST collect an explicit YES before invoking this.
 * Delivery is best-effort. Admin UI always exposes copy-link.
 *
 * Prefers send-ready-v14 raw HTML when eNN-dDD.html is on disk.
 * Substitutes {{first_name}} and {{claim_url}} only. Headshot is
 * cid:george-headshot. Never cid:logo. E01 header is the hosted PNG.
 * Falls back to the React scaffold when that file is not landed yet.
 *
 * From address: RESEND_FROM_EMAIL must be *@evolvedpros.com or
 * *@mail.evolvedpros.com. No EVX / resend.dev fallback.
 */
export async function sendCommunityThanksEmail(
  email: string,
  step: ThanksCadenceStep,
  vars: ThanksEmailVars,
): Promise<ThanksSendResult> {
  const from = resolveThanksFromAddress(process.env.RESEND_FROM_EMAIL)
  if (!from.ok) {
    return { delivered: false, error: 'RESEND_FROM_EMAIL must be *@evolvedpros.com or *@mail.evolvedpros.com' }
  }

  const copy = buildThanksEmailCopy(step, vars)
  const html = renderThanksV12Html(step, {
    first_name: vars.first_name,
    claim_url: vars.claim_url,
  })
  const attachments = html ? loadThanksV12CidAttachments() : []

  try {
    const { data, error } = await resend.emails.send({
      from: from.from,
      to: email,
      subject: copy.subject,
      ...(html
        ? { html, attachments }
        : {
            react: CommunityThanksEmail({
              step,
              first_name: vars.first_name,
              claim_url: vars.claim_url,
              george_signoff: vars.george_signoff,
            }),
          }),
      tags: [
        { name: 'lane', value: 'thanks-community' },
        { name: 'template', value: THANKS_TEMPLATE_IDS[step] },
        { name: 'cadence', value: thanksEmailCode(step) },
      ],
    })
    if (error) return { delivered: false }
    return { delivered: true, resendId: data?.id }
  } catch {
    return { delivered: false }
  }
}
