'use client'

import { useState } from 'react'
import { RefreshCw, ExternalLink, CheckCircle, Loader2 } from 'lucide-react'

interface ReadwiseSectionProps {
  connected: boolean
}

export default function ReadwiseSection({ connected: initialConnected }: ReadwiseSectionProps) {
  const [connected, setConnected] = useState(initialConnected)
  const [showInput, setShowInput] = useState(false)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/readwise/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (res.ok) {
      setConnected(true)
      setShowInput(false)
      setToken('')
    } else {
      setError(data.error ?? 'Connection failed')
    }
    setLoading(false)
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-[var(--foreground)] mb-3 uppercase tracking-wider">Integrations</h2>
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--muted-bg)] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <div>
              <p className="text-sm font-medium">Readwise</p>
              <p className="text-xs text-[var(--muted)]">
                {connected ? 'Connected — sync highlights from your Library page' : 'Pull highlights from Kindle, web, Apple Books'}
              </p>
            </div>
          </div>
          {connected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <button
              onClick={() => setShowInput(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] rounded-lg text-xs hover:bg-[var(--muted-bg)] transition-colors"
            >
              Connect
            </button>
          )}
        </div>

        {!connected && showInput && (
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
            <p className="text-xs text-[var(--muted)]">
              Get your access token at{' '}
              <a href="https://readwise.io/access_token" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5">
                readwise.io/access_token <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste your access token…"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={connect}
              disabled={loading || !token.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-dark)] disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
