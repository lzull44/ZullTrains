import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Check, ChevronRight, Dumbbell, Salad, Activity, Sparkles,
  Moon, Sun, HeartPulse,
} from 'lucide-react'

import { Button, ProgressBar } from '../components/ui/index.jsx'
import { Logo } from '../components/layout/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const STEPS = ['Welcome', 'Focus', 'Plan', 'Review']

const FOCUS_OPTIONS = [
  { id: 'bodybuilding', label: 'Bodybuilding', icon: Dumbbell, desc: 'Hypertrophy & physique prep' },
  { id: 'fatloss', label: 'Fat Loss', icon: Activity, desc: 'Cutting & body recomposition' },
  { id: 'lifestyle', label: 'Lifestyle', icon: Salad, desc: 'Sustainable habits & wellness' },
  { id: 'strength', label: 'Strength', icon: HeartPulse, desc: 'Powerlifting & performance' },
]

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 0, cadence: 'free',
    tagline: 'Get your first clients online.',
    features: ['Up to 5 clients', 'Macro & meal builder', 'Weekly check-ins'],
  },
  {
    id: 'pro', name: 'Pro', price: 49, cadence: '/mo', popular: true,
    tagline: 'For growing coaching businesses.',
    features: ['Unlimited clients', 'Adherence scoring', 'Billing & packages', 'Priority support'],
  },
  {
    id: 'elite', name: 'Elite', price: 129, cadence: '/mo',
    tagline: 'Scale with automation & revenue tools.',
    features: ['Everything in Pro', 'Digital product upsells', 'Recipe ebook sales', 'White-label app'],
  },
]

const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export default function Onboarding() {
  const { login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [business, setBusiness] = useState('')
  const [coachName, setCoachName] = useState('')
  const [focus, setFocus] = useState([])
  const [plan, setPlan] = useState('pro')

  const toggleFocus = (id) =>
    setFocus((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const canAdvance =
    (step === 0 && business.trim() && coachName.trim()) ||
    (step === 1 && focus.length > 0) ||
    (step === 2 && plan) ||
    step === 3

  const go = (next) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const finish = () => {
    login()
    navigate('/')
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 dark:bg-[#0b0d10]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo size={36} showText />
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white/80 text-gray-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Stepper */}
      <div className="mx-auto w-full max-w-2xl px-6">
        <div className="mb-2 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? 'bg-accent-600 text-white'
                    : i === step
                      ? 'bg-accent-600 text-white ring-4 ring-accent-500/20'
                      : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  i <= step ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <ProgressBar value={step + 1} max={STEPS.length} height={6} />
      </div>

      {/* Step content */}
      <main className="flex flex-1 items-start justify-center px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {step === 0 && (
                <div className="card p-7 sm:p-9">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 dark:text-accent-400">
                    <Sparkles size={14} /> Welcome to ZullCoaching
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    Let's set up your coaching business
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Tell us a little about you — it takes under a minute.
                  </p>

                  <div className="mt-7 space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business name
                      </label>
                      <input
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        placeholder="e.g. Apex Performance Coaching"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your name
                      </label>
                      <input
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                        placeholder="e.g. Coach Zull"
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="card p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    What's your coaching focus?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Select all that apply — this tailors your client templates.
                  </p>

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {FOCUS_OPTIONS.map((o) => {
                      const active = focus.includes(o.id)
                      return (
                        <button
                          key={o.id}
                          onClick={() => toggleFocus(o.id)}
                          className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                            active
                              ? 'border-accent-500 bg-accent-500/5 ring-2 ring-accent-500/30'
                              : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20'
                          }`}
                        >
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                              active
                                ? 'bg-accent-600 text-white'
                                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                            }`}
                          >
                            <o.icon size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{o.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{o.desc}</div>
                          </div>
                          {active && (
                            <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-accent-600 text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="card p-7 sm:p-9">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    Choose your plan
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Start free, upgrade anytime. No card required for Starter.
                  </p>

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PLANS.map((p) => {
                      const active = plan === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPlan(p.id)}
                          className={`relative flex flex-col rounded-2xl border p-5 text-left transition-all ${
                            active
                              ? 'border-accent-500 bg-accent-500/5 ring-2 ring-accent-500/30'
                              : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20'
                          }`}
                        >
                          {p.popular && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Popular
                            </span>
                          )}
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
                          <div className="mt-1.5 flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {p.price === 0 ? 'Free' : `$${p.price}`}
                            </span>
                            {p.price !== 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">{p.cadence}</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{p.tagline}</p>
                          <ul className="mt-4 space-y-2">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <Check size={13} className="mt-0.5 shrink-0 text-accent-600 dark:text-accent-400" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {active && (
                            <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-accent-600 text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="card p-7 sm:p-9">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                    <Check size={24} />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    You're all set, {coachName || 'Coach'}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Review your setup and enter your dashboard.
                  </p>

                  <dl className="mt-7 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 dark:divide-white/5 dark:border-white/5">
                    <ReviewRow label="Business" value={business || '—'} />
                    <ReviewRow label="Coach" value={coachName || '—'} />
                    <ReviewRow
                      label="Focus"
                      value={
                        focus.length
                          ? focus.map((id) => FOCUS_OPTIONS.find((o) => o.id === id)?.label).join(', ')
                          : '—'
                      }
                    />
                    <ReviewRow
                      label="Plan"
                      value={PLANS.find((p) => p.id === plan)?.name || '—'}
                    />
                  </dl>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => go(step - 1)}
              className={step === 0 ? 'invisible' : ''}
            >
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={() => go(step + 1)} disabled={!canAdvance}>
                Continue
                <ChevronRight size={17} />
              </Button>
            ) : (
              <Button onClick={finish}>
                Enter ZullCoaching
                <ArrowRight size={17} />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  )
}
