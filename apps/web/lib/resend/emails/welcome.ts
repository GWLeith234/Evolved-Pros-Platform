import { Resend } from 'resend'
import { WelcomeEmail } from './WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail({
  email,
  fullName,
  tier,
}: {
  email: string
  fullName: string
  tier: 'community' | 'pro'
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to:   email,
    subject: "Welcome to Evolved Pros — you're in.",
    react: WelcomeEmail({ fullName, tier }),
  })
}
