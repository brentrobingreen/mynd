import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
    })
  }
  return stripe
}

export const PLANS = {
  premium_monthly: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    name: 'Premium',
    price: '$12.99/month',
    features: ['Unlimited books', 'Unlimited AI queries', 'Daily digest', 'Journaling', 'Multiple brains'],
  },
  lifetime: {
    priceId: process.env.STRIPE_LIFETIME_PRICE_ID!,
    name: 'Lifetime',
    price: '$249 once',
    features: ['Everything in Premium', 'Forever access', 'All future features'],
  },
} as const

// Free tier limits
export const FREE_LIMITS = {
  maxBooks: 5,
  maxQueriesPerMonth: 20,
  maxBrains: 1,
}
