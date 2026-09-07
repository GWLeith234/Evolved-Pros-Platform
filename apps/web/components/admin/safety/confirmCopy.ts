import type { ConfirmRequest } from './useConfirmDialog'

/** Shared M1 copy. Verb + object as a question. No em dashes. */

export const CONFIRM = {
  inviteMember: (): ConfirmRequest => ({
    title: 'Invite member?',
    consequence: 'This emails a sign-in link to the address you entered. This cannot be undone from admin.',
  }),
  sendBroadcast: (audienceLabel: string): ConfirmRequest => ({
    title: 'Send broadcast?',
    consequence: `This will deliver the message to ${audienceLabel} immediately. This cannot be undone from admin.`,
    emphasis: audienceLabel,
  }),
  sendThanksD0: (count: number | string): ConfirmRequest => ({
    title: 'Send thank-you D0 emails?',
    consequence: `YES sends the D0 Community thank-you to ${count} inviteable address(es) only. Already paid, already members, and Friends of George stays excluded. This cannot be undone from admin.`,
    emphasis: String(count),
    confirmLabel: 'YES send D0',
  }),
  queueThanksD0: (count: number | string): ConfirmRequest => ({
    title: 'Queue thank-you D0 without sending?',
    consequence: `YES creates ${count} Community invite(s) and parks D0 in the pending approval queue. No email goes out.`,
    emphasis: String(count),
    confirmLabel: 'YES queue D0',
  }),
  sendThanksNudge: (count: number): ConfirmRequest => ({
    title: 'Send queued Community thank-you?',
    consequence: `YES sends ${count} queued cadence email(s). Nothing else in the cadence fires. Copy link stays available if delivery fails.`,
    emphasis: String(count),
    confirmLabel: 'YES send',
  }),
  revokeFriend: (email: string, redeemed: boolean): ConfirmRequest => ({
    title: 'Revoke friend access?',
    consequence: redeemed
      ? `Revoke ${email}? This removes their Professional access immediately and reverts them to Community.`
      : `Revoke the invite for ${email}? They will not be able to redeem this link.`,
    emphasis: email,
  }),
  pauseFriends: (count: number): ConfirmRequest => ({
    title: 'Pause member access?',
    consequence: `Pause access for ${count} non-admin, non-comped member(s)? Admins and Friends of George keep access. Nothing is deleted.`,
  }),
  restoreFriends: (count: number): ConfirmRequest => ({
    title: 'Restore paused members?',
    consequence: `Restore access for ${count} suspended member(s)? They return to the member surfaces immediately.`,
  }),
  pauseFriendCode: (): ConfirmRequest => ({
    title: 'Pause friend code?',
    consequence: 'New redemptions stop immediately. Existing Friends of George keep their access.',
  }),
  syncStripe: (): ConfirmRequest => ({
    title: 'Sync catalogue to Stripe?',
    consequence: 'Mirrors current catalogue prices and active flags to Stripe. Existing subscribers are not auto-repriced.',
  }),
  saveCatalogue: (): ConfirmRequest => ({
    title: 'Save catalogue?',
    consequence: 'Writes price and active-flag changes to the catalogue. Stripe is not updated until you sync.',
  }),
  syncPodcast: (): ConfirmRequest => ({
    title: 'Sync podcast feed?',
    consequence: 'Pulls new episodes from the RSS feed as drafts for review. Existing published episodes are not overwritten.',
  }),
  publishEpisode: (): ConfirmRequest => ({
    title: 'Publish episode now?',
    consequence: 'This makes the episode visible to members immediately. This cannot be undone casually from admin.',
  }),
  deleteEpisode: (title: string): ConfirmRequest => ({
    title: 'Delete episode?',
    consequence: `Delete "${title}"? This permanently removes the episode. This cannot be undone from admin.`,
  }),
  publishLesson: (): ConfirmRequest => ({
    title: 'Publish lesson now?',
    consequence: 'This makes the lesson visible to members immediately. This cannot be undone casually from admin.',
  }),
  unpublishLesson: (): ConfirmRequest => ({
    title: 'Unpublish lesson?',
    consequence: 'Members lose access to this lesson until you publish it again.',
  }),
  deleteLesson: (): ConfirmRequest => ({
    title: 'Delete lesson?',
    consequence: 'This permanently removes the lesson. This cannot be undone from admin.',
  }),
  publishEvent: (): ConfirmRequest => ({
    title: 'Publish event now?',
    consequence: 'This makes the event visible to members immediately. This cannot be undone casually from admin.',
  }),
  unpublishEvent: (): ConfirmRequest => ({
    title: 'Unpublish event?',
    consequence: 'Members lose this event until you publish it again.',
  }),
  deleteEvent: (): ConfirmRequest => ({
    title: 'Delete event?',
    consequence: 'This permanently removes the event. This cannot be undone from admin.',
  }),
  publishStory: (): ConfirmRequest => ({
    title: 'Publish story now?',
    consequence: 'This makes the story live on Media immediately. This cannot be undone casually from admin.',
  }),
  deleteStory: (): ConfirmRequest => ({
    title: 'Delete story?',
    consequence: 'This permanently removes the story. This cannot be undone from admin.',
  }),
  createAd: (): ConfirmRequest => ({
    title: 'Create ad?',
    consequence: 'This adds the ad to the selected placement. Members may see it immediately if it is active.',
  }),
  deleteAd: (): ConfirmRequest => ({
    title: 'Delete ad?',
    consequence: 'This removes the ad from all placements. This cannot be undone from admin.',
  }),
  closePoll: (): ConfirmRequest => ({
    title: 'Close poll?',
    consequence: 'This stops new votes. Existing votes stay recorded.',
  }),
  deletePoll: (): ConfirmRequest => ({
    title: 'Delete poll?',
    consequence: 'This deletes the poll and all its votes. This cannot be undone from admin.',
  }),
  saveBranding: (): ConfirmRequest => ({
    title: 'Save branding changes?',
    consequence: 'This updates logos, colors, or appearance for all members.',
  }),
  cleanupQa: (count: number): ConfirmRequest => ({
    title: 'Cleanup QA records?',
    consequence: `Remove ${count} labelled QA test prospect(s) from the CRM? Live prospects are not touched.`,
  }),
  suspendMember: (name: string): ConfirmRequest => ({
    title: 'Suspend member?',
    consequence: `Suspend ${name}? This sets their membership to cancelled.`,
    emphasis: name,
  }),
} as const
