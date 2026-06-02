import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts'
import {
  Scale,
  Flame,
  PieChart,
  Gauge,
  Target,
  TrendingDown,
} from 'lucide-react'

import {
  Card,
  CardHeader,
  Badge,
  SectionHeader,
  ProgressBar,
  PageTransition,
} from '../components/ui/index.jsx'
import { WEEKLY_TREND, MACRO_ADHERENCE } from '../data/analytics.js'
import { useAppData } from '../context/AppDataContext.jsx'
import { MACRO_COLORS } from '../utils/macros.js'

const RANGES = { '4W': 4, '8W': 8, '12W': 12 }

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

// Shared themed tooltip for Recharts.
function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur dark:border-white/10 dark:bg-gray-900/95">
      <div className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
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

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  stroke: 'currentColor',
  className: 'text-gray-400',
  tick: { fontSize: 11 },
}

function SegmentedControl({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/5">
      {Object.keys(RANGES).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === r
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {value === r && (
            <motion.span
              layoutId="analytics-range"
              className="absolute inset-0 rounded-lg bg-white shadow-card dark:bg-white/10"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{r}</span>
        </button>
      ))}
    </div>
  )
}

// Small KPI tile used in the weekly-averages strip.
function MiniStat({ icon: Icon, label, value, sub, tone = 'accent' }) {
  const tones = {
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/5 dark:bg-white/5">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{value}</div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</div>
      </div>
      {sub && <span className="ml-auto whitespace-nowrap text-xs font-semibold text-accent-600 dark:text-accent-400">{sub}</span>}
    </div>
  )
}

export default function Analytics() {
  const { clients } = useAppData()
  const [range, setRange] = useState('8W')

  // Slice the weekly window from the tail end of the trend series.
  const data = useMemo(() => WEEKLY_TREND.slice(-RANGES[range]), [range])

  const avgCompliance = useMemo(() => Math.round(avg(data.map((d) => d.compliance))), [data])
  const avgCalories = useMemo(() => Math.round(avg(data.map((d) => d.calories))), [data])
  const weeklyWeightChange = useMemo(() => {
    if (data.length < 2) return 0
    const delta = data[data.length - 1].weight - data[0].weight
    return Math.round((delta / (data.length - 1)) * 100) / 100
  }, [data])

  // Goal-progression: each client's compliance toward 100%, as radial bars.
  const goalData = useMemo(
    () =>
      [...clients]
        .sort((a, b) => b.compliance - a.compliance)
        .map((c) => ({ name: c.name, value: c.compliance, fill: c.color })),
    [clients],
  )

  return (
    <PageTransition>
      <div className="space-y-6">
        <SectionHeader
          title="Analytics"
          subtitle="Roster-wide performance and progression"
          action={<SegmentedControl value={range} onChange={setRange} />}
        />

        {/* Weekly averages strip */}
        <motion.div {...fade}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniStat icon={Gauge} tone="accent" label="Avg compliance" value={`${avgCompliance}%`} sub={`${range}`} />
            <MiniStat icon={Flame} tone="amber" label="Avg calories" value={avgCalories.toLocaleString()} sub="kcal/day" />
            <MiniStat
              icon={TrendingDown}
              tone="blue"
              label="Avg weekly weight Δ"
              value={`${weeklyWeightChange > 0 ? '+' : ''}${weeklyWeightChange} kg`}
              sub="per week"
            />
          </div>
        </motion.div>

        {/* Two-column chart grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weight trends */}
          <motion.div {...fade} transition={{ delay: 0.05 }}>
            <Card className="h-full">
              <CardHeader
                title="Weight Trends"
                subtitle="Average client bodyweight"
                icon={Scale}
                action={<Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400">{range}</Badge>}
              />
              <div className="px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis {...axisProps} domain={['dataMin - 0.5', 'dataMax + 0.5']} width={38} />
                    <RTooltip content={<ChartTooltip suffix=" kg" />} cursor={{ stroke: '#0ea5e9', strokeOpacity: 0.2 }} />
                    <Area type="monotone" dataKey="weight" name="Weight" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#anWeight)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Calories trends */}
          <motion.div {...fade} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader
                title="Calorie Trends"
                subtitle="Average intake per week"
                icon={Flame}
                action={<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">{range}</Badge>}
              />
              <div className="px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data} margin={{ top: 8, right: 16, left: -6, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis {...axisProps} domain={[2000, 2700]} width={42} />
                    <RTooltip content={<ChartTooltip suffix=" kcal" />} cursor={{ fill: '#f59e0b', fillOpacity: 0.08 }} />
                    <Bar dataKey="calories" name="Calories" fill={MACRO_COLORS.carbs} radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Macro adherence */}
          <motion.div {...fade} transition={{ delay: 0.15 }}>
            <Card className="h-full">
              <CardHeader title="Macro Adherence" subtitle="Daily target hit-rate by macro" icon={PieChart} />
              <div className="px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={MACRO_ADHERENCE} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                    <XAxis dataKey="day" {...axisProps} />
                    <YAxis {...axisProps} domain={[0, 120]} width={34} />
                    <RTooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: '#71717a', fillOpacity: 0.06 }} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(v) => <span className="capitalize text-gray-500 dark:text-gray-400">{v}</span>}
                    />
                    <Bar dataKey="protein" name="Protein" fill={MACRO_COLORS.protein} radius={[4, 4, 0, 0]} maxBarSize={16} />
                    <Bar dataKey="carbs" name="Carbs" fill={MACRO_COLORS.carbs} radius={[4, 4, 0, 0]} maxBarSize={16} />
                    <Bar dataKey="fat" name="Fat" fill={MACRO_COLORS.fat} radius={[4, 4, 0, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Compliance scores */}
          <motion.div {...fade} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader
                title="Compliance Scores"
                subtitle="Weekly roster adherence"
                icon={Gauge}
                action={
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent-600 dark:text-accent-400">
                    avg {avgCompliance}%
                  </span>
                }
              />
              <div className="px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/10" vertical={false} />
                    <XAxis dataKey="week" {...axisProps} />
                    <YAxis {...axisProps} domain={[60, 100]} width={32} />
                    <RTooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: '#71717a', strokeOpacity: 0.2 }} />
                    <ReferenceLine
                      y={avgCompliance}
                      stroke="#71717a"
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{ value: `avg ${avgCompliance}%`, position: 'insideTopRight', fontSize: 10, fill: '#71717a' }}
                    />
                    <Line type="monotone" dataKey="compliance" name="Compliance" stroke="#71717a" strokeWidth={2.5} dot={{ r: 3, fill: '#71717a' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Goal progression — radial bars + per-client bars */}
        <motion.div {...fade} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader
              title="Goal Progression"
              subtitle="Each client's compliance toward 100%"
              icon={Target}
            />
            <div className="grid grid-cols-1 gap-6 px-5 pb-6 pt-4 lg:grid-cols-2">
              {/* Radial overview */}
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <RadialBarChart
                    innerRadius="22%"
                    outerRadius="100%"
                    data={goalData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ className: 'fill-gray-100 dark:fill-white/5' }} dataKey="value" cornerRadius={8} />
                    <RTooltip content={<ChartTooltip suffix="%" />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              {/* Per-client progress bars */}
              <div className="space-y-4 self-center">
                {goalData.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.fill }} />
                        {c.name}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{c.value}%</span>
                    </div>
                    <ProgressBar value={c.value} max={100} color={c.fill} height={8} />
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
