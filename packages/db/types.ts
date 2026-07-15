export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accountability_pairs: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          paired_at: string
          partner_id: string
          status: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          paired_at?: string
          partner_id: string
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          paired_at?: string
          partner_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          answers: Json | null
          assessment_type: string | null
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          passed: boolean | null
          score: number | null
          scores_json: Json | null
          type_result: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assessment_type?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          passed?: boolean | null
          score?: number | null
          scores_json?: Json | null
          type_result?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assessment_type?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          passed?: boolean | null
          score?: number | null
          scores_json?: Json | null
          type_result?: string | null
          user_id?: string
        }
        Relationships: []
      }
      capstones: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          pillar_number: number | null
          required_tier: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pillar_number?: number | null
          required_tier?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pillar_number?: number | null
          required_tier?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      checkin_results: {
        Row: {
          checkin_type: string | null
          course_id: string | null
          created_at: string
          data: Json | null
          id: string
          lesson_id: string | null
          max_score: number | null
          module_number: number | null
          result_json: Json | null
          score: number | null
          user_id: string
        }
        Insert: {
          checkin_type?: string | null
          course_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          lesson_id?: string | null
          max_score?: number | null
          module_number?: number | null
          result_json?: Json | null
          score?: number | null
          user_id: string
        }
        Update: {
          checkin_type?: string | null
          course_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          lesson_id?: string | null
          max_score?: number | null
          module_number?: number | null
          result_json?: Json | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one_id: string
          participant_two_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id: string
          participant_two_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one_id?: string
          participant_two_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_one_id_fkey"
            columns: ["participant_one_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_id_fkey"
            columns: ["participant_two_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          id: string
          is_locked: boolean | null
          is_published: boolean
          pillar_number: number
          required_tier: string
          slug: string
          sort_order: number
          title: string
          unlock_after: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_published?: boolean
          pillar_number: number
          required_tier?: string
          slug: string
          sort_order?: number
          title: string
          unlock_after?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean | null
          is_published?: boolean
          pillar_number?: number
          required_tier?: string
          slug?: string
          sort_order?: number
          title?: string
          unlock_after?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_unlock_after_fkey"
            columns: ["unlock_after"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_prospects: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          last_contacted_at: string | null
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          source: string | null
          stage: string
          status: string
          updated_at: string
          user_id: string | null
          value_monthly: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          value_monthly?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          value_monthly?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_prospects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_prospects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_commitments: {
        Row: {
          commitment: string
          committed_on: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          user_id: string
        }
        Insert: {
          commitment: string
          committed_on: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          user_id: string
        }
        Update: {
          commitment?: string
          committed_on?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          habits_done: number
          habits_total: number
          id: string
          pillar_xp: Json
          score_date: string
          streak_day: number
          total_xp: number
          user_id: string
        }
        Insert: {
          habits_done?: number
          habits_total?: number
          id?: string
          pillar_xp?: Json
          score_date?: string
          streak_day?: number
          total_xp?: number
          user_id: string
        }
        Update: {
          habits_done?: number
          habits_total?: number
          id?: string
          pillar_xp?: Json
          score_date?: string
          streak_day?: number
          total_xp?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_posts: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          like_count: number
          module_number: number | null
          parent_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          like_count?: number
          module_number?: number | null
          parent_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          like_count?: number
          module_number?: number | null
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          guest_company: string | null
          guest_image_url: string | null
          guest_name: string | null
          guest_title: string | null
          id: string
          is_members_only: boolean | null
          is_published: boolean | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          pillar: string | null
          pillars: string[] | null
          pinned: boolean
          published_at: string | null
          season: number | null
          show_notes: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          transcript: string | null
          transistor_episode_id: string | null
          updated_at: string | null
          youtube_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          guest_company?: string | null
          guest_image_url?: string | null
          guest_name?: string | null
          guest_title?: string | null
          id?: string
          is_members_only?: boolean | null
          is_published?: boolean | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          pillar?: string | null
          pillars?: string[] | null
          pinned?: boolean
          published_at?: string | null
          season?: number | null
          show_notes?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          transistor_episode_id?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          guest_company?: string | null
          guest_image_url?: string | null
          guest_name?: string | null
          guest_title?: string | null
          id?: string
          is_members_only?: boolean | null
          is_published?: boolean | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          pillar?: string | null
          pillars?: string[] | null
          pinned?: boolean
          published_at?: string | null
          season?: number | null
          show_notes?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          transistor_episode_id?: string | null
          updated_at?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attending_count: number
          created_at: string
          cta_text: string | null
          description: string | null
          ends_at: string | null
          event_type: string
          event_type_keynote: boolean
          format: string
          hero_image_url: string | null
          host_avatar_url: string | null
          host_name: string | null
          host_role: string | null
          id: string
          image_url: string | null
          is_draft: boolean | null
          is_featured: boolean
          is_published: boolean
          pillar: number | null
          price_cents: number | null
          recording_url: string | null
          registration_count: number
          required_tier: string | null
          starts_at: string
          tagline: string | null
          tier_access: string | null
          title: string
          watermark: string | null
          zoom_url: string | null
        }
        Insert: {
          attending_count?: number
          created_at?: string
          cta_text?: string | null
          description?: string | null
          ends_at?: string | null
          event_type: string
          event_type_keynote?: boolean
          format?: string
          hero_image_url?: string | null
          host_avatar_url?: string | null
          host_name?: string | null
          host_role?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean | null
          is_featured?: boolean
          is_published?: boolean
          pillar?: number | null
          price_cents?: number | null
          recording_url?: string | null
          registration_count?: number
          required_tier?: string | null
          starts_at: string
          tagline?: string | null
          tier_access?: string | null
          title: string
          watermark?: string | null
          zoom_url?: string | null
        }
        Update: {
          attending_count?: number
          created_at?: string
          cta_text?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string
          event_type_keynote?: boolean
          format?: string
          hero_image_url?: string | null
          host_avatar_url?: string | null
          host_name?: string | null
          host_role?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean | null
          is_featured?: boolean
          is_published?: boolean
          pillar?: number | null
          price_cents?: number | null
          recording_url?: string | null
          registration_count?: number
          required_tier?: string | null
          starts_at?: string
          tagline?: string | null
          tier_access?: string | null
          title?: string
          watermark?: string | null
          zoom_url?: string | null
        }
        Relationships: []
      }
      goal_snapshots: {
        Row: {
          captured_at: string | null
          goal_id: string
          id: string
          progress_pct: number
          snapshot_date: string
        }
        Insert: {
          captured_at?: string | null
          goal_id: string
          id?: string
          progress_pct: number
          snapshot_date: string
        }
        Update: {
          captured_at?: string | null
          goal_id?: string
          id?: string
          progress_pct?: number
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_snapshots_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "quarterly_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      greeting_quotes: {
        Row: {
          created_at: string | null
          day_number: number | null
          id: string
          pillar: string | null
          quote_text: string
          source: string | null
          time_of_day: string
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          pillar?: string | null
          quote_text: string
          source?: string | null
          time_of_day?: string
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          pillar?: string | null
          quote_text?: string
          source?: string | null
          time_of_day?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          completed_on: string
          created_at: string
          habit_id: string | null
          habit_stack_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string
          completed_on: string
          created_at?: string
          habit_id?: string | null
          habit_stack_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string
          completed_on?: string
          created_at?: string
          habit_id?: string | null
          habit_stack_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_habit_stack_id_fkey"
            columns: ["habit_stack_id"]
            isOneToOne: false
            referencedRelation: "habit_stacks"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          bonus_xp: number
          completed_on: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          bonus_xp?: number
          completed_on?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          bonus_xp?: number
          completed_on?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_stacks: {
        Row: {
          course_id: string | null
          created_at: string
          habits: Json | null
          id: string
          name: string
          sort_order: number | null
          time_of_day: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          habits?: Json | null
          id?: string
          name: string
          sort_order?: number | null
          time_of_day?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          habits?: Json | null
          id?: string
          name?: string
          sort_order?: number | null
          time_of_day?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          leverage_score: number
          name: string
          pillar: string | null
          pillar_ids: string[]
          sort_order: number
          title: string
          user_id: string
          xp_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          leverage_score?: number
          name: string
          pillar?: string | null
          pillar_ids?: string[]
          sort_order?: number
          title: string
          user_id: string
          xp_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          leverage_score?: number
          name?: string
          pillar?: string | null
          pillar_ids?: string[]
          sort_order?: number
          title?: string
          user_id?: string
          xp_value?: number
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          apply_url: string | null
          category: string | null
          company: string
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          job_type: string | null
          location: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          apply_url?: string | null
          category?: string | null
          company: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          apply_url?: string | null
          category?: string | null
          company?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          job_type?: string | null
          location?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          column_type: string
          content: string
          course_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          column_type: string
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          column_type?: string
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          lesson_id: string
          notes: string | null
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        Insert: {
          completed_at?: string | null
          lesson_id: string
          notes?: string | null
          updated_at?: string
          user_id: string
          watch_time_seconds?: number
        }
        Update: {
          completed_at?: string | null
          lesson_id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          checkin_type: string | null
          content_blocks: Json | null
          course_id: string
          created_at: string
          description: string | null
          discussion_prompt: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          embed_url: string | null
          event_id: string | null
          id: string
          is_published: boolean
          key_takeaways: Json | null
          lesson_type: string | null
          module_number: number | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          slug: string
          sort_order: number
          thumbnail_fetched_at: string | null
          thumbnail_url: string | null
          title: string
          transcript: Json | null
        }
        Insert: {
          checkin_type?: string | null
          content_blocks?: Json | null
          course_id: string
          created_at?: string
          description?: string | null
          discussion_prompt?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          embed_url?: string | null
          event_id?: string | null
          id?: string
          is_published?: boolean
          key_takeaways?: Json | null
          lesson_type?: string | null
          module_number?: number | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          slug: string
          sort_order?: number
          thumbnail_fetched_at?: string | null
          thumbnail_url?: string | null
          title: string
          transcript?: Json | null
        }
        Update: {
          checkin_type?: string | null
          content_blocks?: Json | null
          course_id?: string
          created_at?: string
          description?: string | null
          discussion_prompt?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          embed_url?: string | null
          event_id?: string | null
          id?: string
          is_published?: boolean
          key_takeaways?: Json | null
          lesson_type?: string | null
          module_number?: number | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          slug?: string
          sort_order?: number
          thumbnail_fetched_at?: string | null
          thumbnail_url?: string | null
          title?: string
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      media_stories: {
        Row: {
          ai_draft: string | null
          ai_research_brief: string | null
          author: string | null
          body: string | null
          category_type: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          pillar: string | null
          published_at: string | null
          section: string | null
          seo_description: string | null
          seo_meta_description: string | null
          seo_title: string | null
          slug: string
          source_name: string | null
          source_url: string | null
          status: string | null
          story_type: string
          tags: string[] | null
          title: string
          unsplash_photo_id: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          ai_draft?: string | null
          ai_research_brief?: string | null
          author?: string | null
          body?: string | null
          category_type?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          pillar?: string | null
          published_at?: string | null
          section?: string | null
          seo_description?: string | null
          seo_meta_description?: string | null
          seo_title?: string | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          story_type?: string
          tags?: string[] | null
          title: string
          unsplash_photo_id?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          ai_draft?: string | null
          ai_research_brief?: string | null
          author?: string | null
          body?: string | null
          category_type?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          pillar?: string | null
          published_at?: string | null
          section?: string | null
          seo_description?: string | null
          seo_meta_description?: string | null
          seo_title?: string | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: string | null
          story_type?: string
          tags?: string[] | null
          title?: string
          unsplash_photo_id?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      member_badges: {
        Row: {
          awarded_at: string | null
          id: string
          pillar_name: string
          pillar_number: number
          score: number
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          id?: string
          pillar_name: string
          pillar_number: number
          score?: number
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          id?: string
          pillar_name?: string
          pillar_number?: number
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mux_webhooks: {
        Row: {
          asset_id: string | null
          event_type: string
          id: string
          payload: Json
          playback_id: string | null
          processed_at: string
        }
        Insert: {
          asset_id?: string | null
          event_type: string
          id?: string
          payload: Json
          playback_id?: string | null
          processed_at?: string
        }
        Update: {
          asset_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          playback_id?: string | null
          processed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_checkins: {
        Row: {
          commitment: string | null
          created_at: string
          id: string
          message: string | null
          mood_score: number | null
          note: string | null
          outcome: string | null
          pair_id: string
          user_id: string
          week_start: string | null
        }
        Insert: {
          commitment?: string | null
          created_at?: string
          id?: string
          message?: string | null
          mood_score?: number | null
          note?: string | null
          outcome?: string | null
          pair_id: string
          user_id: string
          week_start?: string | null
        }
        Update: {
          commitment?: string | null
          created_at?: string
          id?: string
          message?: string | null
          mood_score?: number | null
          note?: string | null
          outcome?: string | null
          pair_id?: string
          user_id?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_checkins_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "accountability_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      pillar_audits: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          notes: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stage_overrides: {
        Row: {
          created_at: string
          note: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          stage: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stage_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          ad_type: string | null
          body_copy: string | null
          click_url: string | null
          created_at: string | null
          cta_text: string | null
          end_date: string | null
          endorsement_quote: string | null
          headline: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          placement: string
          placements: string[] | null
          rotation_interval: number
          sort_order: number
          special_offer: string | null
          sponsor_name: string | null
          start_date: string | null
          title: string
          tool_name: string | null
          updated_at: string | null
          zone: string | null
        }
        Insert: {
          ad_type?: string | null
          body_copy?: string | null
          click_url?: string | null
          created_at?: string | null
          cta_text?: string | null
          end_date?: string | null
          endorsement_quote?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string
          placements?: string[] | null
          rotation_interval?: number
          sort_order?: number
          special_offer?: string | null
          sponsor_name?: string | null
          start_date?: string | null
          title: string
          tool_name?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Update: {
          ad_type?: string | null
          body_copy?: string | null
          click_url?: string | null
          created_at?: string | null
          cta_text?: string | null
          end_date?: string | null
          endorsement_quote?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string
          placements?: string[] | null
          rotation_interval?: number
          sort_order?: number
          special_offer?: string | null
          sponsor_name?: string | null
          start_date?: string | null
          title?: string
          tool_name?: string | null
          updated_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          display_order: number | null
          id: string
          option_text: string
          poll_id: string | null
        }
        Insert: {
          display_order?: number | null
          id?: string
          option_text: string
          poll_id?: string | null
        }
        Update: {
          display_order?: number | null
          id?: string
          option_text?: string
          poll_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          fingerprint: string | null
          id: string
          option_id: string | null
          poll_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          closes_at: string | null
          context: string | null
          created_at: string | null
          created_by: string | null
          id: string
          question: string
          show_results_before_vote: boolean | null
          status: string | null
        }
        Insert: {
          closes_at?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          question: string
          show_results_before_vote?: boolean | null
          status?: string | null
        }
        Update: {
          closes_at?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          question?: string
          show_results_before_vote?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_generated: boolean | null
          author_id: string
          body: string
          channel_id: string
          created_at: string
          id: string
          is_pinned: boolean
          kind: string
          like_count: number
          pillar: number | null
          pillar_tag: string | null
          poll_id: string | null
          post_type: string | null
          reaction_count: number
          reply_count: number
          scheduled_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          author_id: string
          body: string
          channel_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          kind?: string
          like_count?: number
          pillar?: number | null
          pillar_tag?: string | null
          poll_id?: string | null
          post_type?: string | null
          reaction_count?: number
          reply_count?: number
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string
          body?: string
          channel_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          kind?: string
          like_count?: number
          pillar?: number | null
          pillar_tag?: string | null
          poll_id?: string | null
          post_type?: string | null
          reaction_count?: number
          reply_count?: number
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean
          label: string
          pillar: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          label: string
          pillar?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          label?: string
          pillar?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      quarterly_goals: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          period: string
          pillar: string | null
          progress_pct: number | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
          weekly_delta: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          period: string
          pillar?: string | null
          progress_pct?: number | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          weekly_delta?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          period?: string
          pillar?: string | null
          progress_pct?: number | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          weekly_delta?: number | null
        }
        Relationships: []
      }
      reflections: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cadences: {
        Row: {
          cadence_type: string
          course_id: string | null
          created_at: string
          focus_area: string | null
          id: string
          last_review_at: string | null
          next_review_at: string | null
          notes: string | null
          schedule_json: Json
          user_id: string
        }
        Insert: {
          cadence_type: string
          course_id?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          last_review_at?: string | null
          next_review_at?: string | null
          notes?: string | null
          schedule_json?: Json
          user_id: string
        }
        Update: {
          cadence_type?: string
          course_id?: string | null
          created_at?: string
          focus_area?: string | null
          id?: string
          last_review_at?: string | null
          next_review_at?: string | null
          notes?: string | null
          schedule_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      scoreboard_updates: {
        Row: {
          created_at: string
          id: string
          lag_value: number | null
          note: string | null
          recorded_at: string
          scoreboard_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          lag_value?: number | null
          note?: string | null
          recorded_at?: string
          scoreboard_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          lag_value?: number | null
          note?: string | null
          recorded_at?: string
          scoreboard_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoreboard_updates_scoreboard_id_fkey"
            columns: ["scoreboard_id"]
            isOneToOne: false
            referencedRelation: "scoreboards"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboards: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          lag_current: number | null
          lag_label: string | null
          lag_target: number | null
          lag_unit: string | null
          lead_1_label: string | null
          lead_1_weekly_target: number | null
          lead_2_label: string | null
          lead_2_weekly_target: number | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
          wig_statement: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lag_current?: number | null
          lag_label?: string | null
          lag_target?: number | null
          lag_unit?: string | null
          lead_1_label?: string | null
          lead_1_weekly_target?: number | null
          lead_2_label?: string | null
          lead_2_weekly_target?: number | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
          wig_statement?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lag_current?: number | null
          lag_label?: string | null
          lag_target?: number | null
          lag_unit?: string | null
          lead_1_label?: string | null
          lead_1_weekly_target?: number | null
          lead_2_label?: string | null
          lead_2_weekly_target?: number | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          wig_statement?: string | null
        }
        Relationships: []
      }
      sponsor_clicks: {
        Row: {
          clicked_at: string
          commission_amount: number | null
          conversion_at: string | null
          converted: boolean
          id: string
          placement_id: string
          surface: string
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amount?: number | null
          conversion_at?: string | null
          converted?: boolean
          id?: string
          placement_id: string
          surface: string
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amount?: number | null
          conversion_at?: string | null
          converted?: boolean
          id?: string
          placement_id?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_clicks_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "sponsor_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_impressions: {
        Row: {
          id: string
          placement_id: string
          rendered_at: string
          surface: string
          user_id: string | null
        }
        Insert: {
          id?: string
          placement_id: string
          rendered_at?: string
          surface: string
          user_id?: string | null
        }
        Update: {
          id?: string
          placement_id?: string
          rendered_at?: string
          surface?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_impressions_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "sponsor_placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_placements: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          sponsor_id: string
          surface: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          sponsor_id: string
          surface: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          sponsor_id?: string
          surface?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          body_copy: string | null
          brand_color: string | null
          commission_pct: number | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          id: string
          impression_cap: number | null
          logo_url: string | null
          name: string
          status: string
          tagline: string | null
          tracking_id: string | null
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          body_copy?: string | null
          brand_color?: string | null
          commission_pct?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          impression_cap?: number | null
          logo_url?: string | null
          name: string
          status?: string
          tagline?: string | null
          tracking_id?: string | null
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          body_copy?: string | null
          brand_color?: string | null
          commission_pct?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          id?: string
          impression_cap?: number | null
          logo_url?: string | null
          name?: string
          status?: string
          tagline?: string | null
          tracking_id?: string | null
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          body: string
          created_at: string | null
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "media_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_plans: {
        Row: {
          content: Json | null
          course_id: string | null
          created_at: string
          domain: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          course_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          course_id?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      streak_records: {
        Row: {
          id: string
          is_active: boolean
          is_personal_best: boolean
          streak_end: string | null
          streak_length: number
          streak_start: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          is_personal_best?: boolean
          streak_end?: string | null
          streak_length?: number
          streak_start: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          is_personal_best?: boolean
          streak_end?: string | null
          streak_length?: number
          streak_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_episode_progress: {
        Row: {
          episode_id: string
          progress: number
          user_id: string
          watched_at: string
        }
        Insert: {
          episode_id: string
          progress?: number
          user_id: string
          watched_at?: string
        }
        Update: {
          episode_id?: string
          progress?: number
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_episode_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          academy_completed_at: string | null
          academy_started_at: string | null
          access_status: string
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          company: string | null
          comp_promo_code_id: string | null
          courses_completed: number | null
          created_at: string
          current_pillar: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          focus_pillar: number | null
          full_name: string | null
          goal_90day: string | null
          goal_visible: boolean
          id: string
          is_alumni: boolean | null
          keynote_access: boolean
          last_name: string | null
          last_summary_sent_at: string | null
          linkedin_url: string | null
          location: string | null
          notification_preferences: Json
          onboarded_at: string | null
          onboarding_completed: boolean
          onboarding_step: number
          phone: string | null
          phone_visible: boolean
          pioneer_driver_type: string | null
          points: number
          program_completed_at: string | null
          role: string
          role_title: string | null
          theme: string
          tier: string | null
          tier_expires_at: string | null
          tier_status: string | null
          twitter_handle: string | null
          updated_at: string
          vendasta_account_group_id: string | null
          vendasta_account_id: string | null
          vendasta_contact_id: string | null
          vendasta_last_event_at: string | null
          vendasta_sku: string | null
          vendasta_subscription_started_at: string | null
          website_url: string | null
        }
        Insert: {
          academy_completed_at?: string | null
          academy_started_at?: string | null
          access_status?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          company?: string | null
          comp_promo_code_id?: string | null
          courses_completed?: number | null
          created_at?: string
          current_pillar?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          focus_pillar?: number | null
          full_name?: string | null
          goal_90day?: string | null
          goal_visible?: boolean
          id?: string
          is_alumni?: boolean | null
          keynote_access?: boolean
          last_name?: string | null
          last_summary_sent_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          notification_preferences?: Json
          onboarded_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          phone?: string | null
          phone_visible?: boolean
          pioneer_driver_type?: string | null
          points?: number
          program_completed_at?: string | null
          role?: string
          role_title?: string | null
          theme?: string
          tier?: string | null
          tier_expires_at?: string | null
          tier_status?: string | null
          twitter_handle?: string | null
          updated_at?: string
          vendasta_account_group_id?: string | null
          vendasta_account_id?: string | null
          vendasta_contact_id?: string | null
          vendasta_last_event_at?: string | null
          vendasta_sku?: string | null
          vendasta_subscription_started_at?: string | null
          website_url?: string | null
        }
        Update: {
          academy_completed_at?: string | null
          academy_started_at?: string | null
          access_status?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          company?: string | null
          comp_promo_code_id?: string | null
          courses_completed?: number | null
          created_at?: string
          current_pillar?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          focus_pillar?: number | null
          full_name?: string | null
          goal_90day?: string | null
          goal_visible?: boolean
          id?: string
          is_alumni?: boolean | null
          keynote_access?: boolean
          last_name?: string | null
          last_summary_sent_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          notification_preferences?: Json
          onboarded_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          phone?: string | null
          phone_visible?: boolean
          pioneer_driver_type?: string | null
          points?: number
          program_completed_at?: string | null
          role?: string
          role_title?: string | null
          theme?: string
          tier?: string | null
          tier_expires_at?: string | null
          tier_status?: string | null
          twitter_handle?: string | null
          updated_at?: string
          vendasta_account_group_id?: string | null
          vendasta_account_id?: string | null
          vendasta_contact_id?: string | null
          vendasta_last_event_at?: string | null
          vendasta_sku?: string | null
          vendasta_subscription_started_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      vendasta_account_mapping: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          updated_at: string
          user_id: string
          vendasta_account_id: string
          vendasta_contact_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id?: string
          updated_at?: string
          user_id: string
          vendasta_account_id: string
          vendasta_contact_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          updated_at?: string
          user_id?: string
          vendasta_account_id?: string
          vendasta_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendasta_account_mapping_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vendasta_webhooks: {
        Row: {
          error_message: string | null
          event_id: string | null
          event_type: string | null
          id: string
          payload: Json
          processed_at: string
          product_sku: string | null
          received_at: string | null
          status: string | null
          vendasta_contact_id: string | null
          vendasta_order_id: string | null
        }
        Insert: {
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed_at?: string
          product_sku?: string | null
          received_at?: string | null
          status?: string | null
          vendasta_contact_id?: string | null
          vendasta_order_id?: string | null
        }
        Update: {
          error_message?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed_at?: string
          product_sku?: string | null
          received_at?: string | null
          status?: string | null
          vendasta_contact_id?: string | null
          vendasta_order_id?: string | null
        }
        Relationships: []
      }
      weekly_commitments: {
        Row: {
          commitment: string
          completed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          is_completed: boolean
          user_id: string
          week_start: string
        }
        Insert: {
          commitment: string
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          user_id: string
          week_start: string
        }
        Update: {
          commitment?: string
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_discussion_like: {
        Args: { post_id: string }
        Returns: {
          body: string
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          like_count: number
          module_number: number | null
          parent_id: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "discussion_posts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      increment_points: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      increment_poll_vote: { Args: { p_option_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
