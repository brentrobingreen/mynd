import type { ParsedHighlight } from '@/types'

const SEPARATOR = '=========='

// "Atomic Habits (James Clear)" → { bookTitle: "Atomic Habits", author: "James Clear" }
function parseBookLine(line: string): { bookTitle: string; author: string } {
  const match = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (match) {
    return { bookTitle: match[1].trim(), author: match[2].trim() }
  }
  // Fallback: no parenthesised author
  return { bookTitle: line.trim(), author: 'Unknown' }
}

// "- Your Highlight on page 45 | Location 689-691 | Added on Monday, January 3, 2022 8:34:12 PM"
function parseMetaLine(line: string): { page: string | null; location: string | null; dateHighlighted: string | null } {
  const pageMatch = line.match(/page\s+([\d\w-]+)/i)
  const locationMatch = line.match(/Location\s+([\d-]+)/i)
  const dateMatch = line.match(/Added on\s+(.+)$/i)

  return {
    page: pageMatch ? pageMatch[1] : null,
    location: locationMatch ? locationMatch[1] : null,
    dateHighlighted: dateMatch ? parseDateString(dateMatch[1].trim()) : null,
  }
}

function parseDateString(raw: string): string | null {
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch {
    // ignore
  }
  return null
}

export function parseKindleClippings(content: string): ParsedHighlight[] {
  // Normalise line endings
  const normalised = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const entries = normalised.split(SEPARATOR)
  const highlights: ParsedHighlight[] = []

  for (const entry of entries) {
    const lines = entry
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length < 3) continue

    const { bookTitle, author } = parseBookLine(lines[0])
    const meta = parseMetaLine(lines[1])

    // Everything after the meta line is the highlight text
    const text = lines.slice(2).join(' ').trim()

    if (!text || text.length < 3) continue

    // Skip bookmarks and notes (not highlights)
    if (lines[1].toLowerCase().includes('your note') || lines[1].toLowerCase().includes('your bookmark')) continue

    highlights.push({
      bookTitle,
      author,
      page: meta.page,
      location: meta.location,
      dateHighlighted: meta.dateHighlighted,
      text,
    })
  }

  return highlights
}

// Group parsed highlights by book so we can upsert books then highlights
export type BookGroup = {
  bookTitle: string
  author: string
  highlights: Array<Omit<ParsedHighlight, 'bookTitle' | 'author'>>
}

export function groupByBook(highlights: ParsedHighlight[]): BookGroup[] {
  const map = new Map<string, BookGroup>()

  for (const h of highlights) {
    const key = `${h.bookTitle}||${h.author}`.toLowerCase()
    if (!map.has(key)) {
      map.set(key, { bookTitle: h.bookTitle, author: h.author, highlights: [] })
    }
    map.get(key)!.highlights.push({
      page: h.page,
      location: h.location,
      dateHighlighted: h.dateHighlighted,
      text: h.text,
    })
  }

  return Array.from(map.values())
}
