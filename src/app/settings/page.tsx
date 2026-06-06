import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UpgradeSection from './UpgradeSection'
import ReadwiseSection from './ReadwiseSection'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: profile } = await db.from('users').select('name, subscription_tier, readwise_token').eq('id', user.id).single()

  const params = await searchParams

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-literary text-3xl text-[var(--foreground)] mb-8">Settings</h1>

      {params.upgrade === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          Welcome to Premium! Your brain is now unlimited.
        </div>
      )}

      {params.readwise === 'connected' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          Readwise connected! Head to your library to sync your highlights.
        </div>
      )}

      {params.readwise === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          Could not connect Readwise. Please try again.
        </div>
      )}

      <div className="space-y-8">
        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-[var(--foreground)] mb-3 uppercase tracking-wider">Account</h2>
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{profile?.name ?? 'Reader'}</p>
                <p className="text-xs text-[var(--muted)]">{user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile?.subscription_tier === 'free'
                  ? 'bg-[var(--muted-bg)] text-[var(--muted)]'
                  : 'bg-[var(--accent)] text-white'
              }`}>
                {profile?.subscription_tier === 'lifetime' ? 'Lifetime' : profile?.subscription_tier === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>
        </section>

        {/* Readwise */}
        <ReadwiseSection connected={!!profile?.readwise_token} />

        {/* Upgrade */}
        {profile?.subscription_tier === 'free' && (
          <UpgradeSection />
        )}
      </div>
    </div>
  )
}
