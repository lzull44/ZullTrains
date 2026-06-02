// Vercel/Netlify-style serverless function: creates a Stripe Checkout Session.
// POST { packageId: 'monthly'|'12wk'|'macro', userId, email } -> { url }
// Deploy this with the app; the client calls it then redirects to `url`.
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE = {
  monthly: { id: process.env.STRIPE_PRICE_MONTHLY, mode: 'subscription' },
  '12wk': { id: process.env.STRIPE_PRICE_12WK, mode: 'payment' },
  '6mo': { id: process.env.STRIPE_PRICE_6MO, mode: 'payment' },
  trial: { id: process.env.STRIPE_PRICE_TRIAL, mode: 'payment' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { packageId, userId, email } = req.body || {}
    const plan = PRICE[packageId]
    if (!plan?.id) return res.status(400).json({ error: 'Unknown package' })

    const origin = req.headers.origin || `https://${req.headers.host}`
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      line_items: [{ price: plan.id, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      // pass the app user id through so the webhook can link the subscription
      client_reference_id: userId,
      metadata: { userId, packageId },
      success_url: `${origin}/#/packages?checkout=success`,
      cancel_url: `${origin}/#/packages?checkout=cancelled`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error', err)
    return res.status(500).json({ error: 'Could not create checkout session' })
  }
}
