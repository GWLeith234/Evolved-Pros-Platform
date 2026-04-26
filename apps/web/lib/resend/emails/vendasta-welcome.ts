import { Resend } from 'resend'
import { VendastaWelcomeEmail } from './VendastaWelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVendastaWelcomeEmail({
  email,
  firstName,
  tier,
  magicLink,
}: {
  email: string
  firstName: string
  tier: 'community' | 'pro'
  magicLink: string
}) {
  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      email,
    subject: 'Welcome to Evolved Pros — your access is ready',
    react:   VendastaWelcomeEmail({ firstName, tier, magicLink }),
  })
}
