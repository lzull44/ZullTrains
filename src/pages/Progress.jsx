import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Gauge,
  Camera,
  Ruler,
  Target,
  ArrowRight,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  StatCard,
  Avatar,
  Badge,
  SectionHeader,
  EmptyState,
  PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

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

// Mock body measurements derived from the client (deterministic per id).
function measurementsFor(client) {
  // Seed off compliance + weight so each client differs but is stable.
  const w = client.weight || 75
  const drop = client.goal === 'Lean Bulk' ? -1 : 1 // bulk grows, others trim
  return [
    { part: 'Chest', start: Math.round(w + 18), current: Math.round(w + 18 - drop * 1.5) },
    { part: 'Waist', start: Math.round(w + 4), current: Math.round(w + 4 - drop * 3) },
    { part: 'Arms', start: Math.round(w * 0.45), current: Math.round(w * 0.45 + (drop < 0 ? 1.2 : -0.4)) },
    { part: 'Thighs', start: Math.round(w * 0.72), current: Math.round(w * 0.72 - drop * 1.8) },
  ]
}

function PhotoCard({ label, color }) {
  return (
    <div className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
      <div
        className="absolute inset-0 backdrop-blur-[1px]"
        style={{ background: `linear-gradient(135deg, ${color}33, ${color}10)` }}
      />
      <div className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-white/70 text-gray-500 shadow-sm dark:bg-white/10 dark:text-gray-300">
        <Camera size={18} />
      </div>
      <span className="relative z-10 mt-2 text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
    </div>
  )
}

