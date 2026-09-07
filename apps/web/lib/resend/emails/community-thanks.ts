import { Resend } from 'resend'
import { CommunityThanksEmail } from './CommunityThanks'
import { THANKS_TEMPLATE_IDS, type ThanksCadenceStep } from '@/lib/thanks/constants'
import { buildThanksEmailCopy, type ThanksEmailVars } from '@/lib/thanks/copy'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'Evolved Pros <onboarding@resend.dev>'

export type ThanksSendResult = {
  delivered: boolean
  resendId?: string
}

/**
 * Gated send for thank-you Community cadence mail.
 * Callers MUST collect an explicit YES before invoking this.
 * Delivery is best-effort. Admin UI always exposes copy-link.
 */
export async function sendCommunityThanksEmail(
  email: string,
  step: ThanksCadenceStep,
  vars: ThanksEmailVars,
): Promise<ThanksSendResult> {
  const copy = buildThanksEmailCopy(step, vars)
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: copy.subject,
      react: CommunityThanksEmail({
        step,
        first_name: vars.first_name,
        claim_url: vars.claim_url,
        george_signoff: vars.george_signoff,
      }),
      tags: [
        { name: 'lane', value: 'thanks-community' },
        { name: 'template', value: THANKS_TEMPLATE_IDS[step] },
        { name: 'cadence', value: step },
      ],
    })
    if (error) return { delivered: false }
    return { delivered: true, resendId: data?.id }
  } catch {
    return { delivered: false }
  }
}
