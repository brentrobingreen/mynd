import { getIndex, getUserNamespace } from '@/lib/pinecone/client'
import { embedBatch } from './embeddings'

interface HighlightForIngestion {
  id: string
  text: string
  bookTitle: string
  author: string
  bookId: string
  userId: string
  dateHighlighted: string | null
}

interface PineconeRecord {
  id: string
  values: number[]
  metadata: {
    book_title: string
    author: string
    book_id: string
    user_id: string
    text: string
    date_highlighted: string
  }
}

// Clean highlight text before embedding
function cleanHighlight(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E -ɏ]/g, '') // strip non-latin
    .trim()
}

export async function ingestHighlights(highlights: HighlightForIngestion[]): Promise<string[]> {
  if (highlights.length === 0) return []

  const cleaned = highlights.map(h => ({ ...h, text: cleanHighlight(h.text) })).filter(h => h.text.length > 10)

  const texts = cleaned.map(h => h.text)
  const embeddings = await embedBatch(texts)

  const index = getIndex()
  const embeddingIds: string[] = []

  // Pinecone upsert in batches of 100
  const BATCH = 100
  for (let i = 0; i < cleaned.length; i += BATCH) {
    const batch = cleaned.slice(i, i + BATCH)
    const batchEmbeddings = embeddings.slice(i, i + BATCH)

    const records: PineconeRecord[] = batch.map((h, j) => ({
      id: h.id,
      values: batchEmbeddings[j],
      metadata: {
        book_title: h.bookTitle,
        author: h.author,
        book_id: h.bookId,
        user_id: h.userId,
        text: h.text.slice(0, 512), // Pinecone metadata limit
        date_highlighted: h.dateHighlighted ?? '',
      },
    }))

    const namespace = getUserNamespace(cleaned[0].userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (index.namespace(namespace) as any).upsert({ records })

    embeddingIds.push(...batch.map(h => h.id))
  }

  return embeddingIds
}

export async function queryHighlights(
  userId: string,
  questionEmbedding: number[],
  bookIds?: string[],
  topK = 15
): Promise<Array<{ id: string; score: number; metadata: Record<string, string> }>> {
  const index = getIndex()
  const namespace = getUserNamespace(userId)

  const filter = bookIds && bookIds.length > 0
    ? { book_id: { $in: bookIds } }
    : undefined

  const result = await index.namespace(namespace).query({
    vector: questionEmbedding,
    topK,
    filter,
    includeMetadata: true,
  })

  return (result.matches ?? []).map(m => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: (m.metadata ?? {}) as Record<string, string>,
  }))
}
