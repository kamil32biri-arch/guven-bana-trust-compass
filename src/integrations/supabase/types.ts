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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["report_category"] | null
          created_at: string
          created_by: string | null
          id: string
          level: string
          published: boolean
          title: string
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          published?: boolean
          title: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      appeals: {
        Row: {
          admin_reply: string | null
          business_id: string | null
          created_at: string
          id: string
          reason: string
          report_id: string | null
          review_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          reason: string
          report_id?: string | null
          review_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          report_id?: string | null
          review_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      business_responses: {
        Row: {
          body: string
          business_id: string
          created_at: string
          id: string
          report_id: string | null
          responder_id: string
          review_id: string | null
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          id?: string
          report_id?: string | null
          responder_id: string
          review_id?: string | null
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          report_id?: string | null
          responder_id?: string
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_responses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      business_verifications: {
        Row: {
          business_id: string
          created_at: string
          document_path: string | null
          id: string
          legal_name: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_by: string
          tax_number: string
        }
        Insert: {
          business_id: string
          created_at?: string
          document_path?: string | null
          id?: string
          legal_name: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_by: string
          tax_number: string
        }
        Update: {
          business_id?: string
          created_at?: string
          document_path?: string | null
          id?: string
          legal_name?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_by?: string
          tax_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          category: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_path: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
        }
        Relationships: []
      }
      report_attachments: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          id: string
          incident_date: string | null
          kind: string
          mime_type: string | null
          report_id: string | null
          shared_with_moderation: boolean
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          id?: string
          incident_date?: string | null
          kind?: string
          mime_type?: string | null
          report_id?: string | null
          shared_with_moderation?: boolean
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          id?: string
          incident_date?: string | null
          kind?: string
          mime_type?: string | null
          report_id?: string | null
          shared_with_moderation?: boolean
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_note: string | null
          amount: number | null
          business_id: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          description: string
          id: string
          incident_date: string | null
          payment_info: string | null
          phone: string | null
          public_summary: string | null
          related_entity: string | null
          share_anonymously: boolean
          social_account: string | null
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          admin_note?: string | null
          amount?: number | null
          business_id?: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description: string
          id?: string
          incident_date?: string | null
          payment_info?: string | null
          phone?: string | null
          public_summary?: string | null
          related_entity?: string | null
          share_anonymously?: boolean
          social_account?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number | null
          business_id?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string
          id?: string
          incident_date?: string | null
          payment_info?: string | null
          phone?: string | null
          public_summary?: string | null
          related_entity?: string | null
          share_anonymously?: boolean
          social_account?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          business_id: string
          created_at: string
          id: string
          is_hidden: boolean
          is_verified_experience: boolean
          rating: number
          title: string | null
          user_id: string
        }
        Insert: {
          body: string
          business_id: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_verified_experience?: boolean
          rating: number
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_verified_experience?: boolean
          rating?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      similar_cases: {
        Row: {
          case_count: number
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          created_by: string | null
          id: string
          method_summary: string
          published: boolean
          solution_hint: string | null
          title: string
        }
        Insert: {
          case_count?: number
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          method_summary: string
          published?: boolean
          solution_hint?: string | null
          title: string
        }
        Update: {
          case_count?: number
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          method_summary?: string
          published?: boolean
          solution_hint?: string | null
          title?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      suspicious_entities: {
        Row: {
          admin_note: string | null
          created_at: string
          distinct_reporters: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_verified_warning: boolean
          last_reported_at: string | null
          report_count: number
          value_normalized: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          distinct_reporters?: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_verified_warning?: boolean
          last_reported_at?: string | null
          report_count?: number
          value_normalized: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          distinct_reporters?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_verified_warning?: boolean
          last_reported_at?: string | null
          report_count?: number
          value_normalized?: string
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          avg_rating: number | null
          business_id: string
          computed_at: string
          report_count: number
          resolution_rate: number | null
          response_rate: number | null
          sample_size: number
          satisfaction: number | null
          score: number | null
          transparency: number | null
          verified_reviews: number
        }
        Insert: {
          avg_rating?: number | null
          business_id: string
          computed_at?: string
          report_count?: number
          resolution_rate?: number | null
          response_rate?: number | null
          sample_size?: number
          satisfaction?: number | null
          score?: number | null
          transparency?: number | null
          verified_reviews?: number
        }
        Update: {
          avg_rating?: number | null
          business_id?: string
          computed_at?: string
          report_count?: number
          resolution_rate?: number | null
          response_rate?: number | null
          sample_size?: number
          satisfaction?: number | null
          score?: number | null
          transparency?: number | null
          verified_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "trust_scores_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      check_entity: {
        Args: {
          _type: Database["public"]["Enums"]["entity_type"]
          _value: string
        }
        Returns: {
          admin_note: string
          distinct_reporters: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          is_verified_warning: boolean
          last_reported_at: string
          level: string
          value_normalized: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _uid: string }; Returns: boolean }
      is_business_owner: { Args: { _b: string }; Returns: boolean }
      normalize_entity: {
        Args: { _type: Database["public"]["Enums"]["entity_type"]; _v: string }
        Returns: string
      }
      public_similar_reports: {
        Args: {
          _category?: Database["public"]["Enums"]["report_category"]
          _limit?: number
          _q?: string
        }
        Returns: {
          category: Database["public"]["Enums"]["report_category"]
          created_month: string
          id: string
          status: Database["public"]["Enums"]["report_status"]
          summary: string
        }[]
      }
      redact_pii: { Args: { _t: string }; Returns: string }
      refresh_trust_score: { Args: { _b: string }; Returns: undefined }
      upsert_entity: {
        Args: { _raw: string; _t: Database["public"]["Enums"]["entity_type"] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      entity_type: "phone" | "website" | "social" | "payment"
      report_category:
        | "internet"
        | "telefon"
        | "eticaret"
        | "santaj"
        | "sahte_ilan"
        | "abonelik"
        | "isletme"
        | "finansal"
        | "diger"
      report_status:
        | "yeni"
        | "inceleniyor"
        | "ek_bilgi"
        | "yanitlandi"
        | "cozuldu"
        | "sonuclandirilamadi"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      entity_type: ["phone", "website", "social", "payment"],
      report_category: [
        "internet",
        "telefon",
        "eticaret",
        "santaj",
        "sahte_ilan",
        "abonelik",
        "isletme",
        "finansal",
        "diger",
      ],
      report_status: [
        "yeni",
        "inceleniyor",
        "ek_bilgi",
        "yanitlandi",
        "cozuldu",
        "sonuclandirilamadi",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
