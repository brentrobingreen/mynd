import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/brain/ChatInterface'

export default async function BrainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get or create the user's default brain
  const { data: brains } = await db
    .from('brains')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)

  let brainId: string | undefined

  if (brains && brains.length > 0) {
    brainId = brains[0].id
  } else {
    // Check they have highlights first
    const { count } = await db
      .from('highlights')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count && count > 0) {
      const { data: newBrain } = await db
        .from('brains')
        .insert({ user_id: user.id, name: 'My Brain', description: 'All my highlights' })
        .select('id')
        .single()
      brainId = newBrain?.id
    }
  }

  if (!brainId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-6">
        <div className="max-w-sm">
          <p className="font-literary text-2xl text-[var(--foreground)] mb-3">No highlights yet</p>
          <p className="text-[var(--muted)] text-sm mb-6">
            Your brain is built from your reading. Add some books to get started.
          </p>
          <a
            href="/library"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent-dark)] transition-colors"
          >
            Go to Library
          </a>
        </div>
      </div>
    )
  }

  return <ChatInterface brainId={brainId} />
}
