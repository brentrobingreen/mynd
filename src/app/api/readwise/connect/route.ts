import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReadwiseAuthUrl } from '@/lib/readwise/client'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/readwise/callback`
  return NextResponse.redirect(getReadwiseAuthUrl(redirectUri))
}
