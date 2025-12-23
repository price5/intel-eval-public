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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievement_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      achievement_role_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          emoji: string
          id: string
          name: string
          tier_level: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          emoji: string
          id?: string
          name: string
          tier_level?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          emoji?: string
          id?: string
          name?: string
          tier_level?: number | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          points: number
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          tier: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          tier?: string
        }
        Relationships: []
      }
      assessment_security_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_security_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          assessment_id: string
          created_at: string
          device_info: string
          ended_at: string | null
          id: string
          ip_address: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          device_info: string
          ended_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          device_info?: string
          ended_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_submissions: {
        Row: {
          assessment_id: string
          code: string
          code_feedback: string | null
          code_heatmap: Json | null
          code_score: number | null
          evaluated_at: string | null
          explanation: string | null
          explanation_feedback: string | null
          explanation_heatmap: Json | null
          explanation_score: number | null
          id: string
          improvements: Json | null
          language: string
          overall_score: number | null
          recommendations: Json | null
          score: number | null
          status: string
          strengths: Json | null
          student_id: string
          submitted_at: string
          suspicious_activity: Json | null
          tab_switch_count: number | null
          test_results: Json | null
        }
        Insert: {
          assessment_id: string
          code: string
          code_feedback?: string | null
          code_heatmap?: Json | null
          code_score?: number | null
          evaluated_at?: string | null
          explanation?: string | null
          explanation_feedback?: string | null
          explanation_heatmap?: Json | null
          explanation_score?: number | null
          id?: string
          improvements?: Json | null
          language?: string
          overall_score?: number | null
          recommendations?: Json | null
          score?: number | null
          status?: string
          strengths?: Json | null
          student_id: string
          submitted_at?: string
          suspicious_activity?: Json | null
          tab_switch_count?: number | null
          test_results?: Json | null
        }
        Update: {
          assessment_id?: string
          code?: string
          code_feedback?: string | null
          code_heatmap?: Json | null
          code_score?: number | null
          evaluated_at?: string | null
          explanation?: string | null
          explanation_feedback?: string | null
          explanation_heatmap?: Json | null
          explanation_score?: number | null
          id?: string
          improvements?: Json | null
          language?: string
          overall_score?: number | null
          recommendations?: Json | null
          score?: number | null
          status?: string
          strengths?: Json | null
          student_id?: string
          submitted_at?: string
          suspicious_activity?: Json | null
          tab_switch_count?: number | null
          test_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "student_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assessment_submissions_student_profile"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assessments: {
        Row: {
          allow_reattempts: boolean | null
          code_weight: number | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          difficulty: string
          explanation_weight: number | null
          hidden_test_cases: Json
          id: string
          is_active: boolean
          points: number
          problem_description: string
          problem_statement: string
          reattempt_scoring_method: string | null
          test_cases: Json
          time_limit: number
          title: string
          updated_at: string
        }
        Insert: {
          allow_reattempts?: boolean | null
          code_weight?: number | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          difficulty: string
          explanation_weight?: number | null
          hidden_test_cases?: Json
          id?: string
          is_active?: boolean
          points?: number
          problem_description: string
          problem_statement: string
          reattempt_scoring_method?: string | null
          test_cases?: Json
          time_limit?: number
          title: string
          updated_at?: string
        }
        Update: {
          allow_reattempts?: boolean | null
          code_weight?: number | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          difficulty?: string
          explanation_weight?: number | null
          hidden_test_cases?: Json
          id?: string
          is_active?: boolean
          points?: number
          problem_description?: string
          problem_statement?: string
          reattempt_scoring_method?: string | null
          test_cases?: Json
          time_limit?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          category: string
          color: string | null
          created_at: string
          criteria: Json
          description: string
          icon: string | null
          id: string
          name: string
          tier_order: number | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          criteria: Json
          description: string
          icon?: string | null
          id?: string
          name: string
          tier_order?: number | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          name?: string
          tier_order?: number | null
        }
        Relationships: []
      }
      bookmarked_direct_messages: {
        Row: {
          created_at: string
          id: string
          message_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_direct_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarked_messages: {
        Row: {
          created_at: string
          id: string
          message_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "chat_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          audio_duration: number | null
          audio_url: string | null
          channel_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_forwarded: boolean | null
          is_pinned: boolean | null
          mentions: string[] | null
          parent_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_duration?: number | null
          audio_url?: string | null
          channel_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_duration?: number | null
          audio_url?: string | null
          channel_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_message_reactions: {
        Row: {
          created_at: string
          direct_message_id: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direct_message_id: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direct_message_id?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_reactions_direct_message_id_fkey"
            columns: ["direct_message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          audio_duration: number | null
          audio_url: string | null
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_forwarded: boolean | null
          is_read: boolean
          parent_id: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          audio_duration?: number | null
          audio_url?: string | null
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          is_read?: boolean
          parent_id?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          audio_duration?: number | null
          audio_url?: string | null
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          is_read?: boolean
          parent_id?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          comment_count: number
          created_at: string
          description: string
          id: string
          priority: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
          vote_count: number
        }
        Insert: {
          admin_notes?: string | null
          comment_count?: number
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          vote_count?: number
        }
        Update: {
          admin_notes?: string | null
          comment_count?: number
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          vote_count?: number
        }
        Relationships: []
      }
      feedback_comments: {
        Row: {
          comment: string
          created_at: string
          feedback_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          feedback_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          feedback_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_history: {
        Row: {
          created_at: string
          id: string
          rank_code: number | null
          rank_explanation: number | null
          rank_overall: number | null
          score_code: number | null
          score_explanation: number | null
          score_overall: number | null
          season: string
          total_submissions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank_code?: number | null
          rank_explanation?: number | null
          rank_overall?: number | null
          score_code?: number | null
          score_explanation?: number | null
          score_overall?: number | null
          season: string
          total_submissions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rank_code?: number | null
          rank_explanation?: number | null
          rank_overall?: number | null
          score_code?: number | null
          score_explanation?: number | null
          score_overall?: number | null
          season?: string
          total_submissions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      league_memberships: {
        Row: {
          created_at: string | null
          final_rank: number | null
          id: string
          league_id: string
          promotion_status: string | null
          starting_xp: number | null
          updated_at: string | null
          user_id: string
          week_start: string
          week_xp: number | null
        }
        Insert: {
          created_at?: string | null
          final_rank?: number | null
          id?: string
          league_id: string
          promotion_status?: string | null
          starting_xp?: number | null
          updated_at?: string | null
          user_id: string
          week_start: string
          week_xp?: number | null
        }
        Update: {
          created_at?: string | null
          final_rank?: number | null
          id?: string
          league_id?: string
          promotion_status?: string | null
          starting_xp?: number | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
          week_xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "league_memberships_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "weekly_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          achievement_unlocked: boolean
          assessment_deadline: boolean
          assessment_graded: boolean
          created_at: string
          direct_message: boolean
          email_notifications: boolean
          feedback_response: boolean
          id: string
          message_mention: boolean
          message_reply: boolean
          moderation_action: boolean
          rank_change: boolean
          system_announcement: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_unlocked?: boolean
          assessment_deadline?: boolean
          assessment_graded?: boolean
          created_at?: string
          direct_message?: boolean
          email_notifications?: boolean
          feedback_response?: boolean
          id?: string
          message_mention?: boolean
          message_reply?: boolean
          moderation_action?: boolean
          rank_change?: boolean
          system_announcement?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_unlocked?: boolean
          assessment_deadline?: boolean
          assessment_graded?: boolean
          created_at?: string
          direct_message?: boolean
          email_notifications?: boolean
          feedback_response?: boolean
          id?: string
          message_mention?: boolean
          message_reply?: boolean
          moderation_action?: boolean
          rank_change?: boolean
          system_announcement?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          batch_count: number | null
          batch_items: Json | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          batch_count?: number | null
          batch_items?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          batch_count?: number | null
          batch_items?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      practice_problem_submissions: {
        Row: {
          code: string
          code_feedback: string | null
          code_heatmap: Json | null
          code_score: number | null
          evaluated_at: string | null
          explanation: string | null
          explanation_feedback: string | null
          explanation_heatmap: Json | null
          explanation_score: number | null
          id: string
          improvements: Json | null
          language: string
          overall_score: number | null
          problem_id: string
          recommendations: Json | null
          status: string
          strengths: Json | null
          student_id: string
          submitted_at: string
          test_results: Json | null
        }
        Insert: {
          code: string
          code_feedback?: string | null
          code_heatmap?: Json | null
          code_score?: number | null
          evaluated_at?: string | null
          explanation?: string | null
          explanation_feedback?: string | null
          explanation_heatmap?: Json | null
          explanation_score?: number | null
          id?: string
          improvements?: Json | null
          language?: string
          overall_score?: number | null
          problem_id: string
          recommendations?: Json | null
          status?: string
          strengths?: Json | null
          student_id: string
          submitted_at?: string
          test_results?: Json | null
        }
        Update: {
          code?: string
          code_feedback?: string | null
          code_heatmap?: Json | null
          code_score?: number | null
          evaluated_at?: string | null
          explanation?: string | null
          explanation_feedback?: string | null
          explanation_heatmap?: Json | null
          explanation_score?: number | null
          id?: string
          improvements?: Json | null
          language?: string
          overall_score?: number | null
          problem_id?: string
          recommendations?: Json | null
          status?: string
          strengths?: Json | null
          student_id?: string
          submitted_at?: string
          test_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_problem_submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "practice_problems"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_problems: {
        Row: {
          created_at: string
          created_by: string
          description: string
          difficulty: string
          hidden_test_cases: Json
          id: string
          is_active: boolean
          points: number
          problem_description: string
          problem_statement: string
          test_cases: Json
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          difficulty: string
          hidden_test_cases?: Json
          id?: string
          is_active?: boolean
          points?: number
          problem_description: string
          problem_statement: string
          test_cases?: Json
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          difficulty?: string
          hidden_test_cases?: Json
          id?: string
          is_active?: boolean
          points?: number
          problem_description?: string
          problem_statement?: string
          test_cases?: Json
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          code: string
          code_feedback: string
          code_score: number
          code_weight: number
          created_at: string
          explanation: string
          explanation_feedback: string
          explanation_score: number
          id: string
          improvements: Json
          language: string
          overall_score: number
          recommendations: Json
          strengths: Json
          student_id: string
        }
        Insert: {
          code: string
          code_feedback: string
          code_score: number
          code_weight?: number
          created_at?: string
          explanation: string
          explanation_feedback: string
          explanation_score: number
          id?: string
          improvements?: Json
          language: string
          overall_score: number
          recommendations?: Json
          strengths?: Json
          student_id: string
        }
        Update: {
          code?: string
          code_feedback?: string
          code_score?: number
          code_weight?: number
          created_at?: string
          explanation?: string
          explanation_feedback?: string
          explanation_score?: number
          id?: string
          improvements?: Json
          language?: string
          overall_score?: number
          recommendations?: Json
          strengths?: Json
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievement_role: string | null
          avatar_url: string | null
          bio: string | null
          college: Database["public"]["Enums"]["college"]
          created_at: string
          custom_status_emoji: string | null
          custom_status_expires_at: string | null
          custom_status_text: string | null
          days_active: number | null
          full_name: string
          highest_rank_code: number | null
          highest_rank_explanation: number | null
          highest_rank_overall: number | null
          id: string
          inactivity_timeout: number | null
          is_banned: boolean | null
          is_suspended: boolean | null
          last_login_date: string | null
          last_username_change: string | null
          moderation_expires_at: string | null
          moderation_reason: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_count: number | null
          updated_at: string
          user_id: string
          username: string
          usn: string
        }
        Insert: {
          achievement_role?: string | null
          avatar_url?: string | null
          bio?: string | null
          college: Database["public"]["Enums"]["college"]
          created_at?: string
          custom_status_emoji?: string | null
          custom_status_expires_at?: string | null
          custom_status_text?: string | null
          days_active?: number | null
          full_name: string
          highest_rank_code?: number | null
          highest_rank_explanation?: number | null
          highest_rank_overall?: number | null
          id?: string
          inactivity_timeout?: number | null
          is_banned?: boolean | null
          is_suspended?: boolean | null
          last_login_date?: string | null
          last_username_change?: string | null
          moderation_expires_at?: string | null
          moderation_reason?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_count?: number | null
          updated_at?: string
          user_id: string
          username: string
          usn: string
        }
        Update: {
          achievement_role?: string | null
          avatar_url?: string | null
          bio?: string | null
          college?: Database["public"]["Enums"]["college"]
          created_at?: string
          custom_status_emoji?: string | null
          custom_status_expires_at?: string | null
          custom_status_text?: string | null
          days_active?: number | null
          full_name?: string
          highest_rank_code?: number | null
          highest_rank_explanation?: number | null
          highest_rank_overall?: number | null
          id?: string
          inactivity_timeout?: number | null
          is_banned?: boolean | null
          is_suspended?: boolean | null
          last_login_date?: string | null
          last_username_change?: string | null
          moderation_expires_at?: string | null
          moderation_reason?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_count?: number | null
          updated_at?: string
          user_id?: string
          username?: string
          usn?: string
        }
        Relationships: []
      }
      status_incidents: {
        Row: {
          affected_services: string[]
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_services?: string[]
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          severity: string
          started_at?: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_services?: string[]
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievement_roles: {
        Row: {
          id: string
          role_category: string
          role_name: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          role_category: string
          role_name: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          role_category?: string
          role_name?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievement_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          awarded_by: string | null
          earned_at: string | null
          id: string
          method: string | null
          progress: number | null
          progress_max: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          awarded_by?: string | null
          earned_at?: string | null
          id?: string
          method?: string | null
          progress?: number | null
          progress_max?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          awarded_by?: string | null
          earned_at?: string | null
          id?: string
          method?: string | null
          progress?: number | null
          progress_max?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          season: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          season?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          season?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_counters: {
        Row: {
          counter_key: string
          counter_value: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          counter_key: string
          counter_value?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          counter_key?: string
          counter_value?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          moderator_id: string
          reason: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id: string
          reason: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rankings: {
        Row: {
          avg_score_code: number | null
          avg_score_explanation: number | null
          avg_score_overall: number | null
          current_rank_code: number | null
          current_rank_explanation: number | null
          current_rank_overall: number | null
          highest_rank_code: number | null
          highest_rank_explanation: number | null
          highest_rank_overall: number | null
          id: string
          last_updated: string
          total_submissions: number
          user_id: string
        }
        Insert: {
          avg_score_code?: number | null
          avg_score_explanation?: number | null
          avg_score_overall?: number | null
          current_rank_code?: number | null
          current_rank_explanation?: number | null
          current_rank_overall?: number | null
          highest_rank_code?: number | null
          highest_rank_explanation?: number | null
          highest_rank_overall?: number | null
          id?: string
          last_updated?: string
          total_submissions?: number
          user_id: string
        }
        Update: {
          avg_score_code?: number | null
          avg_score_explanation?: number | null
          avg_score_overall?: number | null
          current_rank_code?: number | null
          current_rank_explanation?: number | null
          current_rank_overall?: number | null
          highest_rank_code?: number | null
          highest_rank_explanation?: number | null
          highest_rank_overall?: number | null
          id?: string
          last_updated?: string
          total_submissions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_xp: number
          first_try_success: number
          id: string
          level: number
          perfect_scores: number
          submissions_count: number
          total_xp: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_xp?: number
          first_try_success?: number
          id?: string
          level?: number
          perfect_scores?: number
          submissions_count?: number
          total_xp?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_xp?: number
          first_try_success?: number
          id?: string
          level?: number
          perfect_scores?: number
          submissions_count?: number
          total_xp?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_xp_boosters: {
        Row: {
          booster_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          multiplier: number
          started_at: string | null
          user_id: string
        }
        Insert: {
          booster_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number
          started_at?: string | null
          user_id: string
        }
        Update: {
          booster_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          multiplier?: number
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_xp_boosters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_leagues: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          league_number: number
          tier: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          league_number: number
          tier: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          league_number?: number
          tier?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          activity_id: string | null
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          multiplier: number | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          activity_id?: string | null
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          multiplier?: number | null
          user_id: string
          xp_amount: number
        }
        Update: {
          activity_id?: string | null
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          multiplier?: number | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      student_assessments: {
        Row: {
          created_at: string | null
          deadline: string | null
          description: string | null
          difficulty: string | null
          id: string | null
          is_active: boolean | null
          points: number | null
          problem_description: string | null
          problem_statement: string | null
          test_cases: Json | null
          time_limit: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string | null
          is_active?: boolean | null
          points?: number | null
          problem_description?: string | null
          problem_statement?: string | null
          test_cases?: Json | null
          time_limit?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string | null
          is_active?: boolean | null
          points?: number | null
          problem_description?: string | null
          problem_statement?: string | null
          test_cases?: Json | null
          time_limit?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_random_double_xp_hour: { Args: never; Returns: undefined }
      activate_weekend_booster: { Args: never; Returns: undefined }
      award_xp:
        | {
            Args: {
              p_activity_id?: string
              p_activity_type: string
              p_base_xp: number
              p_description?: string
              p_user_id: string
            }
            Returns: number
          }
        | {
            Args: {
              p_activity_id?: string
              p_activity_type: string
              p_base_xp: number
              p_description?: string
              p_user_id: string
            }
            Returns: number
          }
      calculate_user_achievement_role: {
        Args: { user_id_param: string }
        Returns: string
      }
      calculate_user_rankings: { Args: never; Returns: undefined }
      can_send_message: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_channel: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      check_and_award_achievements: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      clear_expired_custom_statuses: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      create_weekly_leagues: { Args: never; Returns: undefined }
      evaluate_and_award_achievements: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_current_league_week_boundaries: {
        Args: never
        Returns: {
          week_end: string
          week_start: string
        }[]
      }
      get_higher_tier: { Args: { current_tier: string }; Returns: string }
      get_lower_tier: { Args: { current_tier: string }; Returns: string }
      get_user_top_emojis: {
        Args: { limit_count?: number; user_id_param: string }
        Returns: {
          count: number
          emoji: string
        }[]
      }
      handle_user_login: { Args: { user_id_param: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_event_counter: {
        Args: {
          counter_key_param: string
          increment_by?: number
          user_id_param: string
        }
        Returns: undefined
      }
      is_user_moderated: { Args: { user_id_param: string }; Returns: boolean }
      is_username_available: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      process_weekly_promotions: { Args: never; Returns: undefined }
      suggest_usernames: { Args: { base_username: string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      college: "New Horizon College of Engineering"
      notification_type:
        | "assessment_graded"
        | "assessment_deadline"
        | "achievement_unlocked"
        | "rank_change"
        | "message_mention"
        | "message_reply"
        | "direct_message"
        | "feedback_response"
        | "system_announcement"
        | "moderation_action"
      user_role: "student" | "instructor"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      college: ["New Horizon College of Engineering"],
      notification_type: [
        "assessment_graded",
        "assessment_deadline",
        "achievement_unlocked",
        "rank_change",
        "message_mention",
        "message_reply",
        "direct_message",
        "feedback_response",
        "system_announcement",
        "moderation_action",
      ],
      user_role: ["student", "instructor"],
    },
  },
} as const
