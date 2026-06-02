import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Instagram,
  ShieldCheck,
  MessageSquare,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'
import { Button, Card } from '../components/ui/index.jsx'
import { LogoMark } from '../components/layout/Logo.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { COACH } from '../data/coach.js'

// Reveal helpers — match Landing.jsx vibe so the brand feels cohesive.
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

// What you'll actually get on the call — honest copy for a launching coach.
const CALL_EXPECTATIONS = [
  "We'll talk about your goals, training history, and weekly schedule.",
  "I'll ask about any injuries, allergies, or equipment limitations.",
  "I'll tell you straight whether coaching is right for you.",
  "You'll walk away with at least one actionable next step — even if we don't work together.",
]

const FAQS = [
  {
    q: 'Is this really free?',
    a: 'Yes. Discovery calls are free with no obligation. You pay only if we decide to work together.',
  },
  {
    q: "What if I'm a beginner?",
    a: "Beginners welcome. I'll meet you where you are — no judgement, just a clear plan forward.",
  },
  {
    q: 'How fast will I hear back?',
    a: 'Within 24 hours. I read every application personally and reply by email or Instagram DM.',
  },
  {
    q: 'Do I need a gym?',
    a: 'No. Plans are built around the equipment you actually have — home, garage, hotel, or full gym.',
  },
]

export default function Apply() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { addLead } = useAppData()

  // Controlled form state. Keep flat — easier to read than a single object.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [goal, setGoal] = useState('Fat Loss')
  const [timeline, setTimeline] = useState('Within 30 days')
  const [preferredTime, setPreferredTime] = useState('Evenings')
  const [context, setContext] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    addLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      goal,
      timeline,
      preferredTime,
      context: context.trim(),
      source: 'landing',
    })
    setSubmitted(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Shared classes for native form controls — keep light/dark legible without yelling.
  const fieldBase =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/10'

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0d10] dark:text-gray-100">
      {/* ---- Sticky nav (mirrors Landing) ---- */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-white/70 backdrop-blur-md dark:bg-[#0b0d10]/70">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="text-[17px] font-extrabold tracking-tight">
              Zull<span className="font-medium text-gray-500 dark:text-gray-400">Coaching</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-xl text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft size={16} /> Back
            </Button>
          </div>
        </nav>
      </header>

      {/* ---- Hero ---- */}
      <section className="border-b border-gray-100 dark:border-white/5">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20"
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold tracking-wide text-gray-600 dark:border-white/10 dark:text-gray-300"
          >
            <Sparkles size={14} /> APPLY FOR COACHING
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          >
            Book a free 15-minute consult.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-base text-gray-600 dark:text-gray-400 sm:text-lg"
          >
            I'll review your goals, answer your questions, and tell you honestly whether coaching is
            the right fit. No commitment, no pressure.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <ShieldCheck size={14} /> Free
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <Check size={14} /> No card required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <Calendar size={14} /> 15 minutes
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ---- Two column: form + coach credibility ---- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT — form / success card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <Card className="p-6 sm:p-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                        Tell me about you
                      </h2>
                      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        Takes under 2 minutes. I'll reply within 24 hours to lock in your call.
                      </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Full name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Morgan"
                            className={fieldBase}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={fieldBase}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Phone <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 555-5555"
                          className={fieldBase}
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Primary goal
                          </label>
                          <select
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className={fieldBase}
                          >
                            <option>Fat Loss</option>
                            <option>Lean Bulk</option>
                            <option>Maintenance</option>
                            <option>Recomp</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Timeline
                          </label>
                          <select
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            className={fieldBase}
                          >
                            <option>Now</option>
                            <option>Within 30 days</option>
                            <option>Within 90 days</option>
                            <option>Just exploring</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Best time for a call
                          </label>
                          <select
                            value={preferredTime}
                            onChange={(e) => setPreferredTime(e.target.value)}
                            className={fieldBase}
                          >
                            <option>Mornings</option>
                            <option>Afternoons</option>
                            <option>Evenings</option>
                            <option>Weekends</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Tell me a bit about where you're at and what you're stuck on
                        </label>
                        <textarea
                          rows={4}
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="What's worked, what hasn't, what's getting in the way..."
                          className={`${fieldBase} resize-none`}
                        />
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <ShieldCheck size={13} /> I read every application personally.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        Send my application <ArrowRight size={16} />
                      </Button>
                    </form>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <Card className="p-8 text-center sm:p-10">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
                      className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    >
                      <Check size={32} strokeWidth={2.5} />
                    </motion.div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
                      Thanks — application received.
                    </h2>
                    <p className="mx-auto mt-4 max-w-md text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                      {COACH.calendlyUrl
                        ? "Pick a time below and we'll talk. No prep needed."
                        : `I'll reply within 24 hours. While you wait, follow @${COACH.handle} or grab a sample plan with the macro calculator.`}
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      {COACH.calendlyUrl && (
                        <a
                          href={COACH.calendlyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
                        >
                          <Calendar size={16} /> Pick a time now <ArrowRight size={16} />
                        </a>
                      )}
                      <a
                        href={COACH.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
                      >
                        <Instagram size={16} /> DM on Instagram
                      </a>
                      {!COACH.calendlyUrl && (
                        <Button variant="primary" onClick={() => navigate('/calculator')}>
                          Try the macro calculator <ArrowRight size={16} />
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT — coach credibility */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-2"
          >
            <Card className="p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <img
                  src={COACH.avatar}
                  alt={COACH.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-gray-200 dark:ring-white/10"
                />
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{COACH.name}</h3>
                  <a
                    href={COACH.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <Instagram size={14} />@{COACH.handle}
                  </a>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {COACH.bio}
              </p>

              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <MessageSquare size={14} /> What to expect on the call
                </div>
                <ul className="space-y-2.5">
                  {CALL_EXPECTATIONS.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-gray-900 dark:text-white"
                      />
                      <span className="text-gray-600 dark:text-gray-300">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ---- Honest FAQ ---- */}
      <section className="border-t border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-[#0e1116]">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-4xl px-5 py-20"
        >
          <motion.div variants={fadeUp} className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Straight answers to fair questions
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              No fine print, no upsells hiding in the footnotes.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map((item) => (
              <motion.div key={item.q} variants={fadeUp}>
                <Card className="h-full p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.q}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.a}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ---- Tiny footer ---- */}
      <footer className="border-t border-gray-100 bg-white dark:border-white/5 dark:bg-[#0b0d10]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-7 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Built by ZullCoaching · © {new Date().getFullYear()}
            </span>
          </div>
          <button
            onClick={() => navigate('/legal')}
            className="text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Policies
          </button>
        </div>
      </footer>
    </div>
  )
}
