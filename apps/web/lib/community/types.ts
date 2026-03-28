export type PillarTag = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

export type Channel = {
  id: string
  slug: string
  name: string
  pillarNumber: number | null
  unreadCount: number
}

export type Reaction = {
  type: string
  count: number
}

export type PostAuthor = {
  id: string
  displayName: string
  avatarUrl: string | null
  tier?: string | null
}

export type Post = {
  id: string
  channelId: string
  body: string
  pillarTag: PillarTag | null
  isPinned: boolean
  likeCount: number
  replyCount: number
  createdAt: string
  author: PostAuthor
  isLiked: boolean
  myReaction: string | null
  reactions: Reaction[]
  isBookmarked: boolean
}

export type Reply = {
  id: string
  postId: string
  body: string
  createdAt: string
  author: PostAuthor
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  points: number
  isCurrentUser: boolean
}

export type MemberSummary = {
  id: string
  displayName: string
  avatarUrl: string | null
  roleTitle: string | null
  location: string | null
  tier: 'community' | 'pro' | null
  points: number
}

export const PILLAR_LABELS: Record<PillarTag, string> = {
  p1: 'Foundation',
  p2: 'Identity',
  p3: 'Mental Toughness',
  p4: 'Strategy',
  p5: 'Accountability',
  p6: 'Execution',
}

export const AVATAR_COLORS = [
  '#1b3c5a',
  '#2d6a8a',
  '#4a2d6a',
  '#6a3a1a',
  '#1a4a28',
  '#2d4fa3',
  '#6a1a2d',
  '#1a3a4a',
]

export function getAvatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
