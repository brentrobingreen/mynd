import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookCard from '@/components/library/BookCard'
import UploadWidget from '@/components/library/UploadWidget'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import type { Book } from '@/types'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: books } = await db
    .from('books')
    .select(`
      id, title, author, cover_url, source, is_core, resonance_score, tags, date_added,
      highlights(count)
    `)
    .eq('user_id', user.id)
    .order('resonance_score', { ascending: false })

  const booksWithCount = (books ?? []).map((b: Book & { highlights: [{ count: number }] }) => ({
    ...b,
    highlight_count: b.highlights?.[0]?.count ?? 0,
  }))

  const totalHighlights = booksWithCount.reduce((sum: number, b: Book & { highlight_count: number }) => sum + b.highlight_count, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-literary text-3xl text-[var(--foreground)] mb-1">Your Library</h1>
          <p className="text-[var(--muted)] text-sm">
            {booksWithCount.length} {booksWithCount.length === 1 ? 'book' : 'books'} · {totalHighlights.toLocaleString()} highlights
          </p>
        </div>
        <Link
          href="/brain"
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent-dark)] transition-colors"
        >
          <Brain className="w-4 h-4" />
          Open Brain
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Book grid */}
        <div className="lg:col-span-3">
          {booksWithCount.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted)]">
              <p className="font-literary text-xl mb-2">Your library is empty</p>
              <p className="text-sm">Upload your Kindle clippings or connect Readwise to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {booksWithCount.map((book: Book & { highlight_count: number }) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-[var(--foreground)] mb-3">Add books</h2>
            <UploadWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
