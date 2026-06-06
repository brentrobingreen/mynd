'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, BookOpen, Loader2 } from 'lucide-react'
import type { RetrievedHighlight } from '@/lib/ai/rag'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  highlights?: RetrievedHighlight[]
  streaming?: boolean
}

interface ChatInterfaceProps {
  brainId?: string
}

const STARTERS = [
  "What should I focus on when I feel overwhelmed?",
  "How can I build better habits?",
  "What do my books say about dealing with fear?",
  "How should I think about making hard decisions?",
]

export default function ChatInterface({ brainId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return

    const userMsg: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }])
    setInput('')
    setLoading(true)

    let highlights: RetrievedHighlight[] = []
    let fullText = ''

    try {
      const res = await fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversationId, brainId }),
      })

      if (!res.ok) throw new Error('Failed to connect')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          const parsed = JSON.parse(data)

          if (parsed.type === 'highlights') {
            highlights = parsed.highlights
            setMessages(prev => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last.role === 'assistant') last.highlights = highlights
              return next
            })
          } else if (parsed.type === 'text') {
            fullText += parsed.text
            setMessages(prev => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last.role === 'assistant') last.content = fullText
              return next
            })
          } else if (parsed.conversationId) {
            setConversationId(parsed.conversationId)
          }
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last.role === 'assistant') last.content = 'Something went wrong. Please try again.'
        return next
      })
    }

    setMessages(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last.role === 'assistant') last.streaming = false
      return next
    })
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)]/10 mb-4">
                <BookOpen className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <h2 className="font-literary text-2xl text-[var(--foreground)] mb-2">Your Brain is ready</h2>
              <p className="text-[var(--muted)] text-sm max-w-sm mx-auto">
                Ask anything. Your brain will draw on your own highlighted wisdom to guide you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] hover:border-[var(--accent)] hover:shadow-sm transition-all font-literary leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('max-w-2xl mx-auto', msg.role === 'user' && 'flex justify-end')}>
            {msg.role === 'user' ? (
              <div className="bg-[var(--accent)] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%]">
                <p className="text-sm">{msg.content}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sources */}
                {msg.highlights && msg.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...new Map(msg.highlights.map(h => [h.book_title, h])).values()].map(h => (
                      <span
                        key={h.book_title}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--highlight)] text-[var(--foreground)] rounded-full text-xs font-medium"
                      >
                        <BookOpen className="w-3 h-3" />
                        {h.book_title}
                      </span>
                    ))}
                  </div>
                )}

                {/* Response */}
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-4">
                  {msg.content ? (
                    <p className="text-sm leading-relaxed font-literary whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.streaming ? (
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking…</span>
                    </div>
                  ) : null}
                </div>

                {/* Source passages */}
                {!msg.streaming && msg.highlights && msg.highlights.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-[var(--muted)] hover:text-[var(--foreground)] select-none list-none flex items-center gap-1.5 ml-1">
                      <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
                      View {msg.highlights.length} source {msg.highlights.length === 1 ? 'passage' : 'passages'}
                    </summary>
                    <div className="mt-3 space-y-2">
                      {msg.highlights.map((h, j) => (
                        <div key={j} className="border-l-2 border-[var(--highlight)] pl-4 py-1">
                          <p className="text-xs font-literary text-[var(--foreground)] leading-relaxed">"{h.text}"</p>
                          <p className="text-xs text-[var(--muted)] mt-1">— {h.book_title}, {h.author}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--card-bg)] px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your brain anything…"
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent font-literary leading-relaxed"
            style={{ maxHeight: '160px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-11 h-11 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-xs text-[var(--muted)] mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
