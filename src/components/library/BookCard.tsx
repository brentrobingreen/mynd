import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Star } from 'lucide-react'
import type { Book } from '@/types'
import { cn } from '@/lib/utils'

interface BookCardProps {
  book: Book & { highlight_count: number }
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/library/${book.id}`}
      className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md hover:border-[var(--accent)] transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-[var(--muted-bg)] overflow-hidden">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[var(--muted)]" />
          </div>
        )}
        {book.is_core && (
          <div className="absolute top-2 right-2 bg-[var(--accent)] text-white rounded-full p-1">
            <Star className="w-3 h-3 fill-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-literary text-sm font-medium leading-snug line-clamp-2 text-[var(--foreground)] mb-0.5">
          {book.title}
        </h3>
        <p className="text-xs text-[var(--muted)] line-clamp-1 mb-2">{book.author}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">
            {book.highlight_count} {book.highlight_count === 1 ? 'highlight' : 'highlights'}
          </span>
          {/* Resonance bar */}
          <div className="w-12 h-1.5 bg-[var(--muted-bg)] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', book.is_core ? 'bg-[var(--accent)]' : 'bg-[var(--accent-green)]')}
              style={{ width: `${Math.min(book.resonance_score * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
