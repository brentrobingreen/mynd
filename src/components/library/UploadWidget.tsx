'use client'

import { useState, useRef } from 'react'
import { Upload, RefreshCw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadWidget() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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
      // Trigger embedding in background
      fetch('/api/highlights/embed', { method: 'POST' })
      router.refresh()
    } else {
      setResult({ message: data.error ?? 'Upload failed', type: 'error' })
    }

    setUploading(false)
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

  return (
    <div className="space-y-3">
      {/* Kindle upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}
      >
        <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Importing highlights…
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-[var(--muted)] mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--foreground)]">Upload Kindle clippings</p>
            <p className="text-xs text-[var(--muted)] mt-1">Drop your My Clippings.txt file here</p>
          </>
        )}
      </div>

      {/* Readwise sync */}
      <button
        onClick={syncReadwise}
        disabled={syncing}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--muted-bg)] transition-colors disabled:opacity-50"
      >
        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {syncing ? 'Syncing Readwise…' : 'Sync Readwise'}
      </button>

      {result && (
        <p className={`text-sm px-4 py-2 rounded-lg border ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
