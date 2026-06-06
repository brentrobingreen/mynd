const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1'

interface GoogleBooksVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    description?: string
    publishedDate?: string
    pageCount?: number
    categories?: string[]
  }
}

interface GoogleBooksResponse {
  totalItems: number
  items?: GoogleBooksVolume[]
}

export async function searchGoogleBooks(query: string): Promise<GoogleBooksVolume[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: '5',
    ...(process.env.GOOGLE_BOOKS_API_KEY && { key: process.env.GOOGLE_BOOKS_API_KEY }),
  })

  try {
    const res = await fetch(`${GOOGLE_BOOKS_BASE}/volumes?${params}`, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data: GoogleBooksResponse = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

export async function fetchBookCover(title: string, author: string): Promise<string | null> {
  const results = await searchGoogleBooks(`intitle:${title} inauthor:${author}`)

  for (const vol of results) {
    const url = vol.volumeInfo.imageLinks?.thumbnail ?? vol.volumeInfo.imageLinks?.smallThumbnail
    if (url) {
      // Force HTTPS and higher resolution
      return url.replace('http://', 'https://').replace('&zoom=1', '&zoom=2')
    }
  }
  return null
}
