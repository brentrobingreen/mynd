import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAllHighlights } from '@/lib/readwise/client'
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

  const highlights = await fetchAllHighlights(profile.readwise_token)

  // Group by book_id from Readwise
  const bookMap = new Map<number, { title: string; author: string; cover: string | null; highlights: typeof highlights }>()
  for (const h of highlights) {
    if (!bookMap.has(h.book_id)) {
      bookMap.set(h.book_id, { title: h.book_title, author: h.author, cover: h.cover_image_url, highlights: [] })
    }
    bookMap.get(h.book_id)!.highlights.push(h)
  }

  let booksImported = 0
  let highlightsImported = 0

  for (const [, group] of bookMap) {
    const { data: existing } = await db
      .from('books')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', group.title)
      .eq('author', group.author)
      .limit(1)

    let bookId: string

    if (existing && existing.length > 0) {
      bookId = existing[0].id
    } else {
      const coverUrl = group.cover ?? await fetchBookCover(group.title, group.author)
      const { data: newBook, error } = await db
        .from('books')
        .insert({ user_id: user.id, title: group.title, author: group.author, cover_url: coverUrl, source: 'readwise' })
        .select('id')
        .single()

      if (error || !newBook) continue
      bookId = newBook.id
      booksImported++
    }

    const { data: existingHighlights } = await db
      .from('highlights')
      .select('text')
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    const existingTexts = new Set(((existingHighlights ?? []) as { text: string }[]).map((h: { text: string }) => h.text))

    const newHighlights = group.highlights
      .filter(h => h.text && !existingTexts.has(h.text))
      .map(h => ({
        user_id: user.id,
        book_id: bookId,
        text: h.text,
        note: h.note,
        date_highlighted: h.highlighted_at,
        source: 'readwise',
      }))

    if (newHighlights.length > 0) {
      await db.from('highlights').insert(newHighlights)
      highlightsImported += newHighlights.length
    }
  }

  return NextResponse.json({ success: true, booksImported, highlightsImported })
}
