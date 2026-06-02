import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  CalendarClock,
  Scale,
  Target,
  Gauge,
  Flame,
  ClipboardCheck,
  MessageSquare,
  Utensils,
  Dumbbell,
  ArrowRight,
  Send,
  Trophy,
  Check,
  Calendar,
  Camera,
  Star,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatCard,
  ProgressBar,
  PageTransition,
} from '../../components/ui/index.jsx'
import { MacroRing } from '../../components/ui/MacroRing.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { scaleFood, sumMacros, MACRO_COLORS } from '../../utils/macros.js'
import { findFood } from '../../data/foods.js'
import { COACH } from '../../data/coach.js'
import { CLIENT_NOTIFICATIONS, NEXT_CHECKIN } from '../../data/clientPortal.js'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const NOTIF_ICONS = {
  checkin: ClipboardCheck,
  message: MessageSquare,
  plan: Utensils,
  workout: Dumbbell,
}

// urgency palette for the next-check-in banner
const URGENCY = {
  overdue: {
    ring: 'ring-rose-500/30',
    grad: 'from-rose-500/10 to-rose-500/0',
    icon: 'bg-rose-500/15 text-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  due: {
    ring: 'ring-amber-500/30',
    grad: 'from-amber-500/10 to-amber-500/0',
    icon: 'bg-amber-500/15 text-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  upcoming: {
    ring: 'ring-accent-500/30',
    grad: 'from-accent-500/10 to-accent-500/0',
    icon: 'bg-accent-500/15 text-accent-600 dark:text-accent-400',
    text: 'text-accent-600 dark:text-accent-400',
  },
}

// Consecutive days with a log up to today (in the user's local time).
function calcStreak(logs) {
  if (!logs?.length) return 0
  const dates = new Set(logs.map((l) => l.date))
  let n = 0
  const d = new Date()
  for (;;) {
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) { n += 1; d.setDate(d.getDate() - 1) } else break
  }
  return n
}

const MILESTONES = [
  { days: 7, label: '7-day streak' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '30-day streak' },
  { days: 60, label: '60-day streak' },
  { days: 90, label: '90-day streak' },
]

