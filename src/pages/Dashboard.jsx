import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
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
  Users,
  Activity,
  Gauge,
  DollarSign,
  Bell,
  Clock,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Inbox,
  Hourglass,
} from 'lucide-react'

import {
  Card,
  CardHeader,
  StatCard,
  Avatar,
  Badge,
  SectionHeader,
  PageTransition,
  EmptyState,
} from '../components/ui/index.jsx'
import { MacroRing } from '../components/ui/MacroRing.jsx'
import { WEEKLY_TREND, MACRO_ADHERENCE } from '../data/analytics.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { MACRO_COLORS } from '../utils/macros.js'

// Shared themed tooltip for Recharts.
function ChartTooltip({ active, payload, label, suffix = '', formatter }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur dark:border-white/10 dark:bg-gray-900/95">
      <div className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="capitalize text-gray-500 dark:text-gray-400">{p.name || p.dataKey}</span>
          <span className="ml-auto font-semibold text-gray-900 dark:text-white">
            {formatter ? formatter(p.value) : p.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

const dueTone = (due) => {
  const d = due.toLowerCase()
  if (d.includes('overdue')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
  if (d.includes('today')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
}

// Initials from a full name — "Emma Novak" -> "EN"
const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

// Stable monochrome-tinted accent from a string (deterministic per name/id).
const colorFromKey = (key = '') => {
  const palette = ['#71717a', '#52525b', '#3f3f46', '#64748b', '#475569', '#6b7280']
  let h = 0
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

// "Time ago" relative string from a Date | ISO string | epoch ms.
const timeAgo = (input) => {
  if (input == null) return ''
  const t = typeof input === 'number' ? input : new Date(input).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  return `${w}w ago`
}

// Best-effort parse of a message "time" field (most seeds are pre-formatted strings;
// freshly-sent messages stamp "Just now"). Returns epoch ms, falling back to now-i so
// ordering remains stable when we can't recover a real timestamp.
const messageTimeMs = (msg, fallbackIndex = 0) => {
  if (!msg) return Date.now() - fallbackIndex
  const t = msg.timestamp || msg.createdAt || msg.at
  if (t) {
    const v = typeof t === 'number' ? t : new Date(t).getTime()
    if (!Number.isNaN(v)) return v
  }
  if (msg.time === 'Just now') return Date.now() - fallbackIndex
  // Unknown format — keep insertion order so newest messages still bubble up.
  return Date.now() - fallbackIndex * 60000
}

export default function Dashboard() {
  const {
    clients,
    leads,
    messages,
    getDailyLogs,
    getSubscription,
    targets,
    dailyTotals,
    demoMode,
  } = useAppData()

  // ---- KPI math from live state ----
  const total = clients.length

  // Build per-client subscription map once (context exposes getSubscription, not the raw object).
  const subs = clients.map((c) => ({ client: c, sub: getSubscription(c.id) }))
  const activePlans = subs.filter(({ sub }) => sub?.status === 'active').length
  const mrrNumber = subs.reduce((sum, { sub }) => {
    if (!sub || sub.status !== 'active' || sub.cadence !== 'per month') return sum
    const price = Number(sub.price) || 0
    return sum + price
  }, 0)
  const mrr = `$${mrrNumber.toLocaleString('en-US')}`

  const weekMs = 7 * 24 * 60 * 60 * 1000
  const newLeadsThisWeek = leads.filter(
    (l) => Date.now() - new Date(l.createdAt).getTime() < weekMs,
  ).length

  const avgCompliance = total
    ? Math.round(clients.reduce((s, c) => s + (c.compliance || 0), 0) / total)
    : 0

  // ---- Recent activity (newest first, max 6) from real sources ----
  const activity = []

  // Latest 3 messages across all threads (most recent message per thread, then sort).
  const lastPerThread = Object.entries(messages || {})
    .map(([cid, thread]) => {
      if (!Array.isArray(thread) || thread.length === 0) return null
      const last = thread[thread.length - 1]
      const client = clients.find((c) => c.id === cid)
      if (!client) return null
      return { cid, client, msg: last, ts: messageTimeMs(last, thread.length) }
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3)
  lastPerThread.forEach(({ cid, client, msg, ts }) => {
    activity.push({
      id: `msg-${cid}-${msg.id || ts}`,
      who: client.name,
      action: msg.from === 'client' ? 'sent you a message' : 'message thread updated',
      meta: msg.text ? (msg.text.length > 48 ? `${msg.text.slice(0, 48)}…` : msg.text) : 'New message',
      ts,
      avatar: initialsOf(client.name),
      color: client.color || colorFromKey(client.id),
      to: '/messages',
    })
  })

  // Latest 2 daily logs across all clients.
  const recentLogs = clients
    .flatMap((c) => {
      const logs = getDailyLogs(c.id) || []
      if (logs.length === 0) return []
      const last = logs[logs.length - 1]
      const ts = new Date(last.date).getTime()
      return [{ client: c, log: last, ts: Number.isNaN(ts) ? 0 : ts }]
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 2)
  recentLogs.forEach(({ client, log, ts }) => {
    const bits = []
    if (log.weight) bits.push(`${log.weight} kg`)
    if (log.steps) bits.push(`${Number(log.steps).toLocaleString()} steps`)
    activity.push({
      id: `log-${client.id}-${log.date}`,
      who: client.name,
      action: 'logged a day',
      meta: bits.join(' · ') || log.date,
      ts,
      avatar: initialsOf(client.name),
      color: client.color || colorFromKey(client.id),
      to: `/clients/${client.id}`,
    })
  })

  // Latest 2 leads.
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)
  recentLeads.forEach((l) => {
    activity.push({
      id: `lead-${l.id}`,
      who: 'New lead',
      action: l.name || 'Anonymous',
      meta: l.goal || l.status || 'new',
      ts: new Date(l.createdAt).getTime(),
      avatar: initialsOf(l.name || 'NL'),
      color: colorFromKey(l.id),
      to: '/leads',
    })
  })

  activity.sort((a, b) => (b.ts || 0) - (a.ts || 0))
  const recentActivity = activity.slice(0, 6)

  // ---- Trials ending in the next 7 days ----
  const now = Date.now()
  const trialsEnding = clients
    .map((c) => {
      const sub = getSubscription(c.id)
      if (!sub?.trialEndsAt) return null
      const end = new Date(sub.trialEndsAt + 'T23:59:59').getTime()
      const daysLeft = Math.ceil((end - now) / 86400000)
      if (daysLeft < -1 || daysLeft > 7) return null
      return { client: c, sub, daysLeft }
    })
    .filter(Boolean)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // ---- Check-in queue derived from clients with overdue logging ----
  // A client is "due" if their last daily log is >= 7 days old (or they've never logged).
  const checkinQueue = clients
    .map((c) => {
      const logs = getDailyLogs(c.id) || []
      if (logs.length === 0) {
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar || initialsOf(c.name),
          color: c.color || colorFromKey(c.id),
          due: 'No check-ins yet',
          daysSince: Infinity,
        }
      }
      const last = logs[logs.length - 1]
      const lastTs = new Date(last.date).getTime()
      const days = Math.floor((Date.now() - lastTs) / (24 * 60 * 60 * 1000))
      let due
      if (days >= 14) due = 'Overdue'
      else if (days >= 7) due = 'Due today'
      else if (days >= 5) due = 'Due soon'
      else return null
      return {
        id: c.id,
        name: c.name,
        avatar: c.avatar || initialsOf(c.name),
        color: c.color || colorFromKey(c.id),
        due,
        daysSince: days,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5)

  // ---- Macro adherence rings — average across the week ----
  const avgAdh = (key) =>
    Math.round(MACRO_ADHERENCE.reduce((s, d) => s + d[key], 0) / MACRO_ADHERENCE.length)
  const proteinAdh = avgAdh('protein')
  const carbsAdh = avgAdh('carbs')
  const fatAdh = avgAdh('fat')

  // ---- Weight net change across the trend window (seeded WEEKLY_TREND for now) ----
  const wStart = WEEKLY_TREND[0].weight
  const wEnd = WEEKLY_TREND[WEEKLY_TREND.length - 1].weight
  const wDelta = (wEnd - wStart).toFixed(1)

  const hasClients = total > 0
  const hasAnyLogs = clients.some((c) => (getDailyLogs(c.id) || []).length > 0)

  return (
    <PageTransition>
      <div className="space-y-6">
        <SectionHeader
          title="Dashboard"
          subtitle="Welcome back, Coach Zull — here's your roster at a glance"
          action={
            demoMode ? (
              <Badge className="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                Demo data shown · switch in Settings
              </Badge>
            ) : null
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            accent="accent"
            label="Total clients"
            value={total}
            delta={newLeadsThisWeek ? `+${newLeadsThisWeek} new leads` : null}
            deltaTone="up"
            sub={total === 0 ? 'No clients yet · share your landing page' : 'Across all plans'}
          />
          <StatCard
            icon={Activity}
            accent="blue"
            label="Active plans"
            value={activePlans}
            delta={total ? `${Math.round((activePlans / Math.max(total, 1)) * 100)}% active` : null}
            deltaTone="up"
            sub={
              total === 0
                ? 'No subscriptions yet'
                : `${Math.max(total - activePlans, 0)} need attention`
            }
          />
          <StatCard
            icon={Gauge}
            accent="violet"
            label="Avg compliance"
            value={`${avgCompliance}%`}
            delta={null}
            deltaTone="up"
            sub={total === 0 ? 'No clients to measure' : 'Roster-wide average'}
          />
          <StatCard
            icon={DollarSign}
            accent="amber"
            label="Monthly revenue"
            value={mrr}
            delta={null}
            deltaTone="up"
            sub={mrrNumber === 0 ? 'No active subscriptions' : 'MRR from active monthly plans'}
          />
        </div>

        {/* Main split: trends (2/3) + macros (1/3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly trends */}
          <motion.div {...fade} transition={{ delay: 0.05 }} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader
                title="Weekly Trends"
                subtitle="Roster compliance vs average calories"
                icon={TrendingUpIcon}
                action={
                  <Badge className="bg-accent-500/10 text-accent-700 dark:text-accent-300">
                    8-week window
                  </Badge>
                }
              />
              <div className="px-2 pb-4 pt-4">
                {hasClients ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={WEEKLY_TREND} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashCompliance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#71717a" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dashCalories" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} className="text-gray-400" stroke="currentColor" />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" domain={[60, 100]} width={32} />
                      <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" domain={[2000, 2700]} width={44} />
                      <RTooltip content={<ChartTooltip />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="compliance"
                        name="Compliance"
                        stroke="#71717a"
                        strokeWidth={2.5}
                        fill="url(#dashCompliance)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="calories"
                        name="Calories"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fill="url(#dashCalories)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="px-3 pb-2">
                    <EmptyState
                      icon={TrendingUpIcon}
                      title="No trend data yet"
                      subtitle="Your charts will fill in as clients check in."
                    />
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Macro adherence rings */}
          <motion.div {...fade} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader title="Macro Adherence" subtitle="Daily adherence percentages" icon={Gauge} />
              {hasClients ? (
                <>
                  <div className="flex flex-wrap items-center justify-around gap-4 px-5 pb-6 pt-6">
                    <MacroRing value={proteinAdh} max={100} size={104} stroke={10} color={MACRO_COLORS.protein} label="Protein" unit="%" />
                    <MacroRing value={carbsAdh} max={100} size={104} stroke={10} color={MACRO_COLORS.carbs} label="Carbs" unit="%" />
                    <MacroRing value={fatAdh} max={100} size={104} stroke={10} color={MACRO_COLORS.fat} label="Fat" unit="%" />
                  </div>
                  <div className="mx-5 mb-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    Today logged{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">{Math.round(dailyTotals.calories)}</span> /{' '}
                    {targets.calories} kcal across the roster's reference plan.
                  </div>
                </>
              ) : (
                <div className="p-5">
                  <EmptyState
                    icon={Gauge}
                    title="No adherence data"
                    subtitle="Macro rings will populate once clients start logging meals."
                  />
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Weight + check-ins + activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weight trend */}
          <motion.div {...fade} transition={{ delay: 0.12 }}>
            <Card className="h-full">
              <CardHeader
                title="Weight Trend"
                subtitle="Average client bodyweight"
                icon={TrendingDown}
                action={
                  hasClients ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent-600 dark:text-accent-400">
                      <TrendingDown size={14} /> {wDelta} kg
                    </span>
                  ) : null
                }
              />
              {hasClients ? (
                <>
                  <div className="px-2 pb-4 pt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={WEEKLY_TREND} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" domain={['dataMin - 0.5', 'dataMax + 0.5']} width={36} />
                        <RTooltip content={<ChartTooltip suffix=" kg" />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                        <Line type="monotone" dataKey="weight" name="Weight" stroke="#71717a" strokeWidth={2.5} dot={{ r: 3, fill: '#71717a' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="px-5 pb-5 text-xs text-gray-400 dark:text-gray-500">
                    Net {wDelta} kg over {WEEKLY_TREND.length} weeks — steady, sustainable progress.
                  </p>
                </>
              ) : (
                <div className="p-5">
                  <EmptyState
                    icon={TrendingDown}
                    title="No weight data yet"
                    subtitle="Bodyweight will trend here once clients start logging."
                  />
                </div>
              )}
            </Card>
          </motion.div>

          {/* Trials ending soon */}
          <motion.div {...fade} transition={{ delay: 0.14 }}>
            <Card className="h-full">
              <CardHeader
                title="Trials ending soon"
                subtitle={`${trialsEnding.length} trial${trialsEnding.length === 1 ? '' : 's'} in the next 7 days`}
                icon={Hourglass}
              />
              <div className="space-y-2.5 px-5 pb-5 pt-3">
                {trialsEnding.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    No active trials in the window. Activity here when a client signs up for the 2-Week Trial.
                  </p>
                ) : (
                  trialsEnding.map(({ client, sub, daysLeft }) => {
                    const urgent = daysLeft <= 3
                    return (
                      <Link
                        key={client.id}
                        to={`/clients/${client.id}`}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                          urgent
                            ? 'border-amber-500/40 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                            : 'border-gray-100 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                            style={{ background: client.color || colorFromKey(client.id) }}
                          >
                            {client.avatar || client.name?.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{client.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Trial ends {sub.trialEndsAt}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`chip font-semibold ${
                            urgent
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                          }`}
                        >
                          {daysLeft <= 0
                            ? daysLeft < 0 ? 'Ended' : 'Ends today'
                            : `${daysLeft}d left`}
                        </span>
                      </Link>
                    )
                  })
                )}
              </div>
            </Card>
          </motion.div>

          {/* Check-in queue */}
          <motion.div {...fade} transition={{ delay: 0.16 }}>
            <Card className="h-full">
              <CardHeader
                title="Check-in Queue"
                subtitle="Weekly reviews due"
                icon={Bell}
                action={
                  <Link to="/check-ins" className="text-xs font-semibold text-accent-600 hover:underline dark:text-accent-400">
                    View all
                  </Link>
                }
              />
              {checkinQueue.length > 0 ? (
                <ul className="space-y-1 px-3 pb-4 pt-2">
                  {checkinQueue.map((c, i) => (
                    <motion.li key={c.id} {...fade} transition={{ delay: 0.18 + i * 0.05 }}>
                      <Link
                        to="/check-ins"
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <Avatar initials={c.avatar} color={c.color} size={38} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-400">Weekly check-in</p>
                        </div>
                        <span className={`chip ${dueTone(c.due)}`}>{c.due}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="p-5">
                  <EmptyState
                    icon={Bell}
                    title="All caught up"
                    subtitle={
                      hasClients
                        ? 'Every client is up to date on check-ins.'
                        : 'No clients in the queue yet.'
                    }
                  />
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recent activity */}
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader title="Recent Activity" subtitle="Latest from your roster" icon={Clock} />
              {recentActivity.length > 0 ? (
                <ul className="relative px-5 pb-5 pt-3">
                  <span className="absolute left-[34px] top-4 bottom-6 w-px bg-gray-100 dark:bg-white/5" aria-hidden />
                  {recentActivity.map((a, i) => {
                    const row = (
                      <>
                        <Avatar initials={a.avatar} color={a.color} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            <span className="font-semibold">{a.who}</span>{' '}
                            <span className="text-gray-500 dark:text-gray-400">{a.action}</span>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="chip bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">{a.meta}</span>
                            <span className="text-[11px] text-gray-400">{timeAgo(a.ts)}</span>
                          </div>
                        </div>
                      </>
                    )
                    return (
                      <motion.li
                        key={a.id}
                        {...fade}
                        transition={{ delay: 0.22 + i * 0.05 }}
                        className="relative flex gap-3 pb-4 last:pb-0"
                      >
                        {a.to ? (
                          <Link
                            to={a.to}
                            className="flex flex-1 gap-3 rounded-lg -m-1 p-1 transition hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            {row}
                          </Link>
                        ) : (
                          row
                        )}
                      </motion.li>
                    )
                  })}
                </ul>
              ) : (
                <div className="p-5">
                  <EmptyState
                    icon={Inbox}
                    title="Nothing yet"
                    subtitle="Activity will appear as clients sign up and log."
                  />
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

// Silence unused-import lint noise when `hasAnyLogs` is referenced only conditionally
// in future iterations — keep the live signal close to where empty states live.
export const __dashboardHasAnyLogs = (ctx) =>
  Array.isArray(ctx?.clients) && ctx.clients.some((c) => (ctx.getDailyLogs?.(c.id) || []).length > 0)
