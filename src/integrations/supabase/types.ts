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
      lead_activities: {
        Row: {
          body: string | null
          created_at: string
          id: string
          quote_id: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          quote_id: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          quote_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pipeline: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          labels: string[]
          meeting_at: string | null
          next_call_at: string | null
          outcome: string | null
          quote_expires_at: string | null
          quote_id: string
          stage: string
          updated_at: string
          view_count: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          labels?: string[]
          meeting_at?: string | null
          next_call_at?: string | null
          outcome?: string | null
          quote_expires_at?: string | null
          quote_id: string
          stage?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          labels?: string[]
          meeting_at?: string | null
          next_call_at?: string | null
          outcome?: string | null
          quote_expires_at?: string | null
          quote_id?: string
          stage?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_pipeline_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          automation: string | null
          base_price: number | null
          budget: string | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          design_image: string | null
          dimensions: string | null
          edit_token: string | null
          email_consent: boolean
          estimate_overrides: Json | null
          frame_color: string | null
          id: string
          is_archived: boolean
          is_draft: boolean
          is_hot: boolean
          is_qualified: boolean
          is_sent: boolean
          is_viewed: boolean
          lighting: Json | null
          lighting_price: number | null
          louvered_angle: number | null
          material: string | null
          mounted_side: string | null
          mounting: string | null
          notes: string | null
          order_description: string | null
          panel_price: number | null
          panels: Json | null
          pdf_url: string | null
          pergola_type: string | null
          price: number
          quote_number: string
          retractable_openness: number | null
          roof_color: string | null
          roof_price: number | null
          roof_type: string | null
          sales_rep: string | null
          sales_rep_email: string | null
          status: string
          structure_type: string | null
          style: string | null
          timeline: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          automation?: string | null
          base_price?: number | null
          budget?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          design_image?: string | null
          dimensions?: string | null
          edit_token?: string | null
          email_consent?: boolean
          estimate_overrides?: Json | null
          frame_color?: string | null
          id?: string
          is_archived?: boolean
          is_draft?: boolean
          is_hot?: boolean
          is_qualified?: boolean
          is_sent?: boolean
          is_viewed?: boolean
          lighting?: Json | null
          lighting_price?: number | null
          louvered_angle?: number | null
          material?: string | null
          mounted_side?: string | null
          mounting?: string | null
          notes?: string | null
          order_description?: string | null
          panel_price?: number | null
          panels?: Json | null
          pdf_url?: string | null
          pergola_type?: string | null
          price?: number
          quote_number: string
          retractable_openness?: number | null
          roof_color?: string | null
          roof_price?: number | null
          roof_type?: string | null
          sales_rep?: string | null
          sales_rep_email?: string | null
          status?: string
          structure_type?: string | null
          style?: string | null
          timeline?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          automation?: string | null
          base_price?: number | null
          budget?: string | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          design_image?: string | null
          dimensions?: string | null
          edit_token?: string | null
          email_consent?: boolean
          estimate_overrides?: Json | null
          frame_color?: string | null
          id?: string
          is_archived?: boolean
          is_draft?: boolean
          is_hot?: boolean
          is_qualified?: boolean
          is_sent?: boolean
          is_viewed?: boolean
          lighting?: Json | null
          lighting_price?: number | null
          louvered_angle?: number | null
          material?: string | null
          mounted_side?: string | null
          mounting?: string | null
          notes?: string | null
          order_description?: string | null
          panel_price?: number | null
          panels?: Json | null
          pdf_url?: string | null
          pergola_type?: string | null
          price?: number
          quote_number?: string
          retractable_openness?: number | null
          roof_color?: string | null
          roof_price?: number | null
          roof_type?: string | null
          sales_rep?: string | null
          sales_rep_email?: string | null
          status?: string
          structure_type?: string | null
          style?: string | null
          timeline?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
