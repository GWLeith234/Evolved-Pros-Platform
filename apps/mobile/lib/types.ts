export interface UserProfile {
  id: string
  full_name: string | null
  display_name: string | null
  tier: 'community' | 'pro'
  avatar_url: string | null
  push_token: string | null
}

export interface Post {
  id: string
  user_id: string
  channel_slug: string
  body: string
  pillar_number: number | null
  like_count: number
  reply_count: number
  created_at: string
  author?: Pick<UserProfile, 'id' | 'full_name' | 'display_name' | 'avatar_url' | 'tier'>
}

export interface Channel {
  slug: string
  label: string
  unreadCount?: number
}

export interface Event {
  id: string
  title: string
  type: 'Live' | 'Virtual' | 'In-Person'
  starts_at: string
  ends_at: string
  description: string | null
  registration_url: string | null
}

export interface Course {
  id: string
  slug: string
  pillar_number: number
  title: string
  description: string | null
  required_tier: 'community' | 'pro'
  is_published: boolean
  sort_order: number
}

export interface CourseWithProgress extends Course {
  totalLessons: number
  completedLessons: number
  progressPct: number
  hasAccess: boolean
}

export interface Lesson {
  id: string
  course_id: string
  slug: string
  title: string
  description: string | null
  mux_playback_id: string | null
  duration_seconds: number | null
  sort_order: number
  is_published: boolean
}

export interface LessonWithProgress extends Lesson {
  completedAt: string | null
  watchTimeSeconds: number
}

export interface ActivityItem {
  id: string
  type: 'lesson_complete' | 'post' | 'event_register'
  text: string
  created_at: string
}

export interface Stat {
  label: string
  value: string | number
  color?: string
}

export interface HomeData {
  userName: string
  week: number
  stats: Stat[]
  recentActivity: ActivityItem[]
  upcomingEvents: Event[]
}
