import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Dumbbell,
  Salad,
  MessageSquare,
  LineChart,
  Instagram,
  Sun,
  Moon,
} from 'lucide-react'
import { Button, Card, Badge } from '../components/ui/index.jsx'
import { LogoMark } from '../components/layout/Logo.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { COACH, PACKAGES } from '../data/coach.js'
import zullLogo from '../assets/zull-logo.png'
import coachAvatar from '../assets/coach-avatar.jpg'

// Reveal-on-mount helpers
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

// Honest "what you get" strip — describes the offer, not invented social proof.
const STATS = [
  { value: '1:1', label: 'Personal coaching' },
  { value: 'Weekly', label: 'Check-ins & adjustments' },
  { value: '100%', label: 'Custom plans' },
  { value: 'Founding', label: 'Client spots open now' },
]

const FEATURES = [
  {
    icon: Salad,
    title: 'Custom macro & meal plans',
    copy: 'Targets built around your body, goals, and the food you actually like to eat.',
  },
  {
    icon: Dumbbell,
    title: 'AI workout builder',
    copy: 'Periodized programming that adapts to your equipment, schedule, and weekly progress.',
  },
  {
    icon: LineChart,
    title: 'Weekly check-ins & tracking',
    copy: 'Photos, weight, and lifts reviewed every week so nothing stalls out.',
  },
  {
    icon: MessageSquare,
    title: 'Direct chat with your coach',
    copy: 'Questions, form checks, and accountability — straight to Coach Zull.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const goApply = () => navigate('/apply')
  const goCalc = () => navigate('/calculator')
  const go = () => navigate('/login')

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0d10] dark:text-gray-100">
      {/* ---- Sticky nav ---- */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-white/70 backdrop-blur-md dark:bg-[#0b0d10]/70">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
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
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={go}>
              Sign in
            </Button>
            <Button variant="primary" size="sm" onClick={go}>
              Get started
            </Button>
          </div>
        </nav>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-[#0b0d10] text-white">
        {/* grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
          }}
        />
        {/* animated glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]"
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.12, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-28 text-center sm:py-36"
        >
          <motion.img
            variants={fadeUp}
            src={zullLogo}
            alt="ZullCoaching"
            className="mb-8 h-16 w-auto sm:h-20"
          />
          <motion.div variants={fadeUp}>
            <Badge className="mb-6 bg-white/10 text-white/80">
              STRONGER. HEALTHIER. BETTER YOU.
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          >
            Coaching that gets you stronger, healthier, better.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-base text-white/60 sm:text-lg"
          >
            Premium 1:1 online coaching — custom nutrition, intelligent training, and a coach in
            your corner every single week.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={goApply}
              className="w-full bg-white text-gray-900 hover:bg-gray-200 sm:w-auto"
            >
              Book a free 15-min consult <ArrowRight size={18} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={goCalc}
              className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto"
            >
              Try the free macro calculator
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ---- Stats strip ---- */}
      <section className="border-b border-gray-100 bg-white dark:border-white/5 dark:bg-[#0b0d10]">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-12 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- Features ---- */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to transform
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            A complete coaching system — not a generic PDF. Built around you and adjusted every
            single week.
          </p>
        </motion.div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card hover className="h-full p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {f.copy}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- Meet your coach ---- */}
      <section className="border-y border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-[#0e1116]">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-24 md:grid-cols-2"
        >
          <motion.div variants={fadeUp} className="order-1">
            <div className="relative mx-auto max-w-sm">
              <img
                src={coachAvatar}
                alt={COACH.name}
                className="aspect-[4/5] w-full rounded-3xl border border-gray-100 object-cover shadow-lift dark:border-white/10"
              />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="order-2">
            <Badge className="mb-4 bg-gray-900/5 text-gray-600 dark:bg-white/10 dark:text-gray-300">
              MEET YOUR COACH
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{COACH.name}</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{COACH.bio}</p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              I'm taking on a small group of founding clients right now — coached personally by me,
              never handed off. If you're ready to put in the work, I'll build the plan and keep you
              accountable every week.
            </p>
            <a
              href={COACH.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-white dark:border-white/10 dark:hover:bg-white/5"
            >
              <Instagram size={18} />@{COACH.handle}
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ---- Packages ---- */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose your path</h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Flexible coaching options for every goal and budget. Cancel or switch anytime.
          </p>
        </motion.div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PACKAGES.map((pkg) => (
            <motion.div key={pkg.id} variants={fadeUp} className="h-full">
              <Card
                className={`flex h-full flex-col p-7 ${
                  pkg.featured
                    ? 'border-gray-900 ring-1 ring-gray-900 dark:border-white dark:ring-white'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">{pkg.name}</h3>
                  {pkg.featured && (
                    <Badge className="bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight">${pkg.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {pkg.cadence === 'trial' ? `/ ${pkg.trialDays || 14}-day trial` : pkg.cadence}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {pkg.blurb}
                </p>
                <ul className="mt-6 space-y-3">
                  {pkg.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm">
                      <Check size={18} className="mt-0.5 shrink-0 text-gray-900 dark:text-white" />
                      <span className="text-gray-600 dark:text-gray-300">{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={pkg.featured ? 'primary' : 'outline'}
                  className="mt-8 w-full"
                  onClick={goApply}
                >
                  Get started <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- Final CTA band ---- */}
      <section className="relative overflow-hidden bg-[#0b0d10] text-white">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[120px]"
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative mx-auto max-w-3xl px-5 py-24 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Ready to start? Apply for coaching.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-white/60">
            I keep my roster small so every client gets real 1:1 attention. Apply and let's see if
            we're the right fit.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={goApply}
            className="mt-8 bg-white text-gray-900 hover:bg-gray-200"
          >
            Apply for coaching <ArrowRight size={18} />
          </Button>
        </motion.div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 bg-white dark:border-white/5 dark:bg-[#0b0d10]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Built by ZullCoaching · © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/legal')}
              className="text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Policies
            </button>
            <a
              href={COACH.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Instagram size={16} />@{COACH.handle}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
