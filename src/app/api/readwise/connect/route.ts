import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateToken } from '@/lib/readwise/client'

// Accepts POST with { token } — saves the Readwise access token for the user
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { token } = await request.json()
  if (!token?.trim()) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const valid = await validateToken(token.trim())
  if (!valid) {
    return NextResponse.json({ error: 'Invalid token. Check your token at readwise.io/access_token and try again.' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('users').update({ readwise_token: token.trim() }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