function Win({ label, value, tone = 'neutral' }) {
  const colors = {
    good: 'text-accent-700 dark:text-accent-300',
    soft: 'text-gray-500 dark:text-gray-400',
    neutral: 'text-gray-700 dark:text-gray-200',
  }
  return (
    <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
      <div className={`text-2xl font-bold tracking-tight ${colors[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}

export default function ClientHome() {
  const { user } = useAuth()
  const {
    clients, getClientPlan, getDailyLogs, getProgressPhotos,
    getSubscription, getAgreement, getMessages,
    getTestimonial, addTestimonial,
    getEarnedDiscount,
  } = useAppData()
  const me = clients.find((c) => c.id === user.clientId) || clients[0]
  const firstName = me.name.split(' ')[0]
  const plan = getClientPlan(me.id)
  const targets = plan.targets
  const dailyTotals = sumMacros(plan.meals.flatMap((m) => m.rows.map((r) => scaleFood(findFood(r.foodId), r.grams))))

  // ---- streak + wins (derived from real logs) ----
  const logs = getDailyLogs(me.id)
  const photos = getProgressPhotos(me.id)
  const streak = calcStreak(logs)
  const totalDaysLogged = logs.length
  const firstWeightLog = logs.find((l) => l.weight != null)
  const latestWeightLog = [...logs].reverse().find((l) => l.weight != null)
  const weightDelta = firstWeightLog && latestWeightLog ? Math.round((latestWeightLog.weight - firstWeightLog.weight) * 10) / 10 : null
  const checkInsDone = (me.checkIns || []).length
  const reached = MILESTONES.filter((m) => streak >= m.days)
  const next = MILESTONES.find((m) => streak < m.days)

  // ---- week-1 onboarding checklist + week-4 testimonial capture ----
  const sub = getSubscription(me.id)
  const subStartedMs = sub?.since ? new Date(sub.since).getTime() : null
  const daysSinceStart = subStartedMs ? Math.floor((Date.now() - subStartedMs) / 86400000) : null

  // ---- End-of-plan / renewal nudge ----
  // Monthly: at 30+ days of active subscription, suggest locking in 6-Month with loyalty.
  // 12-Week / 6-Month bundles: if within 14 days of the implicit end date, suggest what's next.
  const planLengthDays =
    sub?.packageId === 'pkg-12wk' ? 84 : sub?.packageId === 'pkg-6mo' ? 180 : null
  const planEndsAt =
    planLengthDays && subStartedMs
      ? new Date(subStartedMs + planLengthDays * 86400000).toISOString().slice(0, 10)
      : null
  const planDaysLeft = planEndsAt
    ? Math.ceil((new Date(planEndsAt + 'T23:59:59').getTime() - Date.now()) / 86400000)
    : null
  const showMonthlyRenewal = sub?.cadence === 'per month' && daysSinceStart != null && daysSinceStart >= 30
  const showBundleEnding =
    sub?.cadence === 'one-time' && planDaysLeft != null && planDaysLeft >= 0 && planDaysLeft <= 14
  const hasAgreement = !!getAgreement(me.id)
  const photosCount = photos.length
  const sentClientMsg = (getMessages(me.id) || []).some((m) => m.from === 'client')
  const intakeFilled = !!(me.experience || me.equipment) // filled at signup
  const checklist = [
    { key: 'profile', label: 'Profile created', done: true, to: '/account' },
    { key: 'intake', label: 'Intake details', done: intakeFilled, to: null },
    { key: 'agreement', label: 'Coaching agreement signed', done: hasAgreement, to: '/packages' },
    { key: 'log', label: 'First daily log', done: totalDaysLogged > 0, to: '/progress' },
    { key: 'photo', label: 'Day-0 progress photo', done: photosCount > 0, to: '/progress' },
    { key: 'message', label: 'Messaged Coach Zull', done: sentClientMsg, to: '/messages' },
  ]
  const checklistDone = checklist.filter((c) => c.done).length
  const showChecklist = checklistDone < checklist.length && (daysSinceStart == null || daysSinceStart <= 14)

  const reward = getEarnedDiscount(me.id)

  const existingTestimonial = getTestimonial(me.id)
  const showTestimonial = !existingTestimonial && daysSinceStart != null && daysSinceStart >= 28
  const [tForm, setTForm] = useState({ rating: 5, quote: '', allow: true })
  const [tDone, setTDone] = useState(false)
  const submitTestimonial = (e) => {
    e.preventDefault()
    if (!tForm.quote.trim()) return
    addTestimonial(me.id, { rating: tForm.rating, quote: tForm.quote.trim(), allowFeature: tForm.allow })
    setTDone(true)
  }

  const urgent = NEXT_CHECKIN.status === 'overdue' || NEXT_CHECKIN.status === 'due'
  const u = URGENCY[NEXT_CHECKIN.status] || URGENCY.upcoming

  const rings = [
    { key: 'calories', label: 'Calories', value: dailyTotals.calories, max: targets.calories, unit: '' },
    { key: 'protein', label: 'Protein', value: dailyTotals.protein, max: targets.protein, unit: 'g' },
    { key: 'carbs', label: 'Carbs', value: dailyTotals.carbs, max: targets.carbs, unit: 'g' },
    { key: 'fat', label: 'Fat', value: dailyTotals.fat, max: targets.fat, unit: 'g' },
  ]

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's your coaching snapshot — stay on top of your targets and check-ins.
          </p>
        </motion.div>

        {/* Trial countdown banner (only when subscribed to a trial package) */}
        {sub?.trialEndsAt && (() => {
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(sub.trialEndsAt + 'T23:59:59').getTime() - Date.now()) / 86400000),
          )
          const ending = daysLeft <= 3
          return (
            <motion.div variants={item}>
              <div
                className={`card relative overflow-hidden p-5 ring-1 sm:p-6 ${
                  ending ? 'ring-amber-500/30' : 'ring-accent-500/30'
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${
                    ending ? 'from-amber-500/10 to-amber-500/0' : 'from-accent-500/10 to-accent-500/0'
                  }`}
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                        ending ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                      }`}
                    >
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          2-Week Trial
                        </h2>
                        <span
                          className={`chip font-semibold ${
                            ending
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-accent-500/15 text-accent-700 dark:text-accent-400'
                          }`}
                        >
                          {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Trial ends {sub.trialEndsAt}. Convert to Monthly Coaching anytime to keep your plan,
                        check-ins, and messaging going.
                      </p>
                    </div>
                  </div>
                  <Link to="/packages" className="shrink-0">
                    <Button variant="primary" className="w-full sm:w-auto">
                      Convert to Monthly <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )
        })()}

        {/* Renewal nudge — Monthly at 30+ days, or 12wk/6mo within 14 days of end */}
        {(showMonthlyRenewal || showBundleEnding) && (
          <motion.div variants={item}>
            <div className="card relative overflow-hidden p-5 ring-1 ring-accent-500/30 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-500/[0.08] to-accent-500/0" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-500/15 text-accent-600 dark:text-accent-400">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      {showMonthlyRenewal ? `${daysSinceStart} days in — keep going?` : `Your plan ends in ${planDaysLeft} day${planDaysLeft === 1 ? '' : 's'}`}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {showMonthlyRenewal
                        ? reward.percent > 0
                          ? `You've earned ${reward.percent}% off — lock in 6-Month or keep Monthly going. The discount applies either way.`
                          : 'Convert to 6-Month for the biggest savings, or continue your Monthly plan.'
                        : `Decide what's next so your progress doesn't stall. ${reward.percent > 0 ? `You've earned ${reward.percent}% off your renewal.` : ''}`}
                    </p>
                  </div>
                </div>
                <Link to="/packages" className="shrink-0">
                  <Button variant="primary" className="w-full sm:w-auto">
                    See renewal options <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next check-in banner */}
        <motion.div variants={item}>
          <div
            className={`card relative overflow-hidden p-5 ring-1 ${u.ring} sm:p-6`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${u.grad}`} />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${u.icon}`}>
                  <CalendarClock size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      {NEXT_CHECKIN.label}
                    </h2>
                    <span className={`chip ${u.icon} font-semibold`}>{NEXT_CHECKIN.dueIn}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Due {NEXT_CHECKIN.dueDate}
                    {urgent ? ' — don’t leave it late.' : ' — plenty of time, but get ahead of it.'}
                  </p>
                </div>
              </div>
              <Link to="/check-ins" className="shrink-0">
                <Button variant="primary" className="w-full sm:w-auto">
                  Complete check-in <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPI tiles */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Scale} accent="blue" label="Current weight" value={`${me.weight} kg`} />
          <StatCard icon={Target} accent="violet" label="Goal" value={me.goal} />
          <StatCard
            icon={Gauge}
            accent="accent"
            label="Compliance"
            value={`${me.compliance}%`}
            delta={me.compliance >= 85 ? 'On track' : 'Push'}
            deltaTone={me.compliance >= 85 ? 'up' : 'down'}
          />
          <StatCard icon={Flame} accent="amber" label="Calorie target" value={targets.calories} sub="kcal / day" />
        </motion.div>

        {/* Streak + wins */}
        <motion.div variants={item} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Streak card */}
          <Card className="p-5 sm:p-6 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Logging streak</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{streak}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">day{streak === 1 ? '' : 's'}</span>
                </div>
                {next ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {next.days - streak} more to your {next.label}.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-accent-600 dark:text-accent-400">All milestones unlocked. Legendary.</p>
                )}
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Flame size={22} />
              </span>
            </div>
            {/* Milestone badges */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {MILESTONES.map((m) => {
                const earned = streak >= m.days
                return (
                  <span
                    key={m.days}
                    className={`chip border ${
                      earned
                        ? 'border-accent-500/40 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                        : 'border-gray-200 text-gray-400 dark:border-white/10'
                    }`}
                  >
                    {earned && <Check size={11} />} {m.days}d
                  </span>
                )
              })}
            </div>
          </Card>

          {/* Wins card */}
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <Trophy size={18} />
              </span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your wins so far</h3>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Win
                label={weightDelta == null ? 'Weight tracked' : weightDelta < 0 ? 'Weight down' : weightDelta > 0 ? 'Weight up' : 'Weight steady'}
                value={weightDelta == null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`}
                tone={weightDelta == null ? 'neutral' : (me.goal === 'Fat Loss' ? (weightDelta < 0 ? 'good' : 'soft') : (weightDelta > 0 ? 'good' : 'soft'))}
              />
              <Win label="Days logged" value={totalDaysLogged} tone="good" />
              <Win label="Photos uploaded" value={photos.length} tone="good" />
              <Win label="Check-ins submitted" value={checkInsDone} tone="good" />
            </div>
            {reached.length === 0 && totalDaysLogged === 0 && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Log your first day on <Link to="/progress" className="font-semibold text-accent-700 underline-offset-2 hover:underline dark:text-accent-300">Progress</Link> to start your streak.
              </p>
            )}
          </Card>
        </motion.div>

        {/* Loyalty rewards — earn a renewal discount by hitting milestones */}
        <motion.div variants={item}>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Trophy size={16} />
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Loyalty rewards</h3>
                  {reward.percent > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {reward.percent}% off renewal
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Hit milestones and PRs and earn a discount when you continue past your plan.
                </p>
              </div>
              <Link to="/packages" className="shrink-0">
                <Button variant="outline" size="sm">
                  Apply at renewal <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {reward.milestones.map((m) => (
                <li
                  key={m.key}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition ${
                    m.met
                      ? 'border-amber-500/30 bg-amber-500/[0.04] text-gray-700 dark:text-gray-200'
                      : 'border-gray-100 text-gray-500 dark:border-white/5 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                      m.met
                        ? 'bg-amber-500 text-white'
                        : 'border border-gray-300 dark:border-white/20'
                    }`}>
                      {m.met && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className={m.met ? 'font-medium' : ''}>{m.label}</span>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${m.met ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                    +{m.percent}%
                  </span>
                </li>
              ))}
            </ul>
            {reward.next && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Next up: <span className="font-semibold text-gray-700 dark:text-gray-200">{reward.next.label}</span>{' '}
                → +{reward.next.percent}% extra.
              </p>
            )}
            {reward.percent >= 25 && (
              <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Max reward unlocked — 25% off your next plan.
              </p>
            )}
          </Card>
        </motion.div>

        {/* Onboarding checklist (week 1) */}
        {showChecklist && (
          <motion.div variants={item}>
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
                      <Sparkles size={16} />
                    </span>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">First-week setup</h3>
                    <Badge className="bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                      {checklistDone} / {checklist.length}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Knock these out to get the most out of week one. Tap any line to jump to it.
                  </p>
                </div>
                {COACH.calendlyUrl && (
                  <a href={COACH.calendlyUrl} target="_blank" rel="noreferrer" className="btn-primary px-4 py-2 text-xs">
                    <Calendar size={14} /> Book first call
                  </a>
                )}
              </div>
              <div className="mt-4">
                <ProgressBar value={checklistDone} max={checklist.length} />
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {checklist.map((c) => {
                  const Row = (
                    <span className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm transition ${
                      c.done
                        ? 'border-accent-500/30 bg-accent-500/5 text-gray-700 dark:text-gray-200'
                        : 'border-gray-100 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.04]'
                    }`}>
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                        c.done
                          ? 'bg-accent-600 text-white dark:bg-white dark:text-gray-900'
                          : 'border border-gray-300 dark:border-white/20'
                      }`}>
                        {c.done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={c.done ? 'font-medium' : ''}>{c.label}</span>
                    </span>
                  )
                  return (
                    <li key={c.key}>
                      {c.to && !c.done ? <Link to={c.to}>{Row}</Link> : Row}
                    </li>
                  )
                })}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* 4-week testimonial capture */}
        {showTestimonial && (
          <motion.div variants={item}>
            <Card className="overflow-hidden border-accent-500/30">
              <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
                <div className="bg-gray-900 p-6 text-white dark:bg-white/5">
                  <div className="flex items-center gap-2 text-amber-400">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} size={16} className="fill-current" />
                    ))}
                  </div>
                  <h3 className="mt-3 text-lg font-bold tracking-tight">You've put in 4 solid weeks.</h3>
                  <p className="mt-2 text-sm text-white/70">
                    Want to share your story? A short note + a photo (optional) helps other people decide
                    if coaching is right for them. Nothing goes public without your permission.
                  </p>
                </div>
                <div className="p-6">
                  {tDone ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-500/15 text-accent-600 dark:text-accent-300">
                        <Check size={24} />
                      </span>
                      <h4 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">Thanks — recorded.</h4>
                      <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                        Coach Zull will see it on your profile.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={submitTestimonial} className="space-y-3">
                      <div>
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Rating</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setTForm((p) => ({ ...p, rating: r }))}
                              className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                                r <= tForm.rating
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : 'bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600'
                              }`}
                            >
                              <Star size={16} className={r <= tForm.rating ? 'fill-current' : ''} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Your story</span>
                        <textarea
                          className="input resize-none"
                          rows={3}
                          value={tForm.quote}
                          onChange={(e) => setTForm((p) => ({ ...p, quote: e.target.value }))}
                          placeholder="What's changed in the last 4 weeks?"
                          required
                        />
                      </label>
                      <label className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={tForm.allow}
                          onChange={(e) => setTForm((p) => ({ ...p, allow: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent-600 dark:border-white/20 dark:bg-white/5"
                        />
                        <span>
                          Allow Coach Zull to feature this on the public site (you can revoke anytime in
                          <Link to="/account" className="ml-1 font-semibold underline-offset-2 hover:underline">Account</Link>).
                        </span>
                      </label>
                      <Button type="submit" className="w-full">
                        Submit <ArrowRight size={15} />
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's targets */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader
                title="Today's targets"
                subtitle="Your plan totals vs assigned targets"
                icon={Flame}
                action={
                  <Link to="/my-plan">
                    <Button variant="ghost" size="sm">
                      View full plan <ArrowRight size={14} />
                    </Button>
                  </Link>
                }
              />
              <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
                {rings.map((r) => (
                  <div key={r.key} className="flex flex-col items-center">
                    <MacroRing
                      value={r.value}
                      max={r.max}
                      size={104}
                      stroke={10}
                      color={MACRO_COLORS[r.key]}
                      label={r.label}
                      unit={r.unit}
                    />
                    <span className="mt-2 text-xs text-gray-400">
                      of {r.max}
                      {r.unit}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Message coach */}
          <motion.div variants={item}>
            <Card className="flex h-full flex-col">
              <CardHeader title="Your coach" icon={MessageSquare} />
              <div className="flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-2 text-center">
                <img
                  src={COACH.avatar}
                  alt={COACH.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-accent-500/30"
                />
                <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
                  {COACH.name}
                </h3>
                <p className="text-xs text-gray-400">@{COACH.handle}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Usually replies within a few hours.
                </p>
                <Link to="/messages" className="mt-4 w-full">
                  <Button variant="outline" className="w-full">
                    <Send size={15} /> Message coach
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={item} className="lg:col-span-3">
            <Card>
              <CardHeader title="Notifications" subtitle="Latest updates from your coach" icon={ClipboardCheck} />
              <ul className="divide-y divide-gray-100 px-5 pb-2 dark:divide-white/5">
                {CLIENT_NOTIFICATIONS.map((n) => {
                  const Icon = NOTIF_ICONS[n.type] || ClipboardCheck
                  return (
                    <li key={n.id} className="flex items-start gap-3 py-3.5">
                      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300">
                        <Icon size={16} />
                        {n.urgent && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#15181d]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {n.title}
                          </p>
                          <span className="shrink-0 text-xs text-gray-400">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.body}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </PageTransition>
  )
}
