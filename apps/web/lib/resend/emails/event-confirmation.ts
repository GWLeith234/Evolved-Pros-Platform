import { Resend } from 'resend'
import { EventConfirmationEmail } from './EventConfirmation'
import type { EventType } from '@/lib/events/types'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EventEmailPayload {
  id: string
  title: string
  eventType: EventType
  startsAt: string
  endsAt: string | null
  zoomUrl: string | null
  description: string | null
}

export async function sendEventConfirmationEmail({
  email,
  displayName,
  event,
}: {
  email: string
  displayName: string
  event: EventEmailPayload
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to:   email,
    subject: `You're registered: ${event.title}`,
    react: EventConfirmationEmail({ displayName, event }),
  })
}
