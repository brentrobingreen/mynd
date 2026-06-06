'use client'

import { RefreshCw, Link2 } from 'lucide-react'

interface ReadwiseSectionProps {
  connected: boolean
}

export default function ReadwiseSection({ connected }: ReadwiseSectionProps) {
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
                {connected ? 'Connected — sync your highlights from the Library' : 'Pull highlights from Kindle, web, Apple Books'}
              </p>
            </div>
          </div>
          {connected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          ) : (
            <a
              href="/api/readwise/connect"
              className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] rounded-lg text-xs hover:bg-[var(--muted-bg)] transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
