'use client'

import { useState, useRef } from 'react'
import { Upload, RefreshCw, Loader2, ExternalLink, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UploadWidgetProps {
  readwiseConnected: boolean
}

export default function UploadWidget({ readwiseConnected }: UploadWidgetProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [token, setToken] = useState('')
  const [connected, setConnected] = useState(readwiseConnected)
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function connectReadwise() {
    if (!token.trim()) return
    setConnecting(true)
    setResult(null)

    const res = await fetch('/api/readwise/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()

    if (res.ok) {
      setConnected(true)
      setShowTokenInput(false)
      setToken('')
      setResult({ message: 'Readwise connected! Syncing your highlights now…', type: 'success' })
      // Auto-sync immediately after connecting
      const syncRes = await fetch('/api/readwise/sync', { method: 'POST' })
      const syncData = await syncRes.json()
      if (syncRes.ok) {
        setResult({ message: `Connected and synced ${syncData.highlightsImported} highlights from ${syncData.booksImported} books.`, type: 'success' })
        fetch('/api/highlights/embed', { method: 'POST' })
        router.refresh()
      }
    } else {
      setResult({ message: data.error ?? 'Connection failed', type: 'error' })
    }
    setConnecting(false)
  }

  async function syncReadwise() {
    setSyncing(true)
    setResult(null)
    const res = await fetch('/api/readwise/sync', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setResult({ message: `Synced ${data.highlightsImported} new highlights from Readwise.`, type: 'success' })
      fetch('/api/highlights/embed', { method: 'POST' })
      router.refresh()
    } else {
      setResult({ message: data.error ?? 'Sync failed', type: 'error' })
    }
    setSyncing(false)
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().includes('clippings') && !file.name.endsWith('.txt')) {
      setResult({ message: 'Please upload your Kindle My Clippings.txt file.', type: 'error' })
      return
    }
    setUploading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/highlights/kindle', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) {
      setResult({ message: `Imported ${data.highlightsImported} highlights from ${data.booksImported} new books.`, type: 'success' })
      fetch('/api/highlights/embed', { method: 'POST' })
      router.refresh()
    } else {
      setResult({ message: data.error ?? 'Upload failed', type: 'error' })
    }
    setUploading(false)
  }

  return (
    <div className="space-y-4">

      {/* ── Readwise ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Readwise</p>
            <p className="text-xs text-[var(--muted)]">Kindle, Apple Books, web highlights</p>
          </div>
          {connected
            ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            : null
          }
        </div>

        {connected ? (
          <button
            onClick={syncReadwise}
            disabled={syncing}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 border border-[var(--border)] rounded-lg text-xs hover:bg-[var(--muted-bg)] transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        ) : showTokenInput ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--muted)]">
              Get your token at{' '}
              <a href="https://readwise.io/access_token" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5">
                readwise.io/access_token <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste your access token…"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={connectReadwise}
                disabled={connecting || !token.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-dark)] disabled:opacity-50 transition-colors"
              >
                {connecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {connecting ? 'Connecting…' : 'Connect'}
              </button>
              <button
                onClick={() => { setShowTokenInput(false); setToken('') }}
                className="px-3 py-2 border border-[var(--border)] rounded-lg text-xs hover:bg-[var(--muted-bg)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowTokenInput(true)}
            className="mt-3 w-full py-2 px-3 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-dark)] transition-colors"
          >
            Connect Readwise
          </button>
        )}
      </div>

      {/* ── Kindle upload ── */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
        <p className="text-sm font-medium text-[var(--foreground)] mb-0.5">Kindle clippings</p>
        <p className="text-xs text-[var(--muted)] mb-3">Upload your My Clippings.txt file</p>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}
        >
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing…
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 text-[var(--muted)] mx-auto mb-1.5" />
              <p className="text-xs text-[var(--muted)]">Drop file or click to browse</p>
            </>
          )}
        </div>
      </div>

      {result && (
        <p className={`text-xs px-3 py-2 rounded-lg border ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
