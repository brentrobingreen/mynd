import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseKindleClippings, groupByBook } from '@/lib/parsers/kindle'
import { fetchBookCover } from '@/lib/books/google-books'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()
  const parsed = parseKindleClippings(text)

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: 'No highlights found. Make sure this is a My Clippings.txt file.' },
      { status: 422 }
    )
  }

  const groups = groupByBook(parsed)
  let booksImported = 0
  let highlightsImported = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  for (const group of groups) {
    const { data: existingBooks } = await db
      .from('books')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', group.bookTitle)
      .eq('author', group.author)
      .limit(1)

    let bookId: string

    if (existingBooks && existingBooks.length > 0) {
      bookId = existingBooks[0].id as string
    } else {
      const coverUrl = await fetchBookCover(group.bookTitle, group.author)
      const { data: newBook, error } = await db
        .from('books')
        .insert({
          user_id: user.id,
          title: group.bookTitle,
          author: group.author,
          cover_url: coverUrl,
          source: 'kindle',
        })
        .select('id')
        .single()

      if (error || !newBook) continue
      bookId = (newBook as { id: string }).id
      booksImported++
    }

    const { data: existing } = await db
      .from('highlights')
      .select('text')
      .eq('book_id', bookId)
      .eq('user_id', user.id)

    const existingTexts = new Set(((existing ?? []) as { text: string }[]).map(h => h.text))

    const newHighlights = group.highlights
      .filter(h => !existingTexts.has(h.text))
      .map(h => ({
        user_id: user.id,
        book_id: bookId,
        text: h.text,
        location: h.location ? `Page ${h.page ?? ''} | Loc ${h.location}` : null,
        date_highlighted: h.dateHighlighted,
        source: 'kindle',
      }))

    if (newHighlights.length > 0) {
      await db.from('highlights').insert(newHighlights)
      highlightsImported += newHighlights.length
    }
  }

  return NextResponse.json({
    success: true,
    booksImported,
    highlightsImported,
    totalHighlightsParsed: parsed.length,
  })
}
