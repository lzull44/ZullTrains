# Taking ZullCoaching live

This guide walks you through standing up the real product on the internet.
Free to start (Supabase, Vercel, Stripe), runs at a domain you control.

---

## What's wired

The app is **dual-mode**:

- **Demo mode** (default — the single-file `ZullCoaching.html` you double-click)
  uses `localStorage` for everything. No accounts. No real money. Perfect for
  pitching and clicking around.
- **Live mode** (when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set)
  switches over automatically. No code change needed.

### Live-mode coverage

| Surface | Status |
|---|---|
| Coach + client signup, signin, signout via Supabase Auth | ✅ wired |
| Client signup form persists intake to `client_profiles` | ✅ wired |
| Stripe Checkout redirect from the Packages page | ✅ wired |
| Stripe webhook upserts the active subscription | ✅ wired |
| Coach Dashboard, Clients, Leads, Messages — hydrate from DB | ✅ wired |
| Client Home, My Plan, Messages, Packages — hydrate from DB | ✅ wired |
| `/apply` lead form writes to `public.leads` (anon insert allowed) | ✅ wired |
| 1:1 messaging persists to `public.messages` | ✅ wired |
| Daily logs / workout logs / meal logs sync | ⏳ localStorage only |
| Progress photo uploads to Supabase Storage | ⏳ localStorage only |
| PR records, testimonials, agreements sync | ⏳ localStorage only |

The pending items work fine per-device today — they just won't sync across
devices yet. They're the natural wave 2.

---

## 1 · Host it (Vercel) — 10 minutes

1. Push this folder to GitHub (already done if you're reading this here).
2. Go to https://vercel.com → **New Project** → import the repo.
3. Set **Root Directory** to `zullcoaching`, Framework preset **Vite**.
4. **Deploy.** You'll get `your-app.vercel.app`. Add a custom domain under
   Project → Settings → Domains.

Vercel auto-detects the serverless functions in `api/` (`create-checkout-session.js`
and `stripe-webhook.js`) and ships them as functions.

## 2 · Supabase (accounts + database) — 15 minutes

1. Create a project at https://supabase.com.
2. **SQL Editor** → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Creates every table, RLS policy, the leads table, and the trigger that
   creates a profile row whenever someone signs up.
3. **Storage** → New bucket → name `progress-photos` → make it **private**.
4. **Authentication → Providers → Email** → enable. For testing, turn off
   "Confirm email" so signup doesn't require inbox roundtrip.
5. Make yourself the coach. Sign up once in the live app, then in **SQL Editor**:
   ```sql
   update public.profiles set role = 'coach' where email = 'you@email.com';
   ```
6. Settings → API → copy **Project URL** and **anon public** key into Vercel env.

## 3 · Stripe (real payments) — 15 minutes

1. Create products at https://dashboard.stripe.com/products. For each one,
   create a price and copy its `price_xxx` ID:
   - **Monthly Coaching** — $350 / month (recurring)
   - **12-Week Transformation** — $599 (one-time)
   - **6-Month Coaching** — $1,149 (one-time)
   - **2-Week Trial** — $99 (one-time)
2. Developers → API keys → copy both **Publishable** and **Secret**.
3. Developers → Webhooks → **Add endpoint** at
   `https://YOUR-DOMAIN/api/stripe-webhook`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the **signing secret** (`whsec_...`).

## 4 · Environment variables — paste once

Copy [`.env.example`](.env.example) to `.env` locally for dev. In **Vercel →
Settings → Environment Variables** add the same keys for Production:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# server-only (no VITE_ prefix — these never reach the browser)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_12WK=price_...
STRIPE_PRICE_6MO=price_...
STRIPE_PRICE_TRIAL=price_...
```

Redeploy after setting them. The app now boots in live mode.

---

## 5 · Sanity check

1. Visit your domain, click **Get started** on a package — you should redirect
   to a real Stripe Checkout page.
2. Pay with Stripe's test card `4242 4242 4242 4242` (any future expiry / CVC).
3. After success → back in the portal, **Packages** shows the active plan and
   your `subscriptions` row in Supabase has `status = 'active'`.
4. From a fresh browser, sign up as a new client at `/login` → Client →
   Create your profile. Check that the `profiles` and `client_profiles` rows
   appear in Supabase.
5. Send a message — it appears in `public.messages`. Open it in a different
   browser (still signed in as you) and confirm it persists.

---

## Cost to start

Supabase free tier, Stripe (only takes % per real charge), Vercel hobby tier
are all **$0/month** until you have meaningful traffic or revenue. You can be
live this week.

## Wave 2 (when you're ready)

The pending items above (logs, photos, PRs, testimonials, agreements) need:

- An effect that fetches each table for the current user, similar to the
  existing `fetchAllForCoach` / `fetchForClient` in `src/lib/supabaseClient.js`.
- Photo uploads should call `supabase.storage.from('progress-photos').upload(...)`
  with the file, then store the `storage_path` in the `progress_photos` row.

Until those land, every device the client logs in from gets a fresh local
copy of their logs/photos/PRs — but their **identity, plan, messages, and
payment** are real and cross-device.