export default function Progress() {
  const { clients } = useAppData()
  const [selectedId, setSelectedId] = useState(clients[0]?.id || null)

  const client = clients.find((c) => c.id === selectedId) || clients[0]

  const weightHistory = client?.weightHistory || []
  const checkIns = client?.checkIns || []

  const { startW, currentW, netChange } = useMemo(() => {
    if (weightHistory.length < 1) return { startW: client?.weight || 0, currentW: client?.weight || 0, netChange: 0 }
    const s = weightHistory[0].weight
    const c = weightHistory[weightHistory.length - 1].weight
    return { startW: s, currentW: c, netChange: Math.round((c - s) * 10) / 10 }
  }, [weightHistory, client])

  const complianceData = useMemo(
    () => checkIns.map((ci) => ({ week: ci.week, adherence: ci.adherence })),
    [checkIns],
  )

  const measurements = useMemo(() => (client ? measurementsFor(client) : []), [client])

  if (!client) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <SectionHeader title="Progress Tracker" subtitle="Body-weight progression, photos & streaks" />
          <EmptyState
            icon={Scale}
            title="No clients yet"
            subtitle="Add clients to your roster to start tracking progress."
          />
        </div>
      </PageTransition>
    )
  }

  const lossTone = netChange <= 0
  const weekLabels =
    weightHistory.length >= 2
      ? [weightHistory[0].week, weightHistory[weightHistory.length - 1].week]
      : ['Week 1', 'Latest']

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <SectionHeader title="Progress Tracker" subtitle="Body-weight progression, photos & streaks" />

        {/* Client selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {clients.map((c) => {
            const active = c.id === selectedId
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                }`}
              >
                <Avatar initials={c.avatar} color={c.color} size={26} />
                <span className="hidden sm:inline">{c.name}</span>
                <span className="sm:hidden">{c.avatar}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={Scale} accent="blue" label="Start weight" value={`${startW} kg`} sub={weekLabels[0]} />
              <StatCard icon={Scale} accent="violet" label="Current weight" value={`${currentW} kg`} sub="Latest logged" />
              <StatCard
                icon={lossTone ? TrendingDown : TrendingUp}
                accent={lossTone ? 'accent' : 'amber'}
                label="Net change"
                value={`${netChange > 0 ? '+' : ''}${netChange} kg`}
                delta={weightHistory.length >= 2 ? `${weightHistory.length} wks` : null}
                deltaTone={lossTone ? 'up' : 'down'}
                sub={client.goal}
              />
              <StatCard
                icon={Gauge}
                accent={client.compliance >= 85 ? 'accent' : client.compliance >= 70 ? 'amber' : 'rose'}
                label="Compliance"
                value={`${client.compliance}%`}
                sub="8-week average"
              />
            </div>

            {/* Weight trend (wide) */}
            <Card>
              <CardHeader
                title="Body-weight Progression"
                subtitle={`${client.name} · ${client.goal}`}
                icon={lossTone ? TrendingDown : TrendingUp}
                action={
                  weightHistory.length >= 2 ? (
                    <Badge
                      className={
                        lossTone
                          ? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }
                    >
                      {netChange > 0 ? '+' : ''}
                      {netChange} kg net
                    </Badge>
                  ) : null
                }
              />
              <div className="px-2 pb-4 pt-4">
                {weightHistory.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weightHistory} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="prgWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#71717a" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" domain={['dataMin - 0.5', 'dataMax + 0.5']} width={38} />
                      <RTooltip content={<ChartTooltip suffix=" kg" />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                      <Area type="monotone" dataKey="weight" name="Weight" stroke="#71717a" strokeWidth={2.5} fill="url(#prgWeight)" dot={{ r: 3, fill: '#71717a' }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="px-3 pb-2">
                    <EmptyState icon={Scale} title="Not enough weight data" subtitle="At least two logged weeks are needed to chart a trend." />
                  </div>
                )}
              </div>
            </Card>

            {/* Compliance trend + photo strip */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <motion.div {...fade} className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader title="Compliance Over Time" subtitle="Weekly adherence from check-ins" icon={Gauge} />
                  <div className="px-2 pb-4 pt-4">
                    {complianceData.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={complianceData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" domain={[0, 100]} width={34} />
                          <RTooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                          <Line type="monotone" dataKey="adherence" name="Adherence" stroke="#71717a" strokeWidth={2.5} dot={{ r: 3, fill: '#71717a' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="px-3 pb-2">
                        <EmptyState icon={Gauge} title="No check-in history" subtitle="Adherence trends appear after weekly check-ins." />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              <motion.div {...fade} transition={{ delay: 0.05 }}>
                <Card className="h-full">
                  <CardHeader title="Photo Comparison" subtitle="First vs latest" icon={Camera} />
                  <div className="flex items-center gap-3 px-5 pb-5 pt-4">
                    <div className="flex-1">
                      <PhotoCard label={weekLabels[0]} color={client.color} />
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-gray-300 dark:text-gray-600" />
                    <div className="flex-1">
                      <PhotoCard label={weekLabels[1] || 'Latest'} color="#71717a" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Measurements */}
            <motion.div {...fade} transition={{ delay: 0.08 }}>
              <Card>
                <CardHeader title="Body Measurements" subtitle="Start vs current (cm)" icon={Ruler} />
                <div className="px-5 pb-5 pt-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          <th className="pb-2 pr-3 font-semibold">Site</th>
                          <th className="pb-2 pr-3 font-semibold">Start</th>
                          <th className="pb-2 pr-3 font-semibold">Current</th>
                          <th className="pb-2 font-semibold">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {measurements.map((m) => {
                          const diff = Math.round((m.current - m.start) * 10) / 10
                          const isArm = m.part === 'Arms'
                          // For arms, growth is good; for others, reduction is good (unless bulk).
                          const good = client.goal === 'Lean Bulk' || isArm ? diff >= 0 : diff <= 0
                          return (
                            <tr key={m.part} className="text-gray-700 dark:text-gray-200">
                              <td className="py-2.5 pr-3 font-semibold text-gray-900 dark:text-white">{m.part}</td>
                              <td className="py-2.5 pr-3">{m.start} cm</td>
                              <td className="py-2.5 pr-3 font-medium">{m.current} cm</td>
                              <td className="py-2.5">
                                <span
                                  className={`chip ${
                                    good
                                      ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {diff > 0 ? '+' : ''}
                                  {diff} cm
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <Target size={13} /> Measurements are illustrative — log real tape readings each check-in.
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
