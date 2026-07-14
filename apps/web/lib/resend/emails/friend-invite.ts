import { Resend } from 'resend'
import { FriendInviteEmail } from './FriendInvite'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'Evolved Pros <onboarding@resend.dev>'

/**
 * Send a Friends of George invite email. Delivery is best-effort — the
 * evolvedpros.com Resend domain is unverified, so the admin UI ALWAYS exposes a
 * copy-link fallback. Returns whether the send succeeded so the caller can
 * surface delivery status per recipient without failing the whole request.
 */
export async function sendFriendInviteEmail(email: string, inviteUrl: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'George invited you to Evolved Pros',
      react: FriendInviteEmail({ inviteUrl }),
    })
    return !error
  } catch {
    return false
  }
}
