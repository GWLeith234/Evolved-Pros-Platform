export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// postgrest-js v2 requires `type` (not `interface`), `Relationships` per table,
// and top-level `CompositeTypes`.
export type Database = {
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
          tier: 'vip' | 'pro' | null
          tier_status: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at: string | null
          onboarded_at: string | null
          banner_url: string | null
          points: number
          company: string | null
          linkedin_url: string | null
          website_url: string | null
          twitter_handle: string | null
          phone: string | null
          phone_visible: boolean
          current_pillar: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          goal_90day: string | null
          goal_visible: boolean
          onboarding_completed: boolean
          onboarding_step: number
          keynote_access: boolean
          push_token: string | null
          notification_preferences: {
            community_reply: 'immediate' | 'digest' | 'off'
            community_mention: 'immediate' | 'digest' | 'off'
            event_reminder: 'immediate' | 'off'
            course_unlock: 'immediate' | 'off'
            system_billing: 'immediate'
            new_replies?: boolean
            new_likes?: boolean
            new_members?: boolean
            event_reminders?: boolean
            weekly_digest?: boolean
          }
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
          tier?: 'vip' | 'pro' | null
          tier_status?: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at?: string | null
          onboarded_at?: string | null
          banner_url?: string | null
          points?: number
          company?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          phone?: string | null
          phone_visible?: boolean
          current_pillar?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          goal_90day?: string | null
          goal_visible?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          keynote_access?: boolean
          push_token?: string | null
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
          tier?: 'vip' | 'pro' | null
          tier_status?: 'active' | 'trial' | 'cancelled' | 'expired' | null
          tier_expires_at?: string | null
          onboarded_at?: string | null
          banner_url?: string | null
          points?: number
          company?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          phone?: string | null
          phone_visible?: boolean
          current_pillar?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null
          goal_90day?: string | null
          goal_visible?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          keynote_access?: boolean
          push_token?: string | null
          notification_preferences?: {
            community_reply?: 'immediate' | 'digest' | 'off'
            community_mention?: 'immediate' | 'digest' | 'off'
            event_reminder?: 'immediate' | 'off'
            course_unlock?: 'immediate' | 'off'
            system_billing?: 'immediate'
            new_replies?: boolean
            new_likes?: boolean
            new_members?: boolean
            event_reminders?: boolean
            weekly_digest?: boolean
          }
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          pillar_number: number | null
          required_tier: 'vip' | 'pro' | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          pillar_number?: number | null
          required_tier?: 'vip' | 'pro' | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          pillar_number?: number | null
          required_tier?: 'vip' | 'pro' | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_channel_id_fkey'
            columns: ['channel_id']
            isOneToOne: false
            referencedRelation: 'channels'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'replies_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
          required_tier: 'vip' | 'pro' | null
          registration_count: number
          duration_minutes: number | null
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
          required_tier?: 'vip' | 'pro' | null
          registration_count?: number
          duration_minutes?: number | null
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
          required_tier?: 'vip' | 'pro' | null
          registration_count?: number
          duration_minutes?: number | null
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          pillar_number: number
          slug: string
          title: string
          description: string | null
          required_tier: 'vip' | 'pro'
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
          required_tier?: 'vip' | 'pro'
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
          required_tier?: 'vip' | 'pro'
          is_published?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
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
          content_blocks: Json | null
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
          content_blocks?: Json | null
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
          content_blocks?: Json | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: []
      }
      mux_webhooks: {
        Row: {
          id: string
          event_type: string
          asset_id: string | null
          playback_id: string | null
          payload: Json
          processed_at: string
        }
        Insert: {
          id?: string
          event_type: string
          asset_id?: string | null
          playback_id?: string | null
          payload: Json
          processed_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          asset_id?: string | null
          playback_id?: string | null
          payload?: Json
          processed_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      pipeline_stage_overrides: {
        Row: {
          user_id: string
          stage: 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'
          note: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          stage: 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'
          note?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          stage?: 'awareness' | 'engaged' | 'upgrade_ready' | 'closed'
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          id: string
          episode_number: number | null
          season: number
          title: string
          slug: string
          description: string | null
          guest_name: string | null
          guest_title: string | null
          guest_company: string | null
          mux_playback_id: string | null
          youtube_url: string | null
          thumbnail_url: string | null
          duration_seconds: number | null
          transcript: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          episode_number?: number | null
          season?: number
          title: string
          slug: string
          description?: string | null
          guest_name?: string | null
          guest_title?: string | null
          guest_company?: string | null
          mux_playback_id?: string | null
          youtube_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          transcript?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          episode_number?: number | null
          season?: number
          title?: string
          slug?: string
          description?: string | null
          guest_name?: string | null
          guest_title?: string | null
          guest_company?: string | null
          mux_playback_id?: string | null
          youtube_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          transcript?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: { key: string; value: string | null; updated_at: string }
        Insert: { key: string; value?: string | null; updated_at?: string }
        Update: { key?: string; value?: string | null; updated_at?: string }
        Relationships: []
      }
      platform_ads: {
        Row: {
          id: string
          placement: 'sidebar' | 'topnav'
          image_url: string | null
          headline: string | null
          cta_text: string | null
          link_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          placement: 'sidebar' | 'topnav'
          image_url?: string | null
          headline?: string | null
          cta_text?: string | null
          link_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          placement: 'sidebar' | 'topnav'
          image_url?: string | null
          headline?: string | null
          cta_text?: string | null
          link_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profile_banners: {
        Row: {
          id: string
          pillar: number | null
          title: string | null
          image_url: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pillar?: number | null
          title?: string | null
          image_url: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pillar?: number | null
          title?: string | null
          image_url?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      // ── Stub tables (pending supabase gen types typescript) ──────────
      conversations: {
        Row: { id: string; participant_one_id: string; participant_two_id: string; last_message_at: string | null; created_at: string; [k: string]: any }
        Insert: { id?: string; participant_one_id: string; participant_two_id: string; last_message_at?: string | null; created_at?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; body: string; read_at: string | null; created_at: string; [k: string]: any }
        Insert: { id?: string; conversation_id: string; sender_id: string; body: string; read_at?: string | null; created_at?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      accountability_pairs: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      strategic_plans: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      partner_checkins: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      member_badges: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      discussion_posts: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      weekly_commitments: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      ledger_entries: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      reflections: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      checkin_results: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      capstones: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      assessments: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      scoreboards: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      pillar_audits: {
        Row: { id: string; user_id: string; [k: string]: any }
        Insert: { id?: string; user_id: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
      greeting_quotes: {
        Row: { id: string; [k: string]: any }
        Insert: { id?: string; [k: string]: any }
        Update: { [k: string]: any }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_points: {
        Args: { user_id: string; amount: number }
        Returns: undefined
      }
      increment_discussion_like: {
        Args: { post_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ── Convenience row types ───────────────────────────────────────────────────

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

export type MuxWebhookRow          = Database['public']['Tables']['mux_webhooks']['Row']
export type MuxWebhookInsert       = Database['public']['Tables']['mux_webhooks']['Insert']

export type VendastaWebhookRow     = Database['public']['Tables']['vendasta_webhooks']['Row']
export type VendastaWebhookInsert  = Database['public']['Tables']['vendasta_webhooks']['Insert']
export type VendastaWebhookUpdate  = Database['public']['Tables']['vendasta_webhooks']['Update']

export type PipelineStageOverrideRow    = Database['public']['Tables']['pipeline_stage_overrides']['Row']
export type PipelineStageOverrideInsert = Database['public']['Tables']['pipeline_stage_overrides']['Insert']
export type PipelineStageOverrideUpdate = Database['public']['Tables']['pipeline_stage_overrides']['Update']
