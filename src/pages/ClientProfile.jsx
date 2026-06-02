import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Camera,
  StickyNote,
  MessageSquare,
  Scale,
  Target,
  Footprints,
  Moon,
  Droplet,
  Heart,
  Gauge,
  TrendingDown,
  TrendingUp,
  Calendar,
  ClipboardList,
  Users,
  Save,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Button,
  Badge,
  StatCard,
  Avatar,
  EmptyState,
  PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { MACRO_COLORS } from '../utils/macros.js'

// Themed recharts tooltip (matches Dashboard).
function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur dark:border-white/10 dark:bg-gray-900/95">
      <div className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
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

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }

// Mock meal-plan history (page-local, per spec).
const PLAN_HISTORY = [
  { id: 'p1', name: 'Cut Phase v3', kcal: 2100, range: 'May 5 – present', status: 'Active' },
  { id: 'p2', name: 'Cut Phase v2', kcal: 2250, range: 'Apr 7 – May 4', status: 'Archived' },
  { id: 'p3', name: 'Diet Break', kcal: 2600, range: 'Mar 24 – Apr 6', status: 'Archived' },
  { id: 'p4', name: 'Cut Phase v1', kcal: 2350, range: 'Mar 1 – Mar 23', status: 'Archived' },
]

function StatusChip({ status }) {
  if (status === 'needs-checkin') {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Needs check-in
      </Badge>
    )
  }
  return (
    <Badge className="bg-accent-500/10 text-accent-600 dark:text-accent-400">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Active
    </Badge>
  )
}

function MacroTile({ label, value, unit, color }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white">
        {value}
        <span className="ml-0.5 text-xs font-medium text-gray-400">{unit}</span>
      </div>
    </div>
  )
}

function LifestyleTile({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-white/5 dark:bg-white/[0.03]">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-500/10 text-accent-600 dark:text-accent-400">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {value}
          <span className="ml-0.5 text-xs font-medium text-gray-400">{unit}</span>
        </div>
        <div className="truncate text-[11px] text-gray-400">{label}</div>
      </div>
    </div>
  )
}

const PHOTO_LABELS = { front: 'Front', side: 'Side', back: 'Back' }

