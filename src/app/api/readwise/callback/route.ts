import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateToken } from '@/lib/readwise/client'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${origin}/settings?readwise=error&reason=no_token`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  const valid = await validateToken(token)
  if (!valid) {
    return NextResponse.redirect(`${origin}/settings?readwise=error&reason=invalid_token`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('users').update({ readwise_token: token }).eq('id', user.id)

  return NextResponse.redirect(`${origin}/settings?readwise=connected`)
}
