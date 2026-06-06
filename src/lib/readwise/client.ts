const READWISE_API = 'https://readwise.io/api/v2'

// Books come from the /books/ endpoint
export interface ReadwiseBook {
  id: number
  title: string
  author: string | null
  category: string
  cover_image_url: string | null
  source_url: string | null
  num_highlights: number
  last_highlight_at: string | null
  updated: string
}

// Highlights come from the /highlights/ endpoint — book_title/author are NOT included here
export interface ReadwiseHighlight {
  id: number
  text: string
  note: string | null
  book_id: number
  highlighted_at: string | null
  url: string | null
  location: number | null
  location_type: string | null
  color: string | null
}

// Books we automatically skip (Readwise adds these to everyone's library)
const EXCLUDED_AUTHORS = ['readwise team', 'readwise']
const EXCLUDED_TITLES = ['how to use readwise']

export function isExcludedBook(title: string, author: string | null): boolean {
  const t = title.toLowerCase().trim()
  const a = (author ?? '').toLowerCase().trim()
  return EXCLUDED_AUTHORS.includes(a) || EXCLUDED_TITLES.includes(t)
}

async function fetchPaginated<T>(startUrl: string, token: string): Promise<T[]> {
  const items: T[] = []
  let nextUrl: string | null = startUrl

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Token ${token}` },
    })
    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid Readwise token')
      throw new Error(`Readwise API error: ${response.status}`)
    }
    const page = await response.json() as { results: T[]; next: string | null }
    items.push(...page.results)
    nextUrl = page.next ?? null
  }

  return items
}

export async function fetchAllBooks(token: string): Promise<ReadwiseBook[]> {
  return fetchPaginated<ReadwiseBook>(
    `${READWISE_API}/books/?page_size=1000`,
    token
  )
}

export async function fetchAllHighlights(token: string): Promise<ReadwiseHighlight[]> {
  return fetchPaginated<ReadwiseHighlight>(
    `${READWISE_API}/highlights/?page_size=1000`,
    token
  )
}

export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${READWISE_API}/auth/`, {
    headers: { Authorization: `Token ${token}` },
  })
  return res.status === 204
}
