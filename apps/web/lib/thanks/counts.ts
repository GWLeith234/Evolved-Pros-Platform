import type { ThanksInviteStatus } from './constants'

export type ThanksCountInvite = {
  status: ThanksInviteStatus | string
  delivered_count?: number | null
  opened_at?: string | null
}

export type ThanksCountSend = {
  status: string
  opened_at?: string | null
}

export type ThanksAdminCounts = {
  invited: number
  delivered: number
  redeemed: number
  stopped: number
  expired: number
  opens: number | null
  opensAvailable: boolean
}

/**
 * Admin board counts. Opens stay null unless at least one send/invite
 * recorded an open (webhook present). We do not invent open events.
 */
export function computeThanksCounts(
  invites: ThanksCountInvite[],
  sends: ThanksCountSend[] = [],
): ThanksAdminCounts {
  const invited = invites.length
  const redeemed = invites.filter(i => i.status === 'redeemed').length
  const stopped = invites.filter(i => i.status === 'stopped').length
  const expired = invites.filter(i => i.status === 'expired').length
  const deliveredFromInvites = invites.filter(i => (i.delivered_count ?? 0) > 0 || i.status === 'sent' || i.status === 'redeemed').length
  const deliveredFromSends = sends.filter(s => s.status === 'sent').length
  const delivered = Math.max(deliveredFromInvites, deliveredFromSends ? new Set(sends.filter(s => s.status === 'sent')).size : 0)
  // Prefer invite-level delivered (one person, many steps) for the board.
  const deliveredPeople = invites.filter(i => (i.delivered_count ?? 0) > 0 || i.status === 'sent' || i.status === 'redeemed').length

  const openHits = [
    ...invites.filter(i => i.opened_at),
    ...sends.filter(s => s.opened_at),
  ].length
  const opensAvailable = openHits > 0

  return {
    invited,
    delivered: deliveredPeople || delivered,
    redeemed,
    stopped,
    expired,
    opens: opensAvailable ? openHits : null,
    opensAvailable,
  }
}
