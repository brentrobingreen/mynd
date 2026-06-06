const READWISE_API = 'https://readwise.io/api/v2'

export interface ReadwiseHighlight {
  id: number
  text: string
  note: string | null
  book_id: number
  highlighted_at: string | null
  url: string | null
  book_title: string
  author: string
  category: string
  cover_image_url: string | null
  source_url: string | null
}

interface ReadwiseResponse {
  count: number
  next: string | null
  previous: string | null
  results: ReadwiseHighlight[]
}

export async function fetchAllHighlights(token: string): Promise<ReadwiseHighlight[]> {
  const highlights: ReadwiseHighlight[] = []
  let url: string | null = `${READWISE_API}/highlights/?page_size=1000`

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid Readwise token')
      throw new Error(`Readwise API error: ${res.status}`)
    }

    const data: ReadwiseResponse = await res.json()
    highlights.push(...data.results)
    url = data.next
  }

  return highlights
}

export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${READWISE_API}/auth/`, {
    headers: { Authorization: `Token ${token}` },
  })
  return res.status === 204
}

// Readwise uses token-based auth, not OAuth — users paste their token directly.
// The "OAuth-like" flow in the docs redirects to readwise.io which issues a token.
export function getReadwiseAuthUrl(redirectUri: string): string {
  return `https://readwise.io/api/v2/auth/?response_type=token&client_id=${process.env.READWISE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`
}
