export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          vendasta_contact_id: string | null
          email: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role_title: string | null
          location: string | null
          role: 'member' | 'admin'
          tier: 'community' | 'pro' | null
          tier_status: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at: string | null
          onboarded_at: string | null
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendasta_contact_id?: string | null
          email: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role_title?: string | null
          location?: string | null
          role?: 'member' | 'admin'
          tier?: 'community' | 'pro' | null
          tier_status?: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at?: string | null
          onboarded_at?: string | null
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendasta_contact_id?: string | null
          email?: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role_title?: string | null
          location?: string | null
          role?: 'member' | 'admin'
          tier?: 'community' | 'pro' | null
          tier_status?: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at?: string | null
          onboarded_at?: string | null
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          pillar_number: number | null
          required_tier: 'community' | 'pro' | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          pillar_number?: number | null
          required_tier?: 'community' | 'pro' | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          pillar_number?: number | null
          required_tier?: 'community' | 'pro' | null
          sort_order?: number
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          channel_id: string
          body: string
          pillar_tag: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          is_pinned: boolean
          like_count: number
          reply_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          channel_id: string
          body: string
          pillar_tag?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          is_pinned?: boolean
          like_count?: number
          reply_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          channel_id?: string
          body?: string
          pillar_tag?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          is_pinned?: boolean
          like_count?: number
          reply_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      replies: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: 'live' | 'virtual' | 'inperson'
          starts_at: string
          ends_at: string | null
          zoom_url: string | null
          recording_url: string | null
          required_tier: 'community' | 'pro' | null
          registration_count: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: 'live' | 'virtual' | 'inperson'
          starts_at: string
          ends_at?: string | null
          zoom_url?: string | null
          recording_url?: string | null
          required_tier?: 'community' | 'pro' | null
          registration_count?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: 'live' | 'virtual' | 'inperson'
          starts_at?: string
          ends_at?: string | null
          zoom_url?: string | null
          recording_url?: string | null
          required_tier?: 'community' | 'pro' | null
          registration_count?: number
          is_published?: boolean
          created_at?: string
        }
      }
      event_registrations: {
        Row: {
          event_id: string
          user_id: string
          registered_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          registered_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          registered_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          pillar_number: number
          slug: string
          title: string
          description: string | null
          required_tier: 'community' | 'pro'
          is_published: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          pillar_number: number
          slug: string
          title: string
          description?: string | null
          required_tier?: 'community' | 'pro'
          is_published?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          pillar_number?: number
          slug?: string
          title?: string
          description?: string | null
          required_tier?: 'community' | 'pro'
          is_published?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          slug: string
          title: string
          description: string | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          duration_seconds: number | null
          sort_order: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          slug: string
          title: string
          description?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          duration_seconds?: number | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          slug?: string
          title?: string
          description?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          duration_seconds?: number | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
        }
      }
      lesson_progress: {
        Row: {
          user_id: string
          lesson_id: string
          completed_at: string | null
          watch_time_seconds: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          lesson_id: string
          completed_at?: string | null
          watch_time_seconds?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          lesson_id?: string
          completed_at?: string | null
          watch_time_seconds?: number
          notes?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type:
            | 'community_reply'
            | 'community_mention'
            | 'event_reminder'
            | 'course_unlock'
            | 'system_billing'
            | 'system_general'
          title: string
          body: string
          action_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type:
            | 'community_reply'
            | 'community_mention'
            | 'event_reminder'
            | 'course_unlock'
            | 'system_billing'
            | 'system_general'
          title: string
          body: string
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?:
            | 'community_reply'
            | 'community_mention'
            | 'event_reminder'
            | 'course_unlock'
            | 'system_billing'
            | 'system_general'
          title?: string
          body?: string
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      post_bookmarks: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      vendasta_webhooks: {
        Row: {
          id: string
          event_type: string
          vendasta_order_id: string | null
          vendasta_contact_id: string | null
          product_sku: string | null
          payload: Json
          processed_at: string
          status: 'success' | 'error'
          error_message: string | null
        }
        Insert: {
          id?: string
          event_type: string
          vendasta_order_id?: string | null
          vendasta_contact_id?: string | null
          product_sku?: string | null
          payload: Json
          processed_at?: string
          status: 'success' | 'error'
          error_message?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          vendasta_order_id?: string | null
          vendasta_contact_id?: string | null
          product_sku?: string | null
          payload?: Json
          processed_at?: string
          status?: 'success' | 'error'
          error_message?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type UserRow                = Database['public']['Tables']['users']['Row']
export type UserInsert             = Database['public']['Tables']['users']['Insert']
export type UserUpdate             = Database['public']['Tables']['users']['Update']

export type ChannelRow             = Database['public']['Tables']['channels']['Row']
export type ChannelInsert          = Database['public']['Tables']['channels']['Insert']
export type ChannelUpdate          = Database['public']['Tables']['channels']['Update']

export type PostRow                = Database['public']['Tables']['posts']['Row']
export type PostInsert             = Database['public']['Tables']['posts']['Insert']
export type PostUpdate             = Database['public']['Tables']['posts']['Update']

export type ReplyRow               = Database['public']['Tables']['replies']['Row']
export type ReplyInsert            = Database['public']['Tables']['replies']['Insert']
export type ReplyUpdate            = Database['public']['Tables']['replies']['Update']

export type PostLikeRow            = Database['public']['Tables']['post_likes']['Row']
export type PostLikeInsert         = Database['public']['Tables']['post_likes']['Insert']

export type EventRow               = Database['public']['Tables']['events']['Row']
export type EventInsert            = Database['public']['Tables']['events']['Insert']
export type EventUpdate            = Database['public']['Tables']['events']['Update']

export type EventRegistrationRow   = Database['public']['Tables']['event_registrations']['Row']
export type EventRegistrationInsert= Database['public']['Tables']['event_registrations']['Insert']

export type CourseRow              = Database['public']['Tables']['courses']['Row']
export type CourseInsert           = Database['public']['Tables']['courses']['Insert']
export type CourseUpdate           = Database['public']['Tables']['courses']['Update']

export type LessonRow              = Database['public']['Tables']['lessons']['Row']
export type LessonInsert           = Database['public']['Tables']['lessons']['Insert']
export type LessonUpdate           = Database['public']['Tables']['lessons']['Update']

export type LessonProgressRow      = Database['public']['Tables']['lesson_progress']['Row']
export type LessonProgressInsert   = Database['public']['Tables']['lesson_progress']['Insert']
export type LessonProgressUpdate   = Database['public']['Tables']['lesson_progress']['Update']

export type NotificationRow        = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert     = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate     = Database['public']['Tables']['notifications']['Update']

export type PostBookmarkRow        = Database['public']['Tables']['post_bookmarks']['Row']
export type PostBookmarkInsert     = Database['public']['Tables']['post_bookmarks']['Insert']

export type VendastaWebhookRow     = Database['public']['Tables']['vendasta_webhooks']['Row']
export type VendastaWebhookInsert  = Database['public']['Tables']['vendasta_webhooks']['Insert']
export type VendastaWebhookUpdate  = Database['public']['Tables']['vendasta_webhooks']['Update']
