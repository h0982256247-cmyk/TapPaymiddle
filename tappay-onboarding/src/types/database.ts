export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string
          user_id: string | null
          partner_account: string
          merchant_type: 'E' | 'P' | null
          industry_code: string
          company_name: string | null
          company_name_english: string | null
          contact_email: string | null
          status: string
          partner_key: string | null
          tappay_status_code: number | null
          tappay_opinion: string | null
          is_complete: boolean
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          partner_account: string
          user_id?: string | null
          merchant_type?: 'E' | 'P' | null
          industry_code?: string
          company_name?: string | null
          company_name_english?: string | null
          contact_email?: string | null
          status?: string
          partner_key?: string | null
          tappay_status_code?: number | null
          tappay_opinion?: string | null
          is_complete?: boolean
          submitted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['merchants']['Insert']>
        Relationships: []
      }
      merchant_basic_info: {
        Row: {
          id: string
          merchant_id: string
          register_info: Json | null
          company_info: Json
          contact_info: Json
          merchant_owner_info: Json
          bank_info: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_basic_info']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['merchant_basic_info']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_basic_info_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: true
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_payment_methods: {
        Row: {
          id: string
          merchant_id: string
          payment_method: string
          payment_config: Json | null
          status: string
          merchant_id_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_payment_methods']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['merchant_payment_methods']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_payment_methods_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_documents: {
        Row: {
          id: string
          merchant_id: string
          document_type: string
          file_path: string
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_documents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['merchant_documents']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_documents_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_notify_logs: {
        Row: {
          id: string
          merchant_id: string | null
          partner_account: string | null
          status_code: number | null
          status: string | null
          payment_method: string | null
          notify_payload: Json
          processed_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_notify_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['merchant_notify_logs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_notify_logs_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_api_logs: {
        Row: {
          id: string
          merchant_id: string | null
          partner_account: string | null
          api_name: string
          http_method: string
          endpoint: string | null
          request_payload: Json | null
          response_payload: Json | null
          response_status: number | null
          duration_ms: number | null
          is_success: boolean | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_api_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['merchant_api_logs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_api_logs_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_drafts: {
        Row: {
          id: string
          merchant_id: string
          user_id: string
          draft_payload: Json
          current_step: number
          updated_at: string
        }
        Insert: {
          merchant_id: string
          user_id: string
          draft_payload: Json
          current_step?: number
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['merchant_drafts']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_drafts_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: true
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
      merchant_supplements: {
        Row: {
          id: string
          merchant_id: string
          payment_method: string | null
          supplement_data: Json
          status: string
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_supplements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['merchant_supplements']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'merchant_supplements_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
