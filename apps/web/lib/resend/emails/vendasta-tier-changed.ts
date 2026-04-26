import { Resend } from 'resend'
import { VendastaTierChangedEmail } from './VendastaTierChangedEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

const tierLabel: Record<'community' | 'pro', string> = {
  community: 'Community',
  pro:       'Pro',
}

export async function sendVendastaTierChangedEmail({
  email,
  firstName,
  oldTier,
  newTier,
}: {
  email: string
  firstName: string
  oldTier: 'community' | 'pro'
  newTier: 'community' | 'pro'
}) {
  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      email,
    subject: `Your Evolved Pros tier was upgraded to ${tierLabel[newTier]}`,
    react:   VendastaTierChangedEmail({ firstName, oldTier, newTier }),
  })
}
