import Anthropic from '@anthropic-ai/sdk'
import { embedText, embedBatch } from './embeddings'
import { queryHighlights } from './ingestion'

let claude: Anthropic | null = null

function getClaude(): Anthropic {
  if (!claude) {
    claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return claude
}

export interface RetrievedHighlight {
  id: string
  text: string
  book_title: string
  author: string
  relevance_score: number
}

export async function retrieveRelevantHighlights(
  userId: string,
  question: string,
  bookIds?: string[]
): Promise<RetrievedHighlight[]> {
  const questionEmbedding = await embedText(question)
  const matches = await queryHighlights(userId, questionEmbedding, bookIds, 15)

  return matches
    .filter(m => m.score > 0.75) // Only highly relevant passages
    .map(m => ({
      id: m.id,
      text: m.metadata.text ?? '',
      book_title: m.metadata.book_title ?? 'Unknown',
      author: m.metadata.author ?? 'Unknown',
      relevance_score: m.score,
    }))
}

function buildSystemPrompt(userName: string, highlights: RetrievedHighlight[]): string {
  const highlightBlock = highlights
    .map((h, i) => `[${i + 1}] "${h.text}" — ${h.book_title} by ${h.author}`)
    .join('\n\n')

  return `You are ${userName}'s personal wisdom guide — built entirely from their own book highlights. You exist to help them think through their life using the wisdom they've personally found meaningful.

You ONLY draw from the passages provided below. Never add general knowledge or advice not grounded in these specific highlights. If the highlights don't contain enough to answer well, say so honestly — and tell them which kinds of books might help.

Speak warmly and personally. You know this person through their reading choices. Reference specific books and authors naturally, as a knowledgeable friend would — not like a citation machine.

Always make clear which book each insight comes from. When you synthesise across multiple books, name them all.

THEIR RELEVANT HIGHLIGHTS:
${highlightBlock}

Remember: every insight must trace back to one of these passages. Be specific. Be warm. Be wise.`
}

export async function* streamBrainResponse(
  userId: string,
  userName: string,
  question: string,
  bookIds?: string[]
): AsyncGenerator<{ type: 'highlight' | 'text' | 'done'; data: RetrievedHighlight[] | string }> {
  const highlights = await retrieveRelevantHighlights(userId, question, bookIds)

  if (highlights.length === 0) {
    yield { type: 'text', data: "I don't have enough of your highlights on this topic yet. Try adding more books related to what you're asking about, then ask again." }
    yield { type: 'done', data: [] }
    return
  }

  // Send the highlights first so the UI can show them immediately
  yield { type: 'highlight', data: highlights }

  const systemPrompt = buildSystemPrompt(userName, highlights)

  const stream = getClaude().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield { type: 'text', data: chunk.delta.text }
    }
  }

  yield { type: 'done', data: [] }
}
