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
      admin_profiles: {
        Row: {
          id: string
          full_name: string
          role: 'superadmin' | 'admin' | 'editor'
          avatar_url: string | null
          is_active: boolean
          failed_login_attempts: number
          ip_whitelist: string[] | null
          two_factor_enabled: boolean
          password_changed_at: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          role?: 'superadmin' | 'admin' | 'editor'
          avatar_url?: string | null
          is_active?: boolean
          failed_login_attempts?: number
          ip_whitelist?: string[] | null
          two_factor_enabled?: boolean
          password_changed_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'superadmin' | 'admin' | 'editor'
          avatar_url?: string | null
          is_active?: boolean
          failed_login_attempts?: number
          ip_whitelist?: string[] | null
          two_factor_enabled?: boolean
          password_changed_at?: string | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      admin_login_logs: {
        Row: {
          id: string
          admin_id: string | null
          attempted_email: string | null
          success: boolean
          ip_address: string | null
          user_agent: string | null
          device_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          attempted_email?: string | null
          success: boolean
          ip_address?: string | null
          user_agent?: string | null
          device_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          attempted_email?: string | null
          success?: boolean
          ip_address?: string | null
          user_agent?: string | null
          device_label?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          table_name: string
          record_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      media_library: {
        Row: {
          id: string
          bucket: 'logos' | 'hero' | 'services' | 'portfolio' | 'testimonials' | 'core-values' | 'about' | 'media'
          storage_path: string
          public_url: string
          mime_type: string
          file_size_bytes: number
          width_px: number | null
          height_px: number | null
          alt_text: string | null
          checksum_sha256: string | null
          uploaded_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          bucket: 'logos' | 'hero' | 'services' | 'portfolio' | 'testimonials' | 'core-values' | 'about' | 'media'
          storage_path: string
          public_url: string
          mime_type: string
          file_size_bytes: number
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          checksum_sha256?: string | null
          uploaded_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          bucket?: 'logos' | 'hero' | 'services' | 'portfolio' | 'testimonials' | 'core-values' | 'about' | 'media'
          storage_path?: string
          public_url?: string
          mime_type?: string
          file_size_bytes?: number
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          checksum_sha256?: string | null
          uploaded_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      site_cache_version: {
        Row: {
          id: boolean
          version: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          version?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          version?: number
          updated_at?: string
        }
      }
      website_settings: {
        Row: {
          id: boolean
          company_name: string
          company_description: string | null
          logo_media_id: string | null
          favicon_media_id: string | null
          business_address: string | null
          contact_phone: string
          contact_email: string
          business_hours_text: string | null
          whatsapp_number: string | null
          whatsapp_default_message: string | null
          google_maps_embed_url: string | null
          google_maps_lat: number | null
          google_maps_lng: number | null
          google_analytics_id: string | null
          facebook_pixel_id: string | null
          default_seo_image_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          company_name?: string
          company_description?: string | null
          logo_media_id?: string | null
          favicon_media_id?: string | null
          business_address?: string | null
          contact_phone: string
          contact_email: string
          business_hours_text?: string | null
          whatsapp_number?: string | null
          whatsapp_default_message?: string | null
          google_maps_embed_url?: string | null
          google_maps_lat?: number | null
          google_maps_lng?: number | null
          google_analytics_id?: string | null
          facebook_pixel_id?: string | null
          default_seo_image_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          company_name?: string
          company_description?: string | null
          logo_media_id?: string | null
          favicon_media_id?: string | null
          business_address?: string | null
          contact_phone?: string
          contact_email?: string
          business_hours_text?: string | null
          whatsapp_number?: string | null
          whatsapp_default_message?: string | null
          google_maps_embed_url?: string | null
          google_maps_lat?: number | null
          google_maps_lng?: number | null
          google_analytics_id?: string | null
          facebook_pixel_id?: string | null
          default_seo_image_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
      website_settings_history: {
        Row: {
          id: string
          snapshot: Json
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          snapshot: Json
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          snapshot?: Json
          changed_by?: string | null
          changed_at?: string
        }
      }
      theme_settings: {
        Row: {
          id: boolean
          primary_color: string
          secondary_color: string
          accent_color: string
          default_theme: 'light' | 'dark'
          theme_switch_enabled: boolean
          heading_font: string | null
          body_font: string | null
          button_border_radius_px: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          default_theme?: 'light' | 'dark'
          theme_switch_enabled?: boolean
          heading_font?: string | null
          body_font?: string | null
          button_border_radius_px?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          default_theme?: 'light' | 'dark'
          theme_switch_enabled?: boolean
          heading_font?: string | null
          body_font?: string | null
          button_border_radius_px?: number
          updated_at?: string
        }
      }
      hero_section: {
        Row: {
          id: boolean
          title: string
          subtitle: string | null
          background_type: 'image' | 'video'
          background_image_id: string | null
          background_video_id: string | null
          logo_media_id: string | null
          cta1_text: string | null
          cta1_target_section: string | null
          cta2_text: string | null
          cta2_target_section: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          title?: string
          subtitle?: string | null
          background_type?: 'image' | 'video'
          background_image_id?: string | null
          background_video_id?: string | null
          logo_media_id?: string | null
          cta1_text?: string | null
          cta1_target_section?: string | null
          cta2_text?: string | null
          cta2_target_section?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          title?: string
          subtitle?: string | null
          background_type?: 'image' | 'video'
          background_image_id?: string | null
          background_video_id?: string | null
          logo_media_id?: string | null
          cta1_text?: string | null
          cta1_target_section?: string | null
          cta2_text?: string | null
          cta2_target_section?: string | null
          updated_at?: string
        }
      }
      footer_settings: {
        Row: {
          id: boolean
          brand_statement: string | null
          copyright_text: string | null
          privacy_policy_url: string | null
          terms_conditions_url: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          brand_statement?: string | null
          copyright_text?: string | null
          privacy_policy_url?: string | null
          terms_conditions_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          brand_statement?: string | null
          copyright_text?: string | null
          privacy_policy_url?: string | null
          terms_conditions_url?: string | null
          updated_at?: string
        }
      }
      consultation_popup_settings: {
        Row: {
          id: boolean
          enabled: boolean
          title: string | null
          subtitle: string | null
          delay_seconds: number
          show_once_per_session: boolean
          primary_button_text: string | null
          secondary_button_text: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          enabled?: boolean
          title?: string | null
          subtitle?: string | null
          delay_seconds?: number
          show_once_per_session?: boolean
          primary_button_text?: string | null
          secondary_button_text?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          enabled?: boolean
          title?: string | null
          subtitle?: string | null
          delay_seconds?: number
          show_once_per_session?: boolean
          primary_button_text?: string | null
          secondary_button_text?: string | null
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          platform: 'instagram' | 'facebook' | 'pinterest' | 'linkedin' | 'whatsapp' | 'youtube'
          url: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: 'instagram' | 'facebook' | 'pinterest' | 'linkedin' | 'whatsapp' | 'youtube'
          url: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: 'instagram' | 'facebook' | 'pinterest' | 'linkedin' | 'whatsapp' | 'youtube'
          url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_types: {
        Row: {
          id: string
          name: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          title: string
          slug: string
          short_description: string
          detailed_overview: string | null
          design_approach: string | null
          materials_finishes: string | null
          cover_image_id: string | null
          icon_media_id: string | null
          display_order: number
          is_visible: boolean
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          short_description: string
          detailed_overview?: string | null
          design_approach?: string | null
          materials_finishes?: string | null
          cover_image_id?: string | null
          icon_media_id?: string | null
          display_order?: number
          is_visible?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          short_description?: string
          detailed_overview?: string | null
          design_approach?: string | null
          materials_finishes?: string | null
          cover_image_id?: string | null
          icon_media_id?: string | null
          display_order?: number
          is_visible?: boolean
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      service_features: {
        Row: {
          id: string
          service_id: string
          feature: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          feature: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          feature?: string
          display_order?: number
          created_at?: string
        }
      }
      service_images: {
        Row: {
          id: string
          service_id: string
          media_id: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          service_id: string
          media_id: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          media_id?: string
          display_order?: number
          created_at?: string
        }
      }
      portfolio_categories: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_projects: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          description: string | null
          cover_image_id: string
          location: string | null
          project_type_id: string | null
          related_service_id: string | null
          completion_year: number | null
          is_featured: boolean
          is_published: boolean
          display_order: number
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          description?: string | null
          cover_image_id: string
          location?: string | null
          project_type_id?: string | null
          related_service_id?: string | null
          completion_year?: number | null
          is_featured?: boolean
          is_published?: boolean
          display_order?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          slug?: string
          description?: string | null
          cover_image_id?: string
          location?: string | null
          project_type_id?: string | null
          related_service_id?: string | null
          completion_year?: number | null
          is_featured?: boolean
          is_published?: boolean
          display_order?: number
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      portfolio_project_images: {
        Row: {
          id: string
          project_id: string
          media_id: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          media_id: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          media_id?: string
          display_order?: number
          created_at?: string
        }
      }
      portfolio_project_tags: {
        Row: {
          project_id: string
          tag_id: string
        }
        Insert: {
          project_id: string
          tag_id: string
        }
        Update: {
          project_id?: string
          tag_id?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          client_name: string
          designation: string | null
          business_name: string | null
          city: string | null
          rating: number
          review_text: string
          client_image_id: string | null
          company_logo_id: string | null
          is_featured: boolean
          is_visible: boolean
          display_order: number
          approved_at: string | null
          approved_by: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          client_name: string
          designation?: string | null
          business_name?: string | null
          city?: string | null
          rating?: number
          review_text: string
          client_image_id?: string | null
          company_logo_id?: string | null
          is_featured?: boolean
          is_visible?: boolean
          display_order?: number
          approved_at?: string | null
          approved_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          client_name?: string
          designation?: string | null
          business_name?: string | null
          city?: string | null
          rating?: number
          review_text?: string
          client_image_id?: string | null
          company_logo_id?: string | null
          is_featured?: boolean
          is_visible?: boolean
          display_order?: number
          approved_at?: string | null
          approved_by?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      inquiries: {
        Row: {
          id: string
          source: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal'
          name: string
          business_name: string | null
          phone_number: string
          email: string
          project_type_id: string | null
          budget_range: 'under_5l' | '5l_10l' | '10l_25l' | '25l_50l' | '50l_plus' | 'not_specified'
          message: string
          status: 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed'
          is_read: boolean
          assigned_to: string | null
          follow_up_date: string | null
          internal_notes: string | null
          resolved_at: string | null
          submitted_ip: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          source?: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal'
          name: string
          business_name?: string | null
          phone_number: string
          email: string
          project_type_id?: string | null
          budget_range?: 'under_5l' | '5l_10l' | '10l_25l' | '25l_50l' | '50l_plus' | 'not_specified'
          message: string
          status?: 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed'
          is_read?: boolean
          assigned_to?: string | null
          follow_up_date?: string | null
          internal_notes?: string | null
          resolved_at?: string | null
          submitted_ip?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          source?: 'contact_form' | 'consultation_popup' | 'header_cta' | 'service_modal'
          name?: string
          business_name?: string | null
          phone_number?: string
          email?: string
          project_type_id?: string | null
          budget_range?: 'under_5l' | '5l_10l' | '10l_25l' | '25l_50l' | '50l_plus' | 'not_specified'
          message?: string
          status?: 'new' | 'read' | 'contacted' | 'in_progress' | 'resolved' | 'closed'
          is_read?: boolean
          assigned_to?: string | null
          follow_up_date?: string | null
          internal_notes?: string | null
          resolved_at?: string | null
          submitted_ip?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      about_content: {
        Row: {
          id: boolean
          intro_text: string | null
          vision_text: string | null
          mission_text: string | null
          intro_image_id: string | null
          vision_image_id: string | null
          mission_image_id: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          intro_text?: string | null
          vision_text?: string | null
          mission_text?: string | null
          intro_image_id?: string | null
          vision_image_id?: string | null
          mission_image_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          intro_text?: string | null
          vision_text?: string | null
          mission_text?: string | null
          intro_image_id?: string | null
          vision_image_id?: string | null
          mission_image_id?: string | null
          updated_at?: string
        }
      }
      design_process_steps: {
        Row: {
          id: string
          title: string
          description: string
          icon_name: string | null
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon_name?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon_name?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      why_choose_features: {
        Row: {
          id: string
          title: string
          description: string
          icon_name: string | null
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon_name?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon_name?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      design_philosophy: {
        Row: {
          id: boolean
          statement_text: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          statement_text?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          statement_text?: string | null
          updated_at?: string
        }
      }
      core_values: {
        Row: {
          id: string
          title: string
          description: string
          image_id: string | null
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_id?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_id?: string | null
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      seo_metadata: {
        Row: {
          id: string
          page_slug: string
          title: string
          meta_description: string | null
          robots_directive: string | null
          canonical_url: string | null
          facebook_image_id: string | null
          twitter_card_type: string | null
          twitter_image_id: string | null
          json_ld: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          page_slug: string
          title: string
          meta_description?: string | null
          robots_directive?: string | null
          canonical_url?: string | null
          facebook_image_id?: string | null
          twitter_card_type?: string | null
          twitter_image_id?: string | null
          json_ld?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          page_slug?: string
          title?: string
          meta_description?: string | null
          robots_directive?: string | null
          canonical_url?: string | null
          facebook_image_id?: string | null
          twitter_card_type?: string | null
          twitter_image_id?: string | null
          json_ld?: Json | null
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          event_type: 'page_view' | 'contact_form_submit' | 'popup_submit' | 'button_click' | 'service_view' | 'portfolio_view'
          entity_type: string | null
          entity_id: string | null
          page_slug: string | null
          session_id: string | null
          referrer: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'page_view' | 'contact_form_submit' | 'popup_submit' | 'button_click' | 'service_view' | 'portfolio_view'
          entity_type?: string | null
          entity_id?: string | null
          page_slug?: string | null
          session_id?: string | null
          referrer?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: 'page_view' | 'contact_form_submit' | 'popup_submit' | 'button_click' | 'service_view' | 'portfolio_view'
          entity_type?: string | null
          entity_id?: string | null
          page_slug?: string | null
          session_id?: string | null
          referrer?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      schema_migrations: {
        Row: {
          version: string
          description: string | null
          applied_at: string
        }
        Insert: {
          version: string
          description?: string | null
          applied_at?: string
        }
        Update: {
          version?: string
          description?: string | null
          applied_at?: string
        }
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          total_services: number
          total_portfolio_projects: number
          total_testimonials: number
          total_inquiries: number
          unread_inquiries: number
        }
      }
      analytics_entity_popularity: {
        Row: {
          entity_type: string | null
          entity_id: string | null
          event_count: number
          last_event_at: string | null
        }
      }
    }
  }
}
