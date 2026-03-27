import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import type { Database } from '@evolved-pros/db'

type NotificationType = Database['public']['Tables']['notifications']['Row']['type']

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await adminClient
    .from('notifications')
    .insert({
      user_id:    params.userId,
      type:       params.type,
      title:      params.title,
      body:       params.body,
      action_url: params.actionUrl ?? null,
      is_read:    false,
    })

  if (error) console.error('[createNotification]', error)
}

// ── Convenience functions ──────────────────────────────────────────────

export async function notifyReply(params: {
  postAuthorId: string
  replyAuthorId: string
  replyAuthorName: string
  channelSlug: string
  postId: string
  replySnippet: string
}) {
  // Never notify on self-reply
  if (params.postAuthorId === params.replyAuthorId) return

  await createNotification({
    userId:    params.postAuthorId,
    type:      'community_reply',
    title:     'New reply on your post',
    body:      `**${params.replyAuthorName}** replied to your post in **#${params.channelSlug}** — "${params.replySnippet.slice(0, 80)}"`,
    actionUrl: `/community/${params.channelSlug}?post=${params.postId}`,
  })
}

export async function notifyMention(params: {
  mentionedUserId: string
  mentionerName: string
  channelSlug: string
  postId: string
}) {
  await createNotification({
    userId:    params.mentionedUserId,
    type:      'community_mention',
    title:     'You were mentioned',
    body:      `**${params.mentionerName}** mentioned you in **#${params.channelSlug}**`,
    actionUrl: `/community/${params.channelSlug}?post=${params.postId}`,
  })
}

export async function notifyEventReminder(params: {
  userId: string
  eventTitle: string
  eventId: string
  startsAt: Date
  registrationCount: number
}) {
  const hoursUntil = Math.round((params.startsAt.getTime() - Date.now()) / 3_600_000)
  await createNotification({
    userId:    params.userId,
    type:      'event_reminder',
    title:     'Event starting soon',
    body:      `**${params.eventTitle}** starts in ${hoursUntil} hours. ${params.registrationCount} members signed up.`,
    actionUrl: `/events/${params.eventId}`,
  })
}

export async function notifyCourseUnlock(params: {
  userId: string
  lessonTitle: string
  courseSlug: string
  pillarNumber: number
}) {
  await createNotification({
    userId:    params.userId,
    type:      'course_unlock',
    title:     'New lesson unlocked',
    body:      `New lesson unlocked: **${params.lessonTitle}**. Your P${params.pillarNumber} progress unlocked the next track.`,
    actionUrl: `/academy/${params.courseSlug}`,
  })
}

export async function notifyBilling(params: {
  userId: string
  renewalDate: Date
}) {
  const dateStr = params.renewalDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  await createNotification({
    userId:    params.userId,
    type:      'system_billing',
    title:     'Membership renewal',
    body:      `Your membership renews **${dateStr}**. Billing managed through Vendasta.`,
    actionUrl: undefined,
  })
}

export async function notifyLike(params: {
  postAuthorId: string
  likerUserId: string
  likerName: string
  channelSlug: string
  postId: string
}) {
  // Never notify on self-like
  if (params.postAuthorId === params.likerUserId) return

  await createNotification({
    userId:    params.postAuthorId,
    type:      'community_reply',
    title:     'Someone liked your post',
    body:      `**${params.likerName}** liked your post in **#${params.channelSlug}**`,
    actionUrl: `/community/${params.channelSlug}?post=${params.postId}`,
  })
}

export async function notifyNewDm(params: {
  recipientId: string
  senderName: string
  conversationId: string
}) {
  await createNotification({
    userId:    params.recipientId,
    type:      'system_general',
    title:     'New direct message',
    body:      `**${params.senderName}** sent you a direct message`,
    actionUrl: `/messages?c=${params.conversationId}`,
  })
}

export async function notifyNewMember(params: {
  adminUserIds: string[]
  newMemberName: string
  newMemberTier: string
}) {
  await Promise.all(
    params.adminUserIds.map(adminId =>
      createNotification({
        userId:    adminId,
        type:      'system_general',
        title:     'New member joined',
        body:      `**${params.newMemberName}** joined as a **${params.newMemberTier}** member.`,
        actionUrl: `/admin/members`,
      })
    )
  )
}
