// Stripe webhook -> keeps the `subscriptions` table in sync with Stripe.
// Configure the endpoint in Stripe (Developers -> Webhooks) pointing at
// /api/stripe-webhook and subscribe to: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.
//
// IMPORTANT: this needs the RAW request body to verify the signature.
// On Vercel, disable body parsing with the `config` export below.
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const config = { api: { bodyParser: false } }

function readRaw(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(Buffer.from(data)))
  })
}

async function upsert(userId, fields) {
  if (!userId) return
  await supabase.from('subscriptions').upsert({ user_id: userId, updated_at: new Date().toISOString(), ...fields })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const sig = req.headers['stripe-signature']
  let event
  try {
    const raw = await readRaw(req)
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('webhook signature failed', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object
      await upsert(s.client_reference_id || s.metadata?.userId, {
        stripe_customer_id: s.customer,
        stripe_subscription_id: s.subscription || null,
        package_id: s.metadata?.packageId,
        status: 'active',
      })
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      await upsert(sub.metadata?.userId, {
        stripe_subscription_id: sub.id,
        status: event.type.endsWith('deleted') ? 'cancelled' : sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
    }
    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('webhook handler error', err)
    return res.status(500).json({ error: 'handler failed' })
  }
}
