import { Resend } from 'resend'
import { EventReminderEmail } from './EventReminder'
import type { EventType } from '@/lib/events/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEventReminderEmail({
  email,
  displayName,
  event,
}: {
  email: string
  displayName: string
  event: {
    id: string
    title: string
    eventType: EventType
    startsAt: string
    endsAt: string | null
    zoomUrl: string | null
    description: string | null
  }
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to:   email,
    subject: `Tomorrow: ${event.title}`,
    react: EventReminderEmail({ displayName, event }),
  })
}
