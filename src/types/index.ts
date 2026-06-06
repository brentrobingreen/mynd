export type SubscriptionTier = 'free' | 'premium' | 'lifetime'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  created_at: string
  subscription_tier: SubscriptionTier
  readwise_token: string | null
}

export interface Book {
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
  highlight_count?: number
}

export interface Highlight {
  id: string
  user_id: string
  book_id: string
  text: string
  note: string | null
  location: string | null
  date_highlighted: string | null
  embedding_id: string | null
  source: 'kindle' | 'readwise' | 'manual'
  book?: Book
}

export interface Brain {
  id: string
  user_id: string
  name: string
  description: string | null
  book_ids: string[]
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  brain_id: string
  created_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  source_highlights: SourceHighlight[]
  created_at: string
}

export interface SourceHighlight {
  highlight_id: string
  text: string
  book_title: string
  author: string
  relevance_score: number
}

export interface JournalEntry {
  id: string
  user_id: string
  content: string
  linked_highlights: string[]
  created_at: string
}

export interface DailyDigest {
  id: string
  user_id: string
  content: string
  source_highlights: SourceHighlight[]
  date: string
  opened_at: string | null
}

export interface ParsedHighlight {
  bookTitle: string
  author: string
  page: string | null
  location: string | null
  dateHighlighted: string | null
  text: string
}
