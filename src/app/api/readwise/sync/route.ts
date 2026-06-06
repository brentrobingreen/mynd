import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllBooks, fetchAllHighlights, isExcludedBook } from '@/lib/readwise/client'
import { fetchBookCover } from '@/lib/books/google-books'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: profile } = await db.from('users').select('readwise_token').eq('id', user.id).single()
  if (!profile?.readwise_token) {
    return NextResponse.json({ error: 'Readwise not connected' }, { status: 400 })
  }

  const token = profile.readwise_token

  // Fetch books and highlights from Readwise separately
  const [rwBooks, rwHighlights] = await Promise.all([
    fetchAllBooks(token),
    fetchAllHighlights(token),
  ])

  // Build book lookup map — skip excluded books (e.g. "How to Use Readwise")
  const bookMap = new Map<number, typeof rwBooks[0]>()
  for (const book of rwBooks) {
    if (!isExcludedBook(book.title, book.author)) {
      bookMap.set(book.id, book)
    }
  }

  // Group highlights by book_id, skipping excluded books and empty highlights
  const highlightsByBook = new Map<number, typeof rwHighlights>()
  for (const h of rwHighlights) {
    if (!h.text?.trim()) continue
    if (!bookMap.has(h.book_id)) continue // excluded or unknown book
    if (!highlightsByBook.has(h.book_id)) highlightsByBook.set(h.book_id, [])
    highlightsByBook.get(h.book_id)!.push(h)
  }

  let booksImported = 0
  let highlightsImported = 0

  for (const [rwBookId, highlights] of highlightsByBook) {
    const rwBook = bookMap.get(rwBookId)!
    const title = rwBook.title.trim()
    const author = (rwBook.author ?? 'Unknown').trim()

    // Upsert book — match on title + author + user
    const { data: existing } = await db
      .from('books')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', title)
      .eq('author', author)
      .limit(1)

    let bookId: string

    if (existing && existing.length > 0) {
      bookId = existing[0].id
    } else {
      const coverUrl = rwBook.cover_image_url ?? await fetchBookCover(title, author)
      const { data: newBook, error } = await db
        .from('books')
        .insert({
          user_id: user.id,
          title,
          author,
          cover_url: coverUrl,
          source: 'readwise',
        })
        .select('id')
        .single()

      if (error || !newBook) continue
      bookId = newBook.id
      booksImported++
    }

    // Skip highlights that already exist (match on text)
    const { data: existingHighlights } = await db
      .from('highlights')
      .select('text')
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    const existingTexts = new Set(((existingHighlights ?? []) as { text: string }[]).map(h => h.text))

    const newHighlights = highlights
      .filter(h => !existingTexts.has(h.text))
      .map(h => ({
        user_id: user.id,
        book_id: bookId,
        text: h.text,
        note: h.note ?? null,
        date_highlighted: h.highlighted_at ?? null,
        source: 'readwise',
      }))

    if (newHighlights.length > 0) {
      await db.from('highlights').insert(newHighlights)
      highlightsImported += newHighlights.length
    }
  }

  return NextResponse.json({ success: true, booksImported, highlightsImported })
}
