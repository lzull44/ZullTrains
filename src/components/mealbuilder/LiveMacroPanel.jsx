import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

import { Card, ProgressBar } from '../ui/index.jsx'
import { MacroRing } from '../ui/MacroRing.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { pct, round, MACRO_COLORS } from '../../utils/macros.js'

const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
]

function MetricRow({ label, unit, current, target }) {
  const over = current > target
  const remaining = round(target - current, label === 'Calories' ? 0 : 1)
  const percent = pct(current, target)
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          <span className={`font-semibold ${over ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
            {round(current, label === 'Calories' ? 0 : 1)}
          </span>{' '}
          / {target} {unit}
        </span>
      </div>
      <ProgressBar value={current} max={target} over={over} color={MACRO_COLORS[label.toLowerCase()]} height={7} />
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className={over ? 'font-semibold text-rose-500' : 'text-gray-400'}>
          {over ? `${Math.abs(remaining)} ${unit} over` : `${remaining} ${unit} left`}
        </span>
        <span className={`font-semibold ${over ? 'text-rose-500' : 'text-accent-600 dark:text-accent-400'}`}>{percent}%</span>
      </div>
    </div>
  )
}

export default function LiveMacroPanel() {
  const { dailyTotals, targets } = useAppData()

  const exceeded = MACROS.filter((m) => dailyTotals[m.key] > targets[m.key]).map((m) => ({
    label: m.label,
    by: round(dailyTotals[m.key] - targets[m.key], m.key === 'calories' ? 0 : 1),
    unit: m.unit,
  }))

  return (
    <Card className="p-5 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Daily Totals</h3>
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent-500" title="Live" />
      </div>

      {/* Rings */}
      <div className="mb-5 flex items-center justify-center">
        <MacroRing
          value={dailyTotals.calories}
          max={targets.calories}
          size={132}
          stroke={12}
          color={MACRO_COLORS.calories}
          label="Calories"
          unit=""
        />
      </div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {MACROS.slice(1).map((m) => (
          <div key={m.key} className="flex justify-center">
            <MacroRing
              value={dailyTotals[m.key]}
              max={targets[m.key]}
              size={84}
              stroke={8}
              color={MACRO_COLORS[m.key]}
              label={m.label}
              unit="g"
            />
          </div>
        ))}
      </div>

      {/* Over-target warning */}
      {exceeded.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Over target:{' '}
            {exceeded.map((e, i) => (
              <span key={e.label} className="font-semibold">
                {e.label} +{e.by}
                {e.unit}
                {i < exceeded.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </motion.div>
      )}

      {/* Metric bars */}
      <div className="space-y-3.5">
        {MACROS.map((m) => (
          <MetricRow key={m.key} label={m.label} unit={m.unit} current={dailyTotals[m.key]} target={targets[m.key]} />
        ))}
      </div>
    </Card>
  )
}
