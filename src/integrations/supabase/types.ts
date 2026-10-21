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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aggregate_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      aggregate_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          tier?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      api_usage_log: {
        Row: {
          api_key_hash: string
          created_at: string | null
          endpoint: string
          id: number
          method: string
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_key_hash: string
          created_at?: string | null
          endpoint: string
          id?: number
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_key_hash?: string
          created_at?: string | null
          endpoint?: string
          id?: number
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_log_api_key_hash_fkey"
            columns: ["api_key_hash"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["key_hash"]
          },
        ]
      }
      apod_cache: {
        Row: {
          date: string
          explanation: string | null
          id: number
          media_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          date: string
          explanation?: string | null
          id?: number
          media_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          date?: string
          explanation?: string | null
          id?: number
          media_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_source: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_source?: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_source?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          description: string | null
          hashtag_matches: string[]
          icon: string | null
          id: string
          name: string
          slug: string
          startup_category_matches: string[]
          themed_categories: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hashtag_matches?: string[]
          icon?: string | null
          id?: string
          name: string
          slug: string
          startup_category_matches?: string[]
          themed_categories?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hashtag_matches?: string[]
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          startup_category_matches?: string[]
          themed_categories?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      community_memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          context_message: string
          created_at: string | null
          id: string
          intent_category: string
          recipient_id: string
          requester_id: string
          responded_at: string | null
          status: string
          thread_id: string | null
        }
        Insert: {
          context_message: string
          created_at?: string | null
          id?: string
          intent_category: string
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Update: {
          context_message?: string
          created_at?: string | null
          id?: string
          intent_category?: string
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "connection_requests_sender_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "connection_requests_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          course_id: string
          created_at: string
          id: string
          module_id: string | null
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          module_id?: string | null
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          module_id?: string | null
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          duration_label: string | null
          id: string
          is_free: boolean
          is_premium_ready: boolean
          learner_count_label: string | null
          level: string | null
          rating: number | null
          slug: string
          sort_order: number | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          duration_label?: string | null
          id?: string
          is_free?: boolean
          is_premium_ready?: boolean
          learner_count_label?: string | null
          level?: string | null
          rating?: number | null
          slug: string
          sort_order?: number | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          duration_label?: string | null
          id?: string
          is_free?: boolean
          is_premium_ready?: boolean
          learner_count_label?: string | null
          level?: string | null
          rating?: number | null
          slug?: string
          sort_order?: number | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          category: string
          content_ref_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          headline: string
          id: string
          is_active: boolean | null
          link_label: string | null
          link_url: string | null
          sort_order: number | null
          summary: string | null
          thumbnail_url: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category: string
          content_ref_id?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          headline: string
          id?: string
          is_active?: boolean | null
          link_label?: string | null
          link_url?: string | null
          sort_order?: number | null
          summary?: string | null
          thumbnail_url?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string
          content_ref_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          headline?: string
          id?: string
          is_active?: boolean | null
          link_label?: string | null
          link_url?: string | null
          sort_order?: number | null
          summary?: string | null
          thumbnail_url?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_startup_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_startup_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_startup_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_following_startup_id_fkey"
            columns: ["following_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id?: string | null
          id?: string
          target_id: string
          target_type?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      launch_sources: {
        Row: {
          created_at: string
          id: string
          launch_id: string
          source_name: string
          source_type: string
          trust_level: number
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          launch_id: string
          source_name: string
          source_type?: string
          trust_level?: number
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          launch_id?: string
          source_name?: string
          source_type?: string
          trust_level?: number
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_sources_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_status_log: {
        Row: {
          changed_at: string | null
          id: string
          launch_id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          launch_id: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          launch_id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_status_log_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_updates: {
        Row: {
          created_at: string
          id: string
          launch_id: string
          published_at: string
          source_url: string | null
          summary: string | null
          title: string
          update_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          launch_id: string
          published_at?: string
          source_url?: string | null
          summary?: string | null
          title: string
          update_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          launch_id?: string
          published_at?: string
          source_url?: string | null
          summary?: string | null
          title?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_updates_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
        ]
      }
      launches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          launch_date: string
          launch_window_end: string | null
          launch_window_start: string | null
          livestream_url: string | null
          location: string | null
          mission_type: string | null
          name: string
          payload: string | null
          provider: string
          slug: string
          status: string
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          launch_date: string
          launch_window_end?: string | null
          launch_window_start?: string | null
          livestream_url?: string | null
          location?: string | null
          mission_type?: string | null
          name: string
          payload?: string | null
          provider: string
          slug: string
          status?: string
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          launch_date?: string
          launch_window_end?: string | null
          launch_window_start?: string | null
          livestream_url?: string | null
          location?: string | null
          mission_type?: string | null
          name?: string
          payload?: string | null
          provider?: string
          slug?: string
          status?: string
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_event_reminders: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          reminder_offset_minutes: number
          sent: boolean | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          reminder_offset_minutes: number
          sent?: boolean | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          reminder_offset_minutes?: number
          sent?: boolean | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      live_events: {
        Row: {
          archive_summary: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          embed_url: string | null
          end_time: string | null
          event_type: string
          external_url: string | null
          hashtags: string[] | null
          id: string
          is_complete: boolean | null
          related_launch_id: string | null
          related_startup_id: string | null
          related_topic_slug: string | null
          start_time: string
          thumbnail_url: string | null
          title: string
          vod_url: string | null
        }
        Insert: {
          archive_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          embed_url?: string | null
          end_time?: string | null
          event_type: string
          external_url?: string | null
          hashtags?: string[] | null
          id?: string
          is_complete?: boolean | null
          related_launch_id?: string | null
          related_startup_id?: string | null
          related_topic_slug?: string | null
          start_time: string
          thumbnail_url?: string | null
          title: string
          vod_url?: string | null
        }
        Update: {
          archive_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          embed_url?: string | null
          end_time?: string | null
          event_type?: string
          external_url?: string | null
          hashtags?: string[] | null
          id?: string
          is_complete?: boolean | null
          related_launch_id?: string | null
          related_startup_id?: string | null
          related_topic_slug?: string | null
          start_time?: string
          thumbnail_url?: string | null
          title?: string
          vod_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "live_events_related_startup_id_fkey"
            columns: ["related_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_a: string
          participant_a_unread: number | null
          participant_b: string
          participant_b_unread: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_a: string
          participant_a_unread?: number | null
          participant_b: string
          participant_b_unread?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_a?: string
          participant_a_unread?: number | null
          participant_b?: string
          participant_b_unread?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_threads_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          account_handle: string | null
          account_id: string
          account_name: string | null
          account_type: string
          created_at: string
          id: string
          image_url: string | null
          kind: string
          link: string | null
          post_id: string | null
          post_type: string | null
          preview: string | null
          read: boolean
          title: string | null
          user_id: string
        }
        Insert: {
          account_handle?: string | null
          account_id: string
          account_name?: string | null
          account_type: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string | null
          post_id?: string | null
          post_type?: string | null
          preview?: string | null
          read?: boolean
          title?: string | null
          user_id: string
        }
        Update: {
          account_handle?: string | null
          account_id?: string
          account_name?: string | null
          account_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string | null
          post_id?: string | null
          post_type?: string | null
          preview?: string | null
          read?: boolean
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          community: string | null
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          launch_id: string | null
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community?: string | null
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          launch_id?: string | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community?: string | null
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          launch_id?: string | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_badge_awards: {
        Row: {
          award_reason: string | null
          awarded_at: string | null
          awarded_by: string
          badge_id: string | null
          badge_type: string
          id: string
          user_id: string
        }
        Insert: {
          award_reason?: string | null
          awarded_at?: string | null
          awarded_by: string
          badge_id?: string | null
          badge_type: string
          id?: string
          user_id: string
        }
        Update: {
          award_reason?: string | null
          awarded_at?: string | null
          awarded_by?: string
          badge_id?: string | null
          badge_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_badge_awards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[] | null
          last_seen_at: string | null
          location: string | null
          messaging_allowed_categories: string[] | null
          messaging_open_to: string | null
          require_complete_profile_to_message: boolean | null
          show_online_status: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
          weekly_digest_opt_in: boolean
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          last_seen_at?: string | null
          location?: string | null
          messaging_allowed_categories?: string[] | null
          messaging_open_to?: string | null
          require_complete_profile_to_message?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
          weekly_digest_opt_in?: boolean
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          last_seen_at?: string | null
          location?: string | null
          messaging_allowed_categories?: string[] | null
          messaging_open_to?: string | null
          require_complete_profile_to_message?: boolean | null
          show_online_status?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
          weekly_digest_opt_in?: boolean
        }
        Relationships: []
      }
      role_views: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          session_id: string | null
          user_id: string | null
          viewer_badges: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          session_id?: string | null
          user_id?: string | null
          viewer_badges?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          session_id?: string | null
          user_id?: string | null
          viewer_badges?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "role_views_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "startup_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      startup_posts: {
        Row: {
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          likes_count: number
          published_at: string
          source_type: string
          source_url: string
          startup_id: string
          summary: string | null
          title: string | null
          views_count: number
        }
        Insert: {
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number
          published_at?: string
          source_type?: string
          source_url: string
          startup_id: string
          summary?: string | null
          title?: string | null
          views_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number
          published_at?: string
          source_type?: string
          source_url?: string
          startup_id?: string
          summary?: string | null
          title?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "startup_posts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_roles: {
        Row: {
          apply_url: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          posted_at: string | null
          role_type: string
          startup_id: string
          tags: string[]
          title: string
          work_mode: string
        }
        Insert: {
          apply_url: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_at?: string | null
          role_type: string
          startup_id: string
          tags?: string[]
          title: string
          work_mode: string
        }
        Update: {
          apply_url?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          posted_at?: string | null
          role_type?: string
          startup_id?: string
          tags?: string[]
          title?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_roles_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          category: string
          claimed_by_user_id: string | null
          created_at: string
          description: string | null
          founded: string | null
          hq: string | null
          id: string
          logo_url: string | null
          name: string
          rss_feeds: string[] | null
          slug: string
          twitter_handle: string | null
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          category: string
          claimed_by_user_id?: string | null
          created_at?: string
          description?: string | null
          founded?: string | null
          hq?: string | null
          id?: string
          logo_url?: string | null
          name: string
          rss_feeds?: string[] | null
          slug: string
          twitter_handle?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          category?: string
          claimed_by_user_id?: string | null
          created_at?: string
          description?: string | null
          founded?: string | null
          hq?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          rss_feeds?: string[] | null
          slug?: string
          twitter_handle?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          created_at: string | null
          id: string
          items_processed: number | null
          job_name: string
          last_run_at: string | null
          last_success_at: string | null
          last_error: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_processed?: number | null
          job_name: string
          last_run_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items_processed?: number | null
          job_name?: string
          last_run_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          status?: string | null
        }
        Relationships: []
      }
      themed_accounts: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: string
          created_at: string
          display_name: string
          focus: string | null
          handle: string
          id: string
          rss_feeds: string[] | null
          style: string | null
          updated_at: string
          verified: boolean
          vibe: string | null
          voice: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category: string
          created_at?: string
          display_name: string
          focus?: string | null
          handle: string
          id?: string
          rss_feeds?: string[] | null
          style?: string | null
          updated_at?: string
          verified?: boolean
          vibe?: string | null
          voice?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: string
          created_at?: string
          display_name?: string
          focus?: string | null
          handle?: string
          id?: string
          rss_feeds?: string[] | null
          style?: string | null
          updated_at?: string
          verified?: boolean
          vibe?: string | null
          voice?: string | null
        }
        Relationships: []
      }
      themed_posts: {
        Row: {
          account_id: string
          comments_count: number
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          likes_count: number
          published_at: string
          source_type: string
          source_url: string
          summary: string | null
          title: string | null
          views_count: number
        }
        Insert: {
          account_id: string
          comments_count?: number
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number
          published_at?: string
          source_type?: string
          source_url: string
          summary?: string | null
          title?: string | null
          views_count?: number
        }
        Update: {
          account_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number
          published_at?: string
          source_type?: string
          source_url?: string
          summary?: string | null
          title?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "themed_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "themed_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_discoveries: {
        Row: {
          created_at: string
          discovery_type: string | null
          id: string
          published_at: string | null
          sort_order: number
          source_url: string | null
          summary: string | null
          title: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          discovery_type?: string | null
          id?: string
          published_at?: string | null
          sort_order?: number
          source_url?: string | null
          summary?: string | null
          title: string
          topic_id: string
        }
        Update: {
          created_at?: string
          discovery_type?: string | null
          id?: string
          published_at?: string | null
          sort_order?: number
          source_url?: string | null
          summary?: string | null
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_discoveries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_facts: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          label: string
          sort_order: number
          source: string | null
          topic_id: string
          value: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          source?: string | null
          topic_id: string
          value: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          source?: string | null
          topic_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_facts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_sections: {
        Row: {
          created_at: string
          id: string
          section_type: string
          sort_order: number
          summary: string | null
          title: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_type: string
          sort_order?: number
          summary?: string | null
          title: string
          topic_id: string
        }
        Update: {
          created_at?: string
          id?: string
          section_type?: string
          sort_order?: number
          summary?: string | null
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_sections_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_timeline_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          event_type: string | null
          id: string
          sort_order: number
          source_url: string | null
          title: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          sort_order?: number
          source_url?: string | null
          title: string
          topic_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          sort_order?: number
          source_url?: string | null
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_timeline_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          canonical_summary: string | null
          category: string | null
          created_at: string
          description: string | null
          freshness_label: string | null
          hashtags: string[]
          hero_image: string | null
          id: string
          slug: string
          source_class_label: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          canonical_summary?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          freshness_label?: string | null
          hashtags?: string[]
          hero_image?: string | null
          id?: string
          slug: string
          source_class_label?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          canonical_summary?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          freshness_label?: string | null
          hashtags?: string[]
          hero_image?: string | null
          id?: string
          slug?: string
          source_class_label?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_startup_links: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string | null
          source_note: string | null
          startup_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_note?: string | null
          startup_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          source_note?: string | null
          startup_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_startup_links_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_startup_links_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category_tags: string[]
          certifications: string[] | null
          contact_email: string | null
          created_at: string | null
          created_by: string | null
          geographic_coverage: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          known_clients: string | null
          last_verified_at: string | null
          legal_name: string
          services_summary: string
          slug: string
          trade_name: string | null
          updated_at: string | null
          website_url: string
        }
        Insert: {
          category_tags: string[]
          certifications?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          created_by?: string | null
          geographic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          known_clients?: string | null
          last_verified_at?: string | null
          legal_name: string
          services_summary: string
          slug: string
          trade_name?: string | null
          updated_at?: string | null
          website_url: string
        }
        Update: {
          category_tags?: string[]
          certifications?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          created_by?: string | null
          geographic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          known_clients?: string | null
          last_verified_at?: string | null
          legal_name?: string
          services_summary?: string
          slug?: string
          trade_name?: string | null
          updated_at?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      post_stats: {
        Row: {
          comments_count: number | null
          likes_count: number | null
          post_id: string | null
        }
        Insert: {
          comments_count?: never
          likes_count?: never
          post_id?: string | null
        }
        Update: {
          comments_count?: never
          likes_count?: never
          post_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_connection_rpc: { Args: { p_request_id: string }; Returns: string }
      are_users_blocked: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      block_user_rpc: { Args: { p_blocked_id: string }; Returns: undefined }
      check_message_rate_limit: {
        Args: { p_sender_id: string; p_thread_id: string }
        Returns: boolean
      }
      get_feed_page: {
        Args: {
          p_mode?: string
          p_page_offset?: number
          p_page_size?: number
          p_user_id?: string
        }
        Returns: Json
      }
      get_intel_digest: {
        Args: { p_user_id: string }
        Returns: {
          change_description: string
          entity_id: string
          entity_image: string
          entity_name: string
          entity_type: string
          priority_score: number
          url: string
        }[]
      }
      get_live_status: {
        Args: never
        Returns: {
          is_something_live: boolean
          live_event_embed_url: string
          live_event_id: string
          live_event_title: string
          live_event_type: string
          minutes_until_next: number
          next_event_id: string
          next_event_start: string
          next_event_title: string
        }[]
      }
      get_thread_for_users: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      get_trending_hashtags: {
        Args: { p_hours?: number }
        Returns: {
          count: number
          hashtag: string
          velocity_pct: number
        }[]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { r_name: string; u_id: string }; Returns: boolean }
      mark_thread_read: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