function PhotoTile({ label, upload = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border text-center transition ${
        upload
          ? 'border-dashed border-gray-300 bg-gray-50 hover:border-accent-500 hover:bg-accent-500/5 dark:border-white/10 dark:bg-white/[0.03]'
          : 'border-gray-100 dark:border-white/5'
      }`}
    >
      {!upload && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 via-sky-500/10 to-zinc-500/20 backdrop-blur-[1px] dark:from-accent-500/15 dark:via-sky-500/10 dark:to-zinc-500/15" />
      )}
      <div className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-gray-500 shadow-sm transition group-hover:scale-110 dark:bg-white/10 dark:text-gray-300">
        <Camera size={18} />
      </div>
      <span className="relative z-10 mt-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
        {upload ? 'Upload' : label}
      </span>
    </button>
  )
}

export default function ClientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, updateClient, deleteClient, getProgressPhotos } = useAppData()

  const client = clients.find((c) => c.id === id)

  const [notes, setNotes] = useState(client?.notes || '')
  const [coachComments, setCoachComments] = useState(client?.coachComments || '')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const weightHistory = client?.weightHistory || []
  const netChange = useMemo(() => {
    if (weightHistory.length < 2) return 0
    return Math.round((weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight) * 10) / 10
  }, [weightHistory])

  if (!client) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link
            to="/clients"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} /> Back to clients
          </Link>
          <EmptyState
            icon={Users}
            title="Client not found"
            subtitle="This client may have been removed from your roster."
            action={
              <Button onClick={() => navigate('/clients')}>
                <ArrowLeft size={16} /> Back to roster
              </Button>
            }
          />
        </div>
      </PageTransition>
    )
  }

  const save = () => {
    updateClient(client.id, { notes, coachComments })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const doDelete = () => {
    deleteClient(client.id)
    navigate('/clients')
  }

  const complianceColor =
    client.compliance >= 85 ? '#71717a' : client.compliance >= 70 ? '#f59e0b' : '#f43f5e'

  const recentCheckIns = (client.checkIns || []).slice(-5).reverse()

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          to="/clients"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} /> Back to clients
        </Link>

        {/* Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-accent-500/20 via-sky-500/10 to-zinc-500/20 dark:from-accent-500/15 dark:via-sky-500/10 dark:to-zinc-500/15" />
          <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-9 flex items-end gap-4">
              <div className="rounded-full ring-4 ring-white dark:ring-[#15181d]">
                <Avatar initials={client.avatar} color={client.color} size={76} />
              </div>
              <div className="pb-0.5">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  {client.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">{client.goal}</Badge>
                  <Badge className="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">{client.activityLevel}</Badge>
                  <Badge className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">{client.plan}</Badge>
                  <StatusChip status={client.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
                <Calendar size={14} /> Joined {client.joined}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
                <Pencil size={14} /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Stat tiles */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Gauge}
            accent={client.compliance >= 85 ? 'accent' : client.compliance >= 70 ? 'amber' : 'rose'}
            label="Compliance"
            value={`${client.compliance}%`}
            sub="8-week average"
          />
          <StatCard
            icon={Scale}
            accent="blue"
            label="Current weight"
            value={`${client.weight} kg`}
            delta={weightHistory.length >= 2 ? `${netChange > 0 ? '+' : ''}${netChange} kg` : null}
            deltaTone={netChange <= 0 ? 'up' : 'down'}
            sub="Latest logged"
          />
          <StatCard icon={Target} accent="violet" label="Goal" value={client.goal} sub={`${client.activityLevel} activity`} />
          <StatCard icon={Heart} accent="amber" label="Age" value={client.age} sub={`${client.height} cm`} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Targets */}
            <motion.div {...fade}>
              <Card>
                <CardHeader title="Targets" subtitle="Daily macros & lifestyle goals" icon={Target} />
                <div className="px-5 pb-5 pt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MacroTile label="Calories" value={client.calories} unit="kcal" color={MACRO_COLORS.calories} />
                    <MacroTile label="Protein" value={client.protein} unit="g" color={MACRO_COLORS.protein} />
                    <MacroTile label="Carbs" value={client.carbs} unit="g" color={MACRO_COLORS.carbs} />
                    <MacroTile label="Fat" value={client.fat} unit="g" color={MACRO_COLORS.fat} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <LifestyleTile icon={Footprints} label="Step goal" value={client.stepGoal?.toLocaleString()} unit="" />
                    <LifestyleTile icon={Heart} label="Cardio / week" value={client.cardioGoal} unit="min" />
                    <LifestyleTile icon={Moon} label="Sleep goal" value={client.sleepGoal} unit="h" />
                    <LifestyleTile icon={Droplet} label="Water goal" value={client.waterGoal} unit="L" />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Weight trend */}
            <motion.div {...fade} transition={{ delay: 0.05 }}>
              <Card>
                <CardHeader
                  title="Weight Trend"
                  subtitle={`${weightHistory.length} weeks of progress`}
                  icon={netChange <= 0 ? TrendingDown : TrendingUp}
                  action={
                    weightHistory.length >= 2 ? (
                      <span
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          netChange <= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-rose-500'
                        }`}
                      >
                        {netChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {netChange > 0 ? '+' : ''}
                        {netChange} kg
                      </span>
                    ) : null
                  }
                />
                <div className="px-2 pb-4 pt-4">
                  {weightHistory.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={weightHistory} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cpWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#71717a" stopOpacity={0.32} />
                            <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" domain={['dataMin - 0.5', 'dataMax + 0.5']} width={38} />
                        <RTooltip content={<ChartTooltip suffix=" kg" />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                        <Area type="monotone" dataKey="weight" name="Weight" stroke="#71717a" strokeWidth={2.5} fill="url(#cpWeight)" dot={{ r: 3, fill: '#71717a' }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="px-3 pb-2">
                      <EmptyState icon={Scale} title="No weight data yet" subtitle="Logged check-ins will populate this trend." />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Weekly check-ins */}
            <motion.div {...fade} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader title="Weekly Check-ins" subtitle="Most recent reviews" icon={ClipboardList} />
                <div className="px-5 pb-5 pt-3">
                  {recentCheckIns.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            <th className="pb-2 pr-3 font-semibold">Week</th>
                            <th className="pb-2 pr-3 font-semibold">Adherence</th>
                            <th className="pb-2 pr-3 font-semibold">Energy</th>
                            <th className="pb-2 pr-3 font-semibold">Sleep</th>
                            <th className="pb-2 pr-3 font-semibold">Hunger</th>
                            <th className="pb-2 font-semibold">Steps</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {recentCheckIns.map((ci) => (
                            <tr key={ci.week} className="text-gray-700 dark:text-gray-200">
                              <td className="py-2.5 pr-3 font-semibold text-gray-900 dark:text-white">{ci.week}</td>
                              <td className="py-2.5 pr-3">
                                <span
                                  className={`chip ${
                                    ci.adherence >= 85
                                      ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                                      : ci.adherence >= 70
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {ci.adherence}%
                                </span>
                              </td>
                              <td className="py-2.5 pr-3">{ci.energy}/5</td>
                              <td className="py-2.5 pr-3">{ci.sleep}/5</td>
                              <td className="py-2.5 pr-3">{ci.hunger}/5</td>
                              <td className="py-2.5">{ci.steps}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState icon={ClipboardList} title="No check-ins logged" subtitle="Weekly reviews will appear here." />
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Notes + coach comments */}
            <motion.div {...fade} transition={{ delay: 0.12 }}>
              <Card>
                <CardHeader title="Notes & Coaching" subtitle="Private working notes" icon={StickyNote} />
                <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <StickyNote size={13} /> Client notes
                    </label>
                    <textarea
                      className="input min-h-[120px] resize-y leading-relaxed"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Preferences, injuries, context…"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <MessageSquare size={13} /> Coach comments
                    </label>
                    <textarea
                      className="input min-h-[120px] resize-y leading-relaxed"
                      value={coachComments}
                      onChange={(e) => setCoachComments(e.target.value)}
                      placeholder="Programming notes, adjustments…"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-5 pb-5">
                  {saved && <span className="text-xs font-medium text-accent-600 dark:text-accent-400">Saved</span>}
                  <Button size="sm" onClick={save}>
                    <Save size={14} /> Save notes
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Side column */}
          <div className="space-y-6">
            {/* Intake & preferences (from signup) */}
            <motion.div {...fade} transition={{ delay: 0.04 }}>
              <Card>
                <CardHeader title="Intake & preferences" subtitle="From signup — build the plan around this" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pb-5 pt-4 text-sm">
                  {[
                    ['Experience', client.experience, false],
                    ['Training days', client.trainingDays ? `${client.trainingDays}/wk` : '', false],
                    ['Equipment', client.equipment, true],
                    ['Injuries / limitations', client.injuries, true],
                    ['Allergies / foods to avoid', client.allergies, true],
                  ].map(([k, v, full]) => (
                    <div key={k} className={full ? 'col-span-2' : ''}>
                      <dt className="text-xs text-gray-400">{k}</dt>
                      <dd className="mt-0.5 font-medium text-gray-800 dark:text-gray-200">
                        {v || <span className="font-normal text-gray-400">Not provided</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </motion.div>

            {/* Progress photos */}
            <motion.div {...fade} transition={{ delay: 0.06 }}>
              <Card>
                <CardHeader title="Progress Photos" subtitle="Uploaded by your client" icon={Camera} />
                <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">
                  {getProgressPhotos(client.id).length > 0 ? (
                    getProgressPhotos(client.id).map((ph) => (
                      <div key={ph.id} className="relative aspect-square overflow-hidden rounded-xl">
                        <img src={ph.dataUrl} alt={ph.label || ph.date} className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {ph.label || ph.date}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      {(client.photos || []).map((p) => (
                        <PhotoTile key={p} label={PHOTO_LABELS[p] || p} />
                      ))}
                      <PhotoTile upload />
                    </>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Meal plan history */}
            <motion.div {...fade} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader title="Meal Plan History" subtitle="Past & current plans" icon={ClipboardList} />
                <ul className="space-y-2 px-4 pb-5 pt-3">
                  {PLAN_HISTORY.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 transition hover:bg-gray-100 dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.kcal.toLocaleString()} kcal · {p.range}
                        </p>
                      </div>
                      <span
                        className={`chip shrink-0 ${
                          p.status === 'Active'
                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Compliance summary */}
            <motion.div {...fade} transition={{ delay: 0.14 }}>
              <Card className="p-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Compliance score</span>
                  <span className="font-bold text-gray-900 dark:text-white">{client.compliance}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${client.compliance}%`, background: complianceColor }} />
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  {client.compliance >= 85
                    ? 'Elite adherence — keep the plan steady.'
                    : client.compliance >= 70
                    ? 'Solid, with room to tighten consistency.'
                    : 'Adherence slipping — re-engage with a quick win.'}
                </p>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="card relative z-10 w-full max-w-md p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Delete client?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will permanently remove{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{client.name}</span> and all of their data.
                This can't be undone.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={doDelete}>
                  <Trash2 size={15} /> Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
