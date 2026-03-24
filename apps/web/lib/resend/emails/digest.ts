import { Resend } from 'resend'
import { DigestEmail } from './DigestEmail'
import type { DigestNotification } from './DigestEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDigestEmail({
  email,
  displayName,
  notifications,
  date,
}: {
  email: string
  displayName: string
  notifications: DigestNotification[]
  date: string
}) {
  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      email,
    subject: `Your Evolved Pros digest — ${notifications.length} update${notifications.length !== 1 ? 's' : ''}`,
    react:   DigestEmail({ displayName, notifications, date }),
  })
}
