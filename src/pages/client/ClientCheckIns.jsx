import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarClock,
  Scale,
  Utensils,
  Battery,
  Moon,
  Activity,
  Brain,
  Footprints,
  HeartPulse,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  ProgressBar,
  SectionHeader,
  PageTransition,
} from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { round } from '../../utils/macros.js'
import { CLIENT_NOTIFICATIONS, NEXT_CHECKIN } from '../../data/clientPortal.js'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

// 1-5 rating fields. `invert` => lower is better (hunger, stress).
const RATINGS = [
  { key: 'hunger', label: 'Hunger', icon: Utensils, invert: true },
  { key: 'energy', label: 'Energy', icon: Battery, invert: false },
  { key: 'sleep', label: 'Sleep', icon: Moon, invert: false },
  { key: 'digestion', label: 'Digestion', icon: Activity, invert: false },
  { key: 'stress', label: 'Stress', icon: Brain, invert: true },
]

const URGENCY = {
  overdue: { chip: 'bg-rose-500/15 text-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  due: { chip: 'bg-amber-500/15 text-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  upcoming: { chip: 'bg-accent-500/15 text-accent-600 dark:text-accent-400', text: 'text-accent-600 dark:text-accent-400' },
}

function RatingSelector({ field, value, onChange }) {
  const Icon = field.icon
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon size={15} className="text-gray-400" />
        {field.label}
        <span className="ml-auto text-xs font-semibold text-accent-600 dark:text-accent-400">{value}/5</span>
      </label>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(field.key, n)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
              aria-pressed={active}
              aria-label={`${field.label} ${n}`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ClientCheckIns() {
  const { user } = useAuth()
  const { clients } = useAppData()
  const me = clients.find((c) => c.id === user.clientId) || clients[0]

  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    weight: me.weight,
    avgWeight: me.weight,
    hunger: 3,
    energy: 4,
    sleep: 4,
    digestion: 4,
    stress: 2,
    steps: 90,
    cardio: 80,
    notes: '',
  })

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }))
  const setRating = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  // Live adherence: average of normalized ratings (invert hunger & stress)
  // plus step & cardio completion %, all on a 0-100 scale.
  const adherence = useMemo(() => {
    const ratingScores = RATINGS.map((f) => {
      const v = form[f.key]
      const norm = f.invert ? (5 - v) / 4 : (v - 1) / 4 // 0..1
      return norm * 100
    })
    const completion = [Math.min(form.steps, 100), Math.min(form.cardio, 100)]
    const all = [...ratingScores, ...completion]
    return round(all.reduce((a, b) => a + b, 0) / all.length)
  }, [form])

  const adherenceColor =
    adherence >= 85 ? '#71717a' : adherence >= 65 ? '#f59e0b' : '#f43f5e'

  const u = URGENCY[NEXT_CHECKIN.status] || URGENCY.upcoming

  const checkInNotifs = CLIENT_NOTIFICATIONS.filter((n) => n.type === 'checkin')
  const history = [...me.checkIns].reverse() // most recent first

  return (
    <PageTransition>
      <SectionHeader
        title="Check-ins"
        subtitle="Submit your weekly progress so Coach Zull can adjust your plan"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Deadline / submitted banner */}
        <motion.div variants={item}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex items-center gap-4 p-5 ring-1 ring-accent-500/30 sm:p-6"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-500/15 text-accent-600 dark:text-accent-400">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Check-in submitted — Coach Zull will review it shortly ✓
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your {NEXT_CHECKIN.label} is in. Look out for feedback in Messages.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="due"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${u.chip}`}>
                    <CalendarClock size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {NEXT_CHECKIN.label}
                      </h2>
                      <span className={`chip font-semibold ${u.chip}`}>{NEXT_CHECKIN.dueIn}</span>
                    </div>
                    <p className={`mt-1 text-sm ${u.text}`}>Due {NEXT_CHECKIN.dueDate}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader title="Weekly check-in" subtitle="Takes about 2 minutes" icon={ClipboardCheck} />
              <div className="space-y-6 p-5">
                {/* Weights */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Scale size={15} className="text-gray-400" /> Current weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={form.weight}
                      onChange={(e) => setField('weight', e.target.value)}
                      disabled={submitted}
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Scale size={15} className="text-gray-400" /> Weekly avg weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={form.avgWeight}
                      onChange={(e) => setField('avgWeight', e.target.value)}
                      disabled={submitted}
                    />
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {RATINGS.map((f) => (
                    <RatingSelector key={f.key} field={f} value={form[f.key]} onChange={setRating} />
                  ))}
                </div>

                {/* Completion sliders */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    { key: 'steps', label: 'Step completion', icon: Footprints },
                    { key: 'cardio', label: 'Cardio completion', icon: HeartPulse },
                  ].map((c) => {
                    const Icon = c.icon
                    return (
                      <div key={c.key}>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Icon size={15} className="text-gray-400" />
                          {c.label}
                          <span className="ml-auto text-xs font-semibold text-accent-600 dark:text-accent-400">
                            {form[c.key]}%
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={form[c.key]}
                          onChange={(e) => setField(c.key, Number(e.target.value))}
                          disabled={submitted}
                          className="w-full accent-accent-600"
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes for your coach
                  </label>
                  <textarea
                    rows={3}
                    className="input resize-none"
                    placeholder="How did the week feel? Any wins, struggles, or questions?"
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    disabled={submitted}
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setSubmitted(true)}
                  disabled={submitted}
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 size={16} /> Submitted
                    </>
                  ) : (
                    <>
                      Submit check-in <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Side column: live adherence + checkin notifications */}
          <motion.div variants={item} className="space-y-6">
            <Card>
              <CardHeader title="Live adherence score" subtitle="Updates as you fill the form" icon={Activity} />
              <div className="px-5 pb-6 pt-2 text-center">
                <div className="text-5xl font-bold tracking-tight" style={{ color: adherenceColor }}>
                  {adherence}
                  <span className="text-xl text-gray-400">%</span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={adherence} max={100} color={adherenceColor} height={10} />
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {adherence >= 85
                    ? 'Excellent week — keep it locked in.'
                    : adherence >= 65
                      ? 'Solid, with room to tighten up.'
                      : 'Tough week — flag it in your notes.'}
                </p>
              </div>
            </Card>

            {checkInNotifs.length > 0 && (
              <Card>
                <CardHeader title="Check-in reminders" icon={ClipboardCheck} />
                <ul className="divide-y divide-gray-100 px-5 pb-3 dark:divide-white/5">
                  {checkInNotifs.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 py-3">
                      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300">
                        <ClipboardCheck size={15} />
                        {n.urgent && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#15181d]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                          <span className="shrink-0 text-xs text-gray-400">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </motion.div>
        </div>

        {/* History */}
        <motion.div variants={item}>
          <Card>
            <CardHeader title="Check-in history" subtitle="Your past weekly submissions" icon={CalendarClock} />
            <div className="px-5 pb-2 pt-1">
              {/* header (desktop) */}
              <div className="hidden grid-cols-[auto_1fr_auto_auto] gap-3 border-b border-gray-100 px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:border-white/5 sm:grid">
                <span className="w-12">Week</span>
                <span>Ratings (H / E / S / D / St)</span>
                <span className="w-24 text-right">Steps / Cardio</span>
                <span className="w-20 text-right">Adherence</span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-white/5">
                {history.map((c) => (
                  <li key={c.week} className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-1 py-3 text-sm sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                    <span className="w-12 font-semibold text-gray-900 dark:text-white">{c.week}</span>
                    <span className="text-right text-gray-500 dark:text-gray-400 sm:text-left">
                      <span className="hidden sm:inline tabular-nums">
                        {c.hunger} / {c.energy} / {c.sleep} / {c.digestion} / {c.stress}
                      </span>
                      <span className="sm:hidden">
                        <Badge className="bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                          H{c.hunger} E{c.energy} S{c.sleep}
                        </Badge>
                      </span>
                    </span>
                    <span className="w-24 text-left tabular-nums text-gray-500 dark:text-gray-400 sm:text-right">
                      {c.steps}% / {c.cardio}%
                    </span>
                    <span className="w-20 text-right">
                      <span
                        className={`font-semibold ${
                          c.adherence >= 85
                            ? 'text-accent-600 dark:text-accent-400'
                            : c.adherence >= 65
                              ? 'text-amber-500'
                              : 'text-rose-500'
                        }`}
                      >
                        {c.adherence}%
                      </span>
                    </span>
                    {c.notes && (
                      <p className="col-span-2 mt-0.5 text-xs italic text-gray-400 dark:text-gray-500 sm:col-start-2 sm:col-span-3">
                        “{c.notes}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  )
}
