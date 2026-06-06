'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { PLANS, FREE_LIMITS } from '@/lib/stripe/client'

export default function UpgradeSection() {
  const [loading, setLoading] = useState<string | null>(null)

  async function startCheckout(priceId: string) {
    setLoading(priceId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(null)
  }

  const currentFeatures = [
    `${FREE_LIMITS.maxBrains} brain`,
    `Up to ${FREE_LIMITS.maxBooks} books`,
    `${FREE_LIMITS.maxQueriesPerMonth} AI queries/month`,
  ]

  return (
    <section>
      <h2 className="text-sm font-medium text-[var(--foreground)] mb-3 uppercase tracking-wider">Upgrade</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Free */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-sm font-medium mb-1">Free</p>
          <p className="text-2xl font-literary mb-4">$0</p>
          <ul className="space-y-2">
            {currentFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-[var(--muted)]">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--muted)]" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 py-2 px-4 border border-[var(--border)] rounded-lg text-xs text-center text-[var(--muted)]">
            Current plan
          </div>
        </div>

        {/* Premium */}
        <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-xl p-5 relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--accent)] text-white text-xs rounded-full">
            Popular
          </span>
          <p className="text-sm font-medium mb-1">{PLANS.premium_monthly.name}</p>
          <p className="text-2xl font-literary mb-4">$12.99<span className="text-sm text-[var(--muted)]">/mo</span></p>
          <ul className="space-y-2">
            {PLANS.premium_monthly.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--accent)]" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => startCheckout(PLANS.premium_monthly.priceId)}
            disabled={!!loading}
            className="mt-4 w-full py-2 px-4 bg-[var(--accent)] text-white rounded-lg text-xs font-medium hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === PLANS.premium_monthly.priceId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Get Premium
          </button>
        </div>

        {/* Lifetime */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-sm font-medium mb-1">{PLANS.lifetime.name}</p>
          <p className="text-2xl font-literary mb-4">$249<span className="text-sm text-[var(--muted)]"> once</span></p>
          <ul className="space-y-2">
            {PLANS.lifetime.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--accent-green)]" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => startCheckout(PLANS.lifetime.priceId)}
            disabled={!!loading}
            className="mt-4 w-full py-2 px-4 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted-bg)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === PLANS.lifetime.priceId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Get Lifetime Access
          </button>
        </div>
      </div>
    </section>
  )
}
