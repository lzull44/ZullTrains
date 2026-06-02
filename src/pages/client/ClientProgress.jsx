import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Scale,
  Footprints,
  Droplet,
  Moon,
  Camera,
  Plus,
  Trash2,
  TrendingUp,
  Check,
  Upload,
  Trophy,
  Dumbbell,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatCard,
  SectionHeader,
  EmptyState,
  PageTransition,
} from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'

const GRAPHITE = '#71717a'
const today = () => new Date().toISOString().slice(0, 10)
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v))
const fmtDate = (d) => {
  const date = new Date(d + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Themed recharts tooltip — light/dark aware.
function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur dark:border-white/10 dark:bg-gray-900/95">
      <div className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{fmtDate(label)}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
          <span className="capitalize text-gray-500 dark:text-gray-400">{p.name || p.dataKey}</span>
          <span className="ml-auto font-semibold text-gray-900 dark:text-white">
            {p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

// Consecutive logged days ending at the most recent log.
function currentStreak(logs) {
  if (!logs.length) return 0
  const dates = new Set(logs.map((l) => l.date))
  let streak = 0
  const cursor = new Date(logs[logs.length - 1].date + 'T00:00:00')
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function ClientProgress() {
  const { user } = useAuth()
  const { clients, getDailyLogs, logDaily, getProgressPhotos, addProgressPhoto, removeProgressPhoto, getClientPRs } = useAppData()

  const me = clients.find((c) => c.id === user?.clientId) || clients[0]
  const clientId = me?.id

  const logs = getDailyLogs(clientId)
  const photos = getProgressPhotos(clientId)

  const lastWeight = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      if (logs[i].weight != null) return logs[i].weight
    }
    return me?.weight ?? ''
  }, [logs, me])

  // ---- form state ----
  const [form, setForm] = useState({
    date: today(),
    weight: lastWeight === '' ? '' : String(lastWeight),
    steps: '',
    water: '',
    sleep: '',
  })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const [photoLabel, setPhotoLabel] = useState('')

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setSaved(false)
  }

  const handleLog = () => {
    if (!clientId) return
    const entry = { date: form.date || today() }
    const w = num(form.weight)
    const s = num(form.steps)
    const wa = num(form.water)
    const sl = num(form.sleep)
    if (w != null) entry.weight = w
    if (s != null) entry.steps = s
    if (wa != null) entry.water = wa
    if (sl != null) entry.sleep = sl
    logDaily(clientId, entry)
    setSaved(true)
    setForm((f) => ({ ...f, steps: '', water: '', sleep: '' }))
    setTimeout(() => setSaved(false), 2200)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file || !clientId) return
    const reader = new FileReader()
    reader.onload = () => {
      addProgressPhoto(clientId, reader.result, photoLabel.trim() || today())
      setPhotoLabel('')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ---- KPIs ----
  const latestWeight = lastWeight === '' ? null : Number(lastWeight)
  const avgSteps7 = useMemo(() => {
    const recent = logs.filter((l) => l.steps != null).slice(-7)
    if (!recent.length) return null
    return Math.round(recent.reduce((a, l) => a + Number(l.steps), 0) / recent.length)
  }, [logs])
  const avgSleep = useMemo(() => {
    const s = logs.filter((l) => l.sleep != null)
    if (!s.length) return null
    return Math.round((s.reduce((a, l) => a + Number(l.sleep), 0) / s.length) * 10) / 10
  }, [logs])
  const streak = useMemo(() => currentStreak(logs), [logs])

  // ---- chart data ----
  const weightData = useMemo(
    () => logs.filter((l) => l.weight != null).map((l) => ({ date: l.date, weight: Number(l.weight) })),
    [logs],
  )
  const stepsData = useMemo(
    () => logs.filter((l) => l.steps != null).map((l) => ({ date: l.date, steps: Number(l.steps) })),
    [logs],
  )

  const oldest = photos[photos.length - 1]
  const newest = photos[0]

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: 'easeOut' },
  })

  // Icon-led number input
  const Field = ({ icon: Icon, label, value, onChange, step, placeholder, suffix }) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-accent-400 dark:border-white/10 dark:bg-white/5">
        <Icon size={16} className="shrink-0 text-gray-400 dark:text-gray-500" />
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600"
        />
        {suffix && <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{suffix}</span>}
      </div>
    </label>
  )

  return (
    <PageTransition>
      <SectionHeader title="Progress" subtitle="Log your daily stats and track your transformation" />

      <div className="space-y-6">
        {/* ---- Today's log form ---- */}
        <motion.div {...fade(0)}>
          <Card>
            <CardHeader title="Today's log" subtitle="A minute a day keeps the plateaus away" icon={Plus} />
            <div className="p-5 pt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field icon={Scale} label="Weight" value={form.weight} onChange={update('weight')} step="0.1" placeholder="—" suffix="kg" />
                <Field icon={Footprints} label="Steps" value={form.steps} onChange={update('steps')} step="100" placeholder="—" />
                <Field icon={Droplet} label="Water" value={form.water} onChange={update('water')} step="0.1" placeholder="—" suffix="L" />
                <Field icon={Moon} label="Sleep" value={form.sleep} onChange={update('sleep')} step="0.5" placeholder="—" suffix="hrs" />
              </div>
              <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block sm:w-44">
                  <span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    max={today()}
                    onChange={update('date')}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-accent-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                  />
                </label>
                <div className="flex items-center gap-3">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 dark:text-accent-400"
                    >
                      <Check size={16} /> Saved
                    </motion.span>
                  )}
                  <Button onClick={handleLog} className="gap-1.5">
                    <Plus size={16} /> Log today
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ---- KPI tiles ---- */}
        <motion.div {...fade(0.05)} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Scale} label="Latest weight" value={latestWeight != null ? `${latestWeight} kg` : '–'} />
          <StatCard icon={Footprints} label="7-day avg steps" value={avgSteps7 != null ? avgSteps7.toLocaleString() : '0'} accent="blue" />
          <StatCard icon={Moon} label="Avg sleep" value={avgSleep != null ? `${avgSleep} h` : '–'} accent="violet" />
          <StatCard icon={TrendingUp} label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} accent="amber" />
        </motion.div>

        {/* ---- Charts ---- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div {...fade(0.1)}>
            <Card>
              <CardHeader title="Weight trend" subtitle="Over your logged days" icon={Scale} />
              <div className="p-5 pt-3">
                {weightData.length < 2 ? (
                  <EmptyState icon={TrendingUp} title="Not enough data yet" subtitle="Log a few days to see your weight trend take shape." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={weightData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GRAPHITE} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={GRAPHITE} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmtDate} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" minTickGap={20} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" domain={['dataMin - 0.5', 'dataMax + 0.5']} width={38} />
                      <RTooltip content={<ChartTooltip suffix=" kg" />} cursor={{ stroke: GRAPHITE, strokeOpacity: 0.2 }} />
                      <Area type="monotone" dataKey="weight" name="Weight" stroke={GRAPHITE} strokeWidth={2.5} fill="url(#cpWeight)" dot={{ r: 3, fill: GRAPHITE }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fade(0.15)}>
            <Card>
              <CardHeader title="Daily steps" subtitle="Your movement over time" icon={Footprints} />
              <div className="p-5 pt-3">
                {stepsData.length < 2 ? (
                  <EmptyState icon={TrendingUp} title="Not enough data yet" subtitle="Log a few days to see your step counts here." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stepsData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmtDate} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" minTickGap={20} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" width={42} />
                      <RTooltip content={<ChartTooltip />} cursor={{ fill: GRAPHITE, fillOpacity: 0.08 }} />
                      <Bar dataKey="steps" name="Steps" fill={GRAPHITE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ---- Personal Records ---- */}
        <motion.div {...fade(0.18)}>
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Trophy size={18} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Personal records</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your heaviest set on each lift — updates automatically as you log.</p>
                </div>
              </div>
            </div>
            {(() => {
              const prs = Object.entries(getClientPRs(me.id))
              if (prs.length === 0) {
                return (
                  <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-white/10">
                    <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/5">
                      <Dumbbell size={18} />
                    </span>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No PRs yet</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Log a workout on <span className="font-medium">My Plan → Training</span> to start tracking your top lifts.
                    </p>
                  </div>
                )
              }
              const sorted = prs
                .map(([name, rec]) => ({ name, ...rec }))
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              return (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {sorted.map((pr) => (
                    <li
                      key={pr.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{pr.name}</div>
                        <div className="text-xs text-gray-400">Hit on {pr.date}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-base font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                          {pr.weight} kg
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">× {pr.reps} reps</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            })()}
          </Card>
        </motion.div>

        {/* ---- Progress photos ---- */}
        <motion.div {...fade(0.2)}>
          <Card>
            <CardHeader
              title="Progress photos"
              subtitle="Pictures don't lie — track the visual change"
              icon={Camera}
              action={
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={photoLabel}
                    onChange={(e) => setPhotoLabel(e.target.value)}
                    placeholder="Label (optional)"
                    className="hidden w-32 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none transition focus:border-accent-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 sm:block"
                  />
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <Button size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                    <Upload size={15} /> Upload photo
                  </Button>
                </div>
              }
            />
            <div className="p-5 pt-4">
              {/* Compare strip: oldest vs newest */}
              {photos.length >= 2 && (
                <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5 sm:gap-4 sm:p-4">
                  {[
                    { p: oldest, cap: 'Start' },
                    { p: newest, cap: 'Latest' },
                  ].map(({ p, cap }) => (
                    <div key={cap} className="text-center">
                      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                        <img src={p.dataUrl} alt={cap} className="aspect-[3/4] w-full object-cover" />
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Badge>{cap}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(p.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 ? (
                <EmptyState
                  icon={Camera}
                  title="No photos yet"
                  subtitle="Upload your first progress photo to start your transformation gallery."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10"
                    >
                      <img src={photo.dataUrl} alt={photo.label || photo.date} className="aspect-[3/4] w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="truncate text-xs font-medium text-white">{photo.label || fmtDate(photo.date)}</span>
                      </div>
                      <button
                        onClick={() => removeProgressPhoto(clientId, photo.id)}
                        aria-label="Remove photo"
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white opacity-0 backdrop-blur transition hover:bg-rose-500 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
