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
      ai_config: {
        Row: {
          anthropic_key: string | null
          google_key: string | null
          id: number
          model: string
          openai_key: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          anthropic_key?: string | null
          google_key?: string | null
          id?: number
          model?: string
          openai_key?: string | null
          provider?: string
          updated_at?: string
        }
        Update: {
          anthropic_key?: string | null
          google_key?: string | null
          id?: number
          model?: string
          openai_key?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      author_profiles: {
        Row: {
          badge_since: string | null
          badge_tier: string | null
          bio: string | null
          company_name: string
          created_at: string
          id: string
          logo: string | null
          official_email: string | null
          slug: string | null
          socials: Json
          updated_at: string
          user_id: string
          verified: boolean
          website: string | null
        }
        Insert: {
          badge_since?: string | null
          badge_tier?: string | null
          bio?: string | null
          company_name: string
          created_at?: string
          id?: string
          logo?: string | null
          official_email?: string | null
          slug?: string | null
          socials?: Json
          updated_at?: string
          user_id: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          badge_since?: string | null
          badge_tier?: string | null
          bio?: string | null
          company_name?: string
          created_at?: string
          id?: string
          logo?: string | null
          official_email?: string | null
          slug?: string | null
          socials?: Json
          updated_at?: string
          user_id?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      badge_purchases: {
        Row: {
          amount_xrp: number
          created_at: string
          id: string
          status: string
          tier_key: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_xrp?: number
          created_at?: string
          id?: string
          status?: string
          tier_key: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_xrp?: number
          created_at?: string
          id?: string
          status?: string
          tier_key?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badge_tiers: {
        Row: {
          active: boolean
          benefits: string[]
          color: string
          created_at: string
          id: string
          key: string
          name: string
          price_xrp: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          color?: string
          created_at?: string
          id?: string
          key: string
          name: string
          price_xrp?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefits?: string[]
          color?: string
          created_at?: string
          id?: string
          key?: string
          name?: string
          price_xrp?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          project_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          reason: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          reason?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          reason?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_reasons: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      contact_replies: {
        Row: {
          author_id: string | null
          author_role: string
          body: string
          created_at: string
          id: string
          message_id: string
        }
        Insert: {
          author_id?: string | null
          author_role?: string
          body: string
          created_at?: string
          id?: string
          message_id: string
        }
        Update: {
          author_id?: string | null
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_groups: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          external: boolean
          group_id: string
          href: string
          id: string
          label: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          external?: boolean
          group_id: string
          href: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          external?: boolean
          group_id?: string
          href?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "footer_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "footer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          id: string
          project_slug: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          project_slug: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          project_slug?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      landing_sections: {
        Row: {
          config: Json
          id: string
          section_key: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          config?: Json
          id?: string
          section_key: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          config?: Json
          id?: string
          section_key?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      media_gallery: {
        Row: {
          bytes: number | null
          created_at: string
          filename: string | null
          height: number | null
          id: string
          tags: string[] | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          filename?: string | null
          height?: number | null
          id?: string
          tags?: string[] | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          filename?: string | null
          height?: number | null
          id?: string
          tags?: string[] | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string
          body: string | null
          category: string
          cover_image: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          gallery: string[] | null
          id: string
          meta_description: string | null
          publish_date: string
          seo_keywords: string | null
          slug: string
          status: Database["public"]["Enums"]["news_status"]
          tags: string[] | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author?: string
          body?: string | null
          category?: string
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery?: string[] | null
          id?: string
          meta_description?: string | null
          publish_date?: string
          seo_keywords?: string | null
          slug: string
          status?: Database["public"]["Enums"]["news_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author?: string
          body?: string | null
          category?: string
          cover_image?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          gallery?: string[] | null
          id?: string
          meta_description?: string | null
          publish_date?: string
          seo_keywords?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["news_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          body: string
          created_at: string
          footer_group_id: string | null
          id: string
          meta_description: string | null
          published: boolean
          show_in_footer: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          footer_group_id?: string | null
          id?: string
          meta_description?: string | null
          published?: boolean
          show_in_footer?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          footer_group_id?: string | null
          id?: string
          meta_description?: string | null
          published?: boolean
          show_in_footer?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_footer_group_id_fkey"
            columns: ["footer_group_id"]
            isOneToOne: false
            referencedRelation: "footer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      project_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          project_slug: string
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          project_slug: string
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          project_slug?: string
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_promotions: {
        Row: {
          amount_xrp: number
          created_at: string
          duration_days: number
          ends_at: string | null
          id: string
          project_slug: string
          slot: string
          starts_at: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_xrp?: number
          created_at?: string
          duration_days: number
          ends_at?: string | null
          id?: string
          project_slug: string
          slot: string
          starts_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_xrp?: number
          created_at?: string
          duration_days?: number
          ends_at?: string | null
          id?: string
          project_slug?: string
          slot?: string
          starts_at?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_doc: string | null
          category: string
          created_at: string
          date_added: string
          description: string | null
          featured: boolean
          id: string
          is_public: boolean
          live_status: Database["public"]["Enums"]["live_status"]
          logo: string | null
          name: string
          payment_amount: number | null
          payment_at: string | null
          payment_tx: string | null
          screenshots: string[]
          slug: string
          socials: Json
          status: Database["public"]["Enums"]["project_status"]
          submitter_email: string | null
          submitter_id: string | null
          submitter_name: string | null
          support_email: string | null
          tagline: string | null
          updated_at: string
          url: string
          verified: boolean
          visits: number
        }
        Insert: {
          ai_doc?: string | null
          category: string
          created_at?: string
          date_added?: string
          description?: string | null
          featured?: boolean
          id?: string
          is_public?: boolean
          live_status?: Database["public"]["Enums"]["live_status"]
          logo?: string | null
          name: string
          payment_amount?: number | null
          payment_at?: string | null
          payment_tx?: string | null
          screenshots?: string[]
          slug: string
          socials?: Json
          status?: Database["public"]["Enums"]["project_status"]
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_name?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
          url: string
          verified?: boolean
          visits?: number
        }
        Update: {
          ai_doc?: string | null
          category?: string
          created_at?: string
          date_added?: string
          description?: string | null
          featured?: boolean
          id?: string
          is_public?: boolean
          live_status?: Database["public"]["Enums"]["live_status"]
          logo?: string | null
          name?: string
          payment_amount?: number | null
          payment_at?: string | null
          payment_tx?: string | null
          screenshots?: string[]
          slug?: string
          socials?: Json
          status?: Database["public"]["Enums"]["project_status"]
          submitter_email?: string | null
          submitter_id?: string | null
          submitter_name?: string | null
          support_email?: string | null
          tagline?: string | null
          updated_at?: string
          url?: string
          verified?: boolean
          visits?: number
        }
        Relationships: []
      }
      promotion_packages: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          id: string
          price_xrp: number
          slot: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          id?: string
          price_xrp?: number
          slot: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          id?: string
          price_xrp?: number
          slot?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      search_events: {
        Row: {
          clicked: boolean
          created_at: string
          id: string
          position: number | null
          project_slug: string | null
          query: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked?: boolean
          created_at?: string
          id?: string
          position?: number | null
          project_slug?: string | null
          query: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked?: boolean
          created_at?: string
          id?: string
          position?: number | null
          project_slug?: string | null
          query?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sidebar_menu: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          label: string
          path: string
          requires_auth: boolean
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          path: string
          requires_auth?: boolean
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          path?: string
          requires_auth?: boolean
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          ai_default_instruction: string | null
          allow_user_override: boolean
          auto_approve: boolean
          cloudinary_cloud_name: string
          cloudinary_upload_preset: string
          contact_company: string | null
          contact_email: string | null
          contact_location: string | null
          default_theme: string
          enable_iframe: boolean
          enable_submissions: boolean
          id: number
          listing_fee_xrp: number
          listing_payment_address: string | null
          maintenance_mode: boolean
          meta_description: string
          site_name: string
          updated_at: string
        }
        Insert: {
          ai_default_instruction?: string | null
          allow_user_override?: boolean
          auto_approve?: boolean
          cloudinary_cloud_name?: string
          cloudinary_upload_preset?: string
          contact_company?: string | null
          contact_email?: string | null
          contact_location?: string | null
          default_theme?: string
          enable_iframe?: boolean
          enable_submissions?: boolean
          id?: number
          listing_fee_xrp?: number
          listing_payment_address?: string | null
          maintenance_mode?: boolean
          meta_description?: string
          site_name?: string
          updated_at?: string
        }
        Update: {
          ai_default_instruction?: string | null
          allow_user_override?: boolean
          auto_approve?: boolean
          cloudinary_cloud_name?: string
          cloudinary_upload_preset?: string
          contact_company?: string | null
          contact_email?: string | null
          contact_location?: string | null
          default_theme?: string
          enable_iframe?: boolean
          enable_submissions?: boolean
          id?: number
          listing_fee_xrp?: number
          listing_payment_address?: string | null
          maintenance_mode?: boolean
          meta_description?: string
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickers: {
        Row: {
          created_at: string
          id: string
          label: string
          linked_project_slug: string | null
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          linked_project_slug?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          linked_project_slug?: string | null
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string | null
          amount_xrp: number
          created_at: string
          description: string | null
          id: string
          kind: string
          reference_id: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount_xrp?: number
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          reference_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount_xrp?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          reference_id?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wallet_config: {
        Row: {
          id: number
          network: string
          rpc_url: string
          treasury_address: string
          updated_at: string
          xaman_api_key: string
          xaman_api_secret: string
        }
        Insert: {
          id?: number
          network?: string
          rpc_url?: string
          treasury_address?: string
          updated_at?: string
          xaman_api_key?: string
          xaman_api_secret?: string
        }
        Update: {
          id?: number
          network?: string
          rpc_url?: string
          treasury_address?: string
          updated_at?: string
          xaman_api_key?: string
          xaman_api_secret?: string
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
      xaman_public_config: {
        Args: never
        Returns: {
          network: string
          rpc_url: string
          treasury_address: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      live_status: "Live" | "Beta" | "Coming Soon"
      news_status: "draft" | "published"
      project_status: "pending" | "approved" | "rejected"
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
      live_status: ["Live", "Beta", "Coming Soon"],
      news_status: ["draft", "published"],
      project_status: ["pending", "approved", "rejected"],
    },
  },
} as const
