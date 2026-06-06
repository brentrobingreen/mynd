// Auto-generated types for Supabase database.
// Re-run `npx supabase gen types typescript` after schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar: string | null
          created_at: string
          subscription_tier: 'free' | 'premium' | 'lifetime'
          stripe_customer_id: string | null
          readwise_token: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar?: string | null
          created_at?: string
          subscription_tier?: 'free' | 'premium' | 'lifetime'
          stripe_customer_id?: string | null
          readwise_token?: string | null
        }
        Update: {
          name?: string | null
          avatar?: string | null
          subscription_tier?: 'free' | 'premium' | 'lifetime'
          stripe_customer_id?: string | null
          readwise_token?: string | null
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string
          cover_url: string | null
          source: 'kindle' | 'readwise' | 'manual'
          date_added: string
          date_read: string | null
          is_core: boolean
          resonance_score: number
          tags: string[]
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author: string
          cover_url?: string | null
          source: 'kindle' | 'readwise' | 'manual'
          date_added?: string
          date_read?: string | null
          is_core?: boolean
          resonance_score?: number
          tags?: string[]
        }
        Update: {
          title?: string
          author?: string
          cover_url?: string | null
          date_read?: string | null
          is_core?: boolean
          resonance_score?: number
          tags?: string[]
        }
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          book_id: string
          text: string
          note: string | null
          location: string | null
          date_highlighted: string | null
          embedding_id: string | null
          source: 'kindle' | 'readwise' | 'manual'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          text: string
          note?: string | null
          location?: string | null
          date_highlighted?: string | null
          embedding_id?: string | null
          source: 'kindle' | 'readwise' | 'manual'
          created_at?: string
        }
        Update: {
          note?: string | null
          embedding_id?: string | null
        }
      }
      brains: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          book_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          book_ids?: string[]
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          book_ids?: string[]
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          brain_id: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brain_id: string
          title?: string | null
          created_at?: string
        }
        Update: {
          title?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          source_highlights: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          source_highlights?: Json
          created_at?: string
        }
        Update: never
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          content: string
          linked_highlights: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          linked_highlights?: string[]
          created_at?: string
        }
        Update: {
          content?: string
          linked_highlights?: string[]
        }
      }
      daily_digests: {
        Row: {
          id: string
          user_id: string
          content: string
          source_highlights: Json
          date: string
          opened_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          source_highlights?: Json
          date: string
          opened_at?: string | null
          created_at?: string
        }
        Update: {
          opened_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
