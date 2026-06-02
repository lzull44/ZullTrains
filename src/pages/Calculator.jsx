import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calculator as CalculatorIcon,
  ArrowLeft,
  ArrowRight,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Check,
  Sun,
  Moon,
  Sparkles,
  AlertCircle,
  Repeat,
  CalendarClock,
  Plane,
  Soup,
  HeartPulse,
} from 'lucide-react'
import { Card, CardHeader, Button, Badge } from '../components/ui/index.jsx'
import { MacroRing } from '../components/ui/MacroRing.jsx'
import { LogoMark } from '../components/layout/Logo.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { estimateTargetsFromStats, MACRO_COLORS } from '../utils/macros.js'

// Reveal-on-mount helper (matches the Landing/Apply page feel).
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const ACTIVITY_OPTIONS = [
  { value: 'Low', label: 'Low — desk job, little exercise' },
  { value: 'Moderate', label: 'Moderate — 3-4 sessions / week' },
  { value: 'High', label: 'High — 5+ sessions / week' },
  { value: 'Athlete', label: 'Athlete — daily, intense training' },
]

const GOAL_OPTIONS = ['Fat Loss', 'Maintenance', 'Lean Bulk']

// --- Unit conversions ---
const KG_TO_LB = 2.20462
const CM_PER_IN = 2.54

const round1 = (n) => Math.round(n * 10) / 10

