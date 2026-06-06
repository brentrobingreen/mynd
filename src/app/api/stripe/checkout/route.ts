import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: profile } = await db.from('users').select('stripe_customer_id, email').eq('id', user.id).single()

  const stripe = getStripe()
  const { origin } = new URL(request.url)

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await db.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const isOneTime = priceId === process.env.STRIPE_LIFETIME_PRICE_ID

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: isOneTime ? 'payment' : 'subscription',
    success_url: `${origin}/settings?upgrade=success`,
    cancel_url: `${origin}/settings?upgrade=cancelled`,
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
