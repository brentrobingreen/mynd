import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  async function upgradeUser(customerId: string, tier: 'premium' | 'lifetime') {
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .limit(1)

    if (users && users.length > 0) {
      await db.from('users').update({ subscription_tier: tier }).eq('id', users[0].id)
    }
  }

  async function downgradeUser(customerId: string) {
    const { data: users } = await db
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .limit(1)

    if (users && users.length > 0) {
      await db.from('users').update({ subscription_tier: 'free' }).eq('id', users[0].id)
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (!session.customer) break
      const isLifetime = session.mode === 'payment'
      await upgradeUser(session.customer as string, isLifetime ? 'lifetime' : 'premium')
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await downgradeUser(sub.customer as string)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      if (sub.status === 'active') {
        await upgradeUser(sub.customer as string, 'premium')
      } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status)) {
        await downgradeUser(sub.customer as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