export default function Calculator() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const { addLead } = useAppData()

  // --- Core stats (always stored in metric internally) ---
  const [sex, setSex] = useState('male')
  const [age, setAge] = useState(30)
  const [heightCm, setHeightCm] = useState(178)
  const [weightKg, setWeightKg] = useState(80)
  const [activityLevel, setActivityLevel] = useState('Moderate')
  const [goal, setGoal] = useState('Fat Loss')

  // --- Unit display preferences ---
  const [weightUnit, setWeightUnit] = useState('kg') // 'kg' | 'lb'
  const [heightUnit, setHeightUnit] = useState('cm') // 'cm' | 'ftin'

  // --- Email-capture form (lead magnet) ---
  const [emailFormOpen, setEmailFormOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)

  // --- Live macro computation ---
  const targets = useMemo(
    () =>
      estimateTargetsFromStats({
        weight: Number(weightKg) || 0,
        height: Number(heightCm) || 0,
        age: Number(age) || 0,
        sex,
        activityLevel,
        goal,
      }),
    [weightKg, heightCm, age, sex, activityLevel, goal],
  )

  // --- Weight display value (controlled in whichever unit user picked) ---
  const weightDisplay =
    weightUnit === 'kg' ? round1(weightKg) : round1(weightKg * KG_TO_LB)
  const onWeightChange = (raw) => {
    const v = Number(raw)
    if (Number.isNaN(v)) return setWeightKg(0)
    setWeightKg(weightUnit === 'kg' ? v : v / KG_TO_LB)
  }

  // --- Height: cm OR ft+in (two inputs) ---
  const heightFt = Math.floor(heightCm / CM_PER_IN / 12)
  const heightIn = Math.round(heightCm / CM_PER_IN - heightFt * 12)
  const onHeightCmChange = (raw) => {
    const v = Number(raw)
    if (Number.isNaN(v)) return setHeightCm(0)
    setHeightCm(v)
  }
  const onHeightFtInChange = (ftRaw, inRaw) => {
    const ft = Number(ftRaw) || 0
    const inches = Number(inRaw) || 0
    setHeightCm((ft * 12 + inches) * CM_PER_IN)
  }

  // --- Submit the small email-only lead form ---
  const onSaveEmail = (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    addLead({
      name: '(email lead)',
      email: trimmed,
      goal,
      timeline: 'Just exploring',
      preferredTime: '—',
      context: `Macro calculator result · ${targets.calories} kcal · ${targets.protein}P / ${targets.carbs}C / ${targets.fat}F · activity: ${activityLevel}`,
      source: 'calculator',
    })
    setEmailSaved(true)
  }

  // Shared classes for native form controls.
  const fieldBase =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/10'

  const segBtn = (active) =>
    `flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
    }`

  const unitChip = (active) =>
    `rounded-md px-2 py-1 text-[11px] font-semibold transition ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0d10] dark:text-gray-100">
      {/* ---- Sticky nav ---- */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-white/70 backdrop-blur-md dark:bg-[#0b0d10]/70 no-print">
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
      <section className="border-b border-gray-100 dark:border-white/5 no-print">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-16"
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold tracking-wide text-gray-600 dark:border-white/10 dark:text-gray-300"
          >
            <Sparkles size={14} /> MACRO CALCULATOR
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          >
            Get your starting macros in 60 seconds.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-base text-gray-600 dark:text-gray-400 sm:text-lg"
          >
            A clean, honest starting point — calories and protein/carbs/fat tuned to your goal.
            No signup required.
          </motion.p>
        </motion.div>
      </section>

      {/* ---- Two column: inputs + result ---- */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT — inputs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="lg:col-span-3"
          >
            <Card className="p-6 sm:p-8">
              <CardHeader
                icon={CalculatorIcon}
                title="Your stats"
                subtitle="Numbers update live as you type"
              />
              <div className="mt-6 space-y-5">
                {/* Sex segmented */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Sex
                  </label>
                  <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => setSex('male')}
                      className={segBtn(sex === 'male')}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex('female')}
                      className={segBtn(sex === 'female')}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Age
                    </label>
                    <input
                      type="number"
                      min={14}
                      max={90}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={fieldBase}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Weight
                      </label>
                      <div className="flex gap-0.5 rounded-md bg-gray-100 p-0.5 dark:bg-white/5">
                        <button
                          type="button"
                          onClick={() => setWeightUnit('kg')}
                          className={unitChip(weightUnit === 'kg')}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setWeightUnit('lb')}
                          className={unitChip(weightUnit === 'lb')}
                        >
                          lb
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min={30}
                      max={400}
                      step={0.1}
                      value={weightDisplay}
                      onChange={(e) => onWeightChange(e.target.value)}
                      className={fieldBase}
                    />
                  </div>
                </div>

                {/* Height */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Height
                    </label>
                    <div className="flex gap-0.5 rounded-md bg-gray-100 p-0.5 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => setHeightUnit('cm')}
                        className={unitChip(heightUnit === 'cm')}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeightUnit('ftin')}
                        className={unitChip(heightUnit === 'ftin')}
                      >
                        ft·in
                      </button>
                    </div>
                  </div>
                  {heightUnit === 'cm' ? (
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={Math.round(heightCm)}
                      onChange={(e) => onHeightCmChange(e.target.value)}
                      className={fieldBase}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="number"
                          min={3}
                          max={8}
                          value={heightFt}
                          onChange={(e) => onHeightFtInChange(e.target.value, heightIn)}
                          className={`${fieldBase} pr-9`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                          ft
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={11}
                          value={heightIn}
                          onChange={(e) => onHeightFtInChange(heightFt, e.target.value)}
                          className={`${fieldBase} pr-9`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                          in
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Activity level
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className={fieldBase}
                  >
                    {ACTIVITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Primary goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className={fieldBase}
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* RIGHT — result */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="lg:col-span-2"
          >
            <Card className="p-6 sm:p-7">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Daily target
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                  {targets.calories.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">kcal</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Flame size={13} /> {goal} · {activityLevel} activity
              </div>

              {/* Macro rings row */}
              <div className="mt-6 grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center">
                  <MacroRing
                    value={targets.calories}
                    max={targets.calories || 1}
                    size={84}
                    stroke={9}
                    color={MACRO_COLORS.calories}
                    label="Cals"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <MacroRing
                    value={targets.protein}
                    max={targets.protein || 1}
                    size={84}
                    stroke={9}
                    color={MACRO_COLORS.protein}
                    label="Protein"
                    unit="g"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <MacroRing
                    value={targets.carbs}
                    max={targets.carbs || 1}
                    size={84}
                    stroke={9}
                    color={MACRO_COLORS.carbs}
                    label="Carbs"
                    unit="g"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <MacroRing
                    value={targets.fat}
                    max={targets.fat || 1}
                    size={84}
                    stroke={9}
                    color={MACRO_COLORS.fat}
                    label="Fat"
                    unit="g"
                  />
                </div>
              </div>

              {/* Macro detail rows */}
              <div className="mt-6 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/5 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Beef size={14} style={{ color: MACRO_COLORS.protein }} /> Protein
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {targets.protein}g
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Wheat size={14} style={{ color: MACRO_COLORS.carbs }} /> Carbs
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {targets.carbs}g
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Droplet size={14} style={{ color: MACRO_COLORS.fat }} /> Fat
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {targets.fat}g
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                These are starting targets based on Mifflin-St Jeor (a standard formula).
                Real progress requires tracking and weekly adjustments — that's what coaching
                is for.
              </p>

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-2.5 no-print">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/apply')}
                >
                  Get a custom plan from Coach Zull <ArrowRight size={16} />
                </Button>
                {!emailFormOpen && !emailSaved && (
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => setEmailFormOpen(true)}
                  >
                    Save my results — get the PDF
                  </Button>
                )}
                {emailFormOpen && !emailSaved && (
                  <form
                    onSubmit={onSaveEmail}
                    className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={fieldBase}
                    />
                    <Button type="submit" variant="primary" size="md" className="w-full">
                      Email me the PDF
                    </Button>
                  </form>
                )}
                {emailSaved && (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                    <Check size={16} className="text-gray-900 dark:text-white" />
                    Sent. Check your inbox shortly.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-1 text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white"
                >
                  Or print this page
                </button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ---- What a number can't tell you (honest upsell) ---- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 no-print"
        >
          <Card className="overflow-hidden border-gray-200 dark:border-white/10">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_1fr]">
              <div className="border-b border-gray-100 p-6 dark:border-white/5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={16} />
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Honest take: what this calculator <em className="not-italic underline underline-offset-2">can't</em> do
                  </h3>
                </div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  These numbers are a starting point — the same math any free calculator uses. They
                  don't know anything about your week. Here's what they miss:
                </p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    { icon: Repeat, t: 'Adjusting when you stall', d: '2 weeks no movement is normal — knowing whether to wait, cut more, or refeed is the job.' },
                    { icon: CalendarClock, t: 'Periodizing across weeks', d: 'Deloads, refeeds, and diet breaks at the right time. The number stays the same; the strategy doesn\'t.' },
                    { icon: Soup, t: 'Foods you actually like', d: 'A plan you hate isn\'t a plan. Swapping foods while hitting the same targets takes a coach.' },
                    { icon: Plane, t: 'Life chaos', d: 'Travel, illness, busy weeks, social events — the plan has to bend without breaking.' },
                    { icon: HeartPulse, t: 'Training programming', d: 'Calories don\'t lift the bar. Periodized training is half of why people get results.' },
                    { icon: Sparkles, t: 'Accountability', d: 'The number doesn\'t care if you hit it. Someone checking in every week does.' },
                  ].map((row) => (
                    <li key={row.t} className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/[0.03]">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-gray-700 dark:bg-white/5 dark:text-gray-300">
                        <row.icon size={14} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.t}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{row.d}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center bg-gray-900 p-6 text-white dark:bg-white/5">
                <h4 className="text-lg font-bold tracking-tight">That's what I do.</h4>
                <p className="mt-2 text-sm text-white/70">
                  I build the plan around your real life, watch your trends weekly, and make the
                  call when something needs to change. Book a free 15-min call and I'll tell you
                  honestly whether coaching is right for you.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/apply')}
                  className="mt-5 w-full bg-white text-gray-900 hover:bg-gray-200"
                >
                  Book a free 15-min consult <ArrowRight size={16} />
                </Button>
                <p className="mt-3 text-center text-[11px] text-white/50">
                  Free · No card required · Reply within 24 hours
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ---- Trust strip ---- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center justify-center gap-2.5 no-print"
        >
          <Badge className="border border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            <Check size={12} /> Free
          </Badge>
          <Badge className="border border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            <Check size={12} /> No signup required
          </Badge>
          <Badge className="border border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            <Check size={12} /> Personalized in 1 minute
          </Badge>
        </motion.div>
      </section>

      {/* ---- Tiny footer ---- */}
      <footer className="border-t border-gray-100 bg-white dark:border-white/5 dark:bg-[#0b0d10] no-print">
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
