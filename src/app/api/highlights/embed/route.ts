import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestHighlights } from '@/lib/ai/ingestion'

// Embed all highlights that don't yet have an embedding_id
// Called after Kindle upload or Readwise sync
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: highlights, error } = await db
    .from('highlights')
    .select('id, text, book_id, date_highlighted, books(title, author)')
    .eq('user_id', user.id)
    .is('embedding_id', null)
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!highlights || highlights.length === 0) {
    return NextResponse.json({ success: true, embedded: 0, message: 'All highlights already embedded' })
  }

  const toIngest = highlights.map((h: {
    id: string
    text: string
    book_id: string
    date_highlighted: string | null
    books: { title: string; author: string }
  }) => ({
    id: h.id,
    text: h.text,
    bookTitle: h.books?.title ?? 'Unknown',
    author: h.books?.author ?? 'Unknown',
    bookId: h.book_id,
    userId: user.id,
    dateHighlighted: h.date_highlighted,
  }))

  const embeddedIds = await ingestHighlights(toIngest)

  // Mark highlights as embedded
  if (embeddedIds.length > 0) {
    await db
      .from('highlights')
      .update({ embedding_id: 'pinecone' })
      .in('id', embeddedIds)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true, embedded: embeddedIds.length })
}
