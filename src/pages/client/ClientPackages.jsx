import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Star, Lock, ShieldCheck, Sparkles, ArrowRight, Instagram, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, Button, Modal, SectionHeader, PageTransition } from '../../components/ui/index.jsx'
import { COACH, PACKAGES } from '../../data/coach.js'
import { PARQ_QUESTIONS } from '../../data/legal.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { isLiveMode } from '../../lib/supabaseClient.js'

// Map our PACKAGES.id to the server-side packageId the checkout function expects.
const SERVER_PKG_ID = {
  'pkg-monthly': 'monthly',
  'pkg-12wk': '12wk',
  'pkg-6mo': '6mo',
  'pkg-trial': 'trial',
}

const REASSURANCE = [
  { icon: ShieldCheck, label: 'Cancel anytime', sub: 'No long-term lock-in' },
  { icon: Sparkles, label: 'Built around you', sub: 'Fully personalized plans' },
  { icon: Lock, label: 'Secure checkout', sub: 'Powered by Stripe' },
]

function priceLabel(pkg) {
  if (pkg.cadence === 'per month') return '/mo'
  if (pkg.cadence === 'trial') return `/ ${pkg.trialDays || 14}-day trial`
  return 'one-time'
}

export default function ClientPackages() {
  const { user } = useAuth()
  const { subscribe, getSubscription, cancelSubscription, getAgreement, acceptAgreement, getEarnedDiscount } = useAppData()
  const reward = getEarnedDiscount(user?.clientId)
  const discountedPrice = (pkg) => {
    if (!reward.percent || pkg.cadence === 'trial') return null
    return Math.round(pkg.price * (1 - reward.percent / 100))
  }
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const active = getSubscription(user?.clientId)
  const signed = getAgreement(user?.clientId)

  // PAR-Q answers (index -> true=yes) + agreement checkbox
  const [parq, setParq] = useState({})
  const [agreed, setAgreed] = useState(false)
  const flaggedCount = Object.values(parq).filter(Boolean).length

  const openCheckout = (pkg) => {
    setSelected(pkg)
    setDone(false)
    setParq({})
    setAgreed(Boolean(signed))
  }

  const [checkoutError, setCheckoutError] = useState(null)
  const confirmSubscribe = async () => {
    if (!selected || !agreed) return
    if (!signed) {
      const flags = PARQ_QUESTIONS.map((_, i) => parq[i]).map((v, i) => (v ? i : null)).filter((x) => x !== null)
      acceptAgreement(user.clientId, flags)
    }
    // Live mode: redirect to real Stripe Checkout. The webhook then upserts the
    // subscriptions row, which the client portal reads on next mount.
    if (isLiveMode) {
      try {
        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: SERVER_PKG_ID[selected.id] || selected.id,
            userId: user.clientId,
            email: user.email,
          }),
        })
        if (!res.ok) throw new Error('Could not start checkout')
        const { url, error } = await res.json()
        if (error || !url) throw new Error(error || 'No checkout URL')
        window.location.assign(url)
        return
      } catch (e) {
        setCheckoutError(e.message || 'Checkout failed')
        return
      }
    }
    // Demo mode: locally record the subscription.
    subscribe(user.clientId, selected)
    setDone(true)
  }
  const closeModal = () => {
    setSelected(null)
    setDone(false)
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeader
          title="Coaching Packages"
          subtitle="Choose the plan that fits your goals"
        />

        {active && (
          <Card className="flex flex-col items-start justify-between gap-3 border-accent-500/40 bg-accent-500/5 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-500/15 text-accent-600 dark:text-accent-300">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  You're on the {active.name} plan
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ${active.price}
                  {active.cadence === 'per month'
                    ? '/mo'
                    : active.cadence === 'trial'
                      ? ' trial'
                      : ' one-time'}
                  {' · '}
                  {active.trialEndsAt
                    ? `ends ${active.trialEndsAt}`
                    : `active since ${active.since}`}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => cancelSubscription(user.clientId)}>
              Cancel plan
            </Button>
          </Card>
        )}

        {/* Coach credibility card */}
        <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <img
            src={COACH.avatar}
            alt={COACH.name}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-accent-500/20"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{COACH.name}</h3>
              <span className="chip bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <ShieldCheck size={13} /> Verified coach
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">{COACH.bio}</p>
          </div>
          <a
            href={COACH.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-3 py-2 text-xs"
          >
            <Instagram size={16} /> @{COACH.handle}
          </a>
        </Card>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((pkg, i) => {
            const featured = !!pkg.featured
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
                className={featured ? 'md:-mt-3 md:mb-3' : ''}
              >
                <Card
                  hover
                  className={`relative flex h-full flex-col p-6 ${
                    featured
                      ? 'border-accent-500/60 ring-2 ring-accent-500/40 dark:border-accent-500/50'
                      : ''
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-accent-600 text-white shadow-sm shadow-accent-600/30">
                      <Star size={13} className="fill-current" /> Most popular
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{pkg.name}</h3>
                    <img
                      src={COACH.avatar}
                      alt={COACH.name}
                      className={`h-9 w-9 rounded-full object-cover ring-2 ${featured ? 'ring-accent-500/30' : 'ring-gray-200 dark:ring-white/10'}`}
                    />
                  </div>

                  <div className="mt-4 flex items-end gap-1.5">
                    {discountedPrice(pkg) != null ? (
                      <>
                        <span className="text-4xl font-bold tracking-tight text-amber-500">
                          ${discountedPrice(pkg)}
                        </span>
                        <span className="mb-1 text-sm text-gray-400 line-through">${pkg.price}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                        ${pkg.price}
                      </span>
                    )}
                    <span className="mb-1 text-sm text-gray-500 dark:text-gray-400">{priceLabel(pkg)}</span>
                  </div>
                  {discountedPrice(pkg) != null && (
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Loyalty −{reward.percent}% applied
                    </div>
                  )}

                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{pkg.blurb}</p>

                  <ul className="mt-5 space-y-2.5">
                    {pkg.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400">
                          <Check size={13} strokeWidth={3} />
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {featured && (
                    <a
                      href={COACH.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
                    >
                      <Instagram size={14} /> Follow @{COACH.handle}
                    </a>
                  )}

                  <div className="mt-6 flex-1" />

                  <Button
                    variant={featured ? 'primary' : 'outline'}
                    className="w-full"
                    onClick={() => openCheckout(pkg)}
                  >
                    {featured ? 'Get started' : 'Purchase'}
                    <ArrowRight size={16} />
                  </Button>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Reassurance strip */}
        <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {REASSURANCE.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <Icon size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Checkout modal */}
      <Modal open={!!selected} onClose={closeModal} title={done ? '' : 'Checkout'}>
        {selected && !done && (
          <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/5 dark:bg-white/5">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{selected.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selected.cadence === 'per month'
                    ? 'Billed monthly'
                    : selected.cadence === 'trial'
                      ? `One-time charge — ${selected.trialDays || 14} days of access`
                      : 'Billed once'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">${selected.price}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{priceLabel(selected)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-accent-500/20 bg-accent-500/5 px-4 py-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent-600 dark:text-accent-400" />
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                Demo checkout — no card is charged. At launch this connects to secure Stripe checkout
                (needs your Stripe keys). Confirming activates the plan in your portal now.
              </p>
            </div>

            {/* Health screening + agreement (required before payment) */}
            {signed ? (
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
                <Check size={14} className="text-accent-600 dark:text-accent-400" />
                Health screening &amp; agreement on file.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 p-4 dark:border-white/5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Health screening (PAR-Q)
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {PARQ_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <span className="text-xs leading-snug text-gray-600 dark:text-gray-300">{q}</span>
                      <div className="flex shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                        {[false, true].map((yes) => {
                          const sel = parq[i] === yes
                          return (
                            <button
                              key={String(yes)}
                              type="button"
                              onClick={() => setParq((p) => ({ ...p, [i]: yes }))}
                              className={`px-2.5 py-1 text-[11px] font-semibold ${
                                sel
                                  ? yes
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-accent-600 text-white dark:bg-white dark:text-gray-900'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {yes ? 'Yes' : 'No'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {flaggedCount > 0 && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    You flagged {flaggedCount}. Please consult your physician — Coach Zull will follow up
                    before training begins.
                  </div>
                )}
              </div>
            )}

            <label className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-accent-600 focus:ring-accent-500/40 dark:border-white/20 dark:bg-white/5"
              />
              <span>
                I confirm I've completed the health screening and agree to the{' '}
                <a href="#/legal" target="_blank" rel="noreferrer" className="font-semibold underline">
                  Coaching Agreement, Terms &amp; Privacy Policy
                </a>
                .
              </span>
            </label>

            <Button variant="primary" className="w-full" onClick={confirmSubscribe} disabled={!agreed}>
              <Lock size={16} /> Confirm &amp; activate · ${selected.price}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <Lock size={12} /> Encrypted &amp; secure · Powered by Stripe
            </div>

            <Button variant="ghost" className="w-full" onClick={closeModal}>
              Maybe later
            </Button>
          </div>
        )}

        {selected && done && (
          <div className="flex flex-col items-center py-2 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="grid h-14 w-14 place-items-center rounded-full bg-accent-500/15 text-accent-600 dark:text-accent-300"
            >
              <CheckCircle2 size={30} />
            </motion.div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">You're in! 🎉</h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              Your <span className="font-medium text-gray-700 dark:text-gray-200">{selected.name}</span> plan
              is active. Coach Zull will reach out shortly to dial in your plan.
            </p>
            <Button variant="primary" className="mt-5 w-full" onClick={closeModal}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  )
}
