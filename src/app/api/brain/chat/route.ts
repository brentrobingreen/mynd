import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamBrainResponse } from '@/lib/ai/rag'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { question, conversationId, brainId } = await request.json()
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get user name for personalised prompt
  const { data: profile } = await db.from('users').select('name').eq('id', user.id).single()
  const userName = profile?.name ?? user.email?.split('@')[0] ?? 'Reader'

  // Get brain's book subset (if using a specific brain)
  let bookIds: string[] | undefined
  if (brainId) {
    const { data: brain } = await db.from('brains').select('book_ids').eq('id', brainId).eq('user_id', user.id).single()
    if (brain?.book_ids?.length > 0) bookIds = brain.book_ids
  }

  // Ensure conversation exists
  let convId = conversationId
  if (!convId && brainId) {
    const { data: conv } = await db
      .from('conversations')
      .insert({ user_id: user.id, brain_id: brainId })
      .select('id')
      .single()
    convId = conv?.id
  }

  // Stream the response
  const encoder = new TextEncoder()
  let fullResponse = ''
  let sourceHighlights: unknown[] = []

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamBrainResponse(user.id, userName, question, bookIds)) {
          if (chunk.type === 'highlight') {
            sourceHighlights = chunk.data as unknown[]
            const event = `data: ${JSON.stringify({ type: 'highlights', highlights: chunk.data })}\n\n`
            controller.enqueue(encoder.encode(event))
          } else if (chunk.type === 'text') {
            fullResponse += chunk.data
            const event = `data: ${JSON.stringify({ type: 'text', text: chunk.data })}\n\n`
            controller.enqueue(encoder.encode(event))
          } else if (chunk.type === 'done') {
            // Save to DB
            if (convId) {
              await db.from('messages').insert([
                { conversation_id: convId, role: 'user', content: question, source_highlights: [] },
                { conversation_id: convId, role: 'assistant', content: fullResponse, source_highlights: sourceHighlights },
              ])
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
