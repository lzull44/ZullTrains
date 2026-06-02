import { Plus, Minus, Settings2 } from 'lucide-react'

import { Card, Button, Tooltip } from '../ui/index.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import {
  applyCalorieDelta,
  caloriesFromMacros,
  MACRO_PRESETS,
  MACRO_COLORS,
} from '../../utils/macros.js'

const DELTAS = [
  { label: '+200', value: 200 },
  { label: '+100', value: 100 },
  { label: '-100', value: -100 },
  { label: '-200', value: -200 },
]

const FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
]

// Loose match: a preset is "active" when all four macros equal the current targets.
const matchPreset = (targets) =>
  Object.entries(MACRO_PRESETS).find(([, p]) =>
    p.calories === targets.calories &&
    p.protein === targets.protein &&
    p.carbs === targets.carbs &&
    p.fat === targets.fat,
  )?.[0]

export default function CoachAdjustments() {
  const { targets, setTargets } = useAppData()
  const activePreset = matchPreset(targets)

  const handleField = (key, raw) => {
    const v = raw === '' ? 0 : Number(raw)
    if (key === 'calories') {
      // Apply the delta vs current calories using carb-first logic.
      setTargets(applyCalorieDelta(targets, v - targets.calories))
      return
    }
    // Editing a macro recomputes calories from the 4/4/9 split.
    const next = { ...targets, [key]: v }
    setTargets({ ...next, calories: caloriesFromMacros(next.protein, next.carbs, next.fat) })
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
          <Settings2 size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Coach Adjustments</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tune the client's daily targets</p>
        </div>
      </div>

      {/* Quick calorie deltas */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Quick calorie change</span>
          <Tooltip label="Added calories go to carbs first, then protein; fats stay stable.">
            <span className="grid h-4 w-4 cursor-help place-items-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">
              ?
            </span>
          </Tooltip>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DELTAS.map((d) => (
            <Button
              key={d.label}
              variant={d.value > 0 ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setTargets(applyCalorieDelta(targets, d.value))}
              className="justify-center"
            >
              {d.value > 0 ? <Plus size={12} /> : <Minus size={12} />}
              {Math.abs(d.value)}
            </Button>
          ))}
        </div>
      </div>

      {/* Manual fields */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <span className="h-2 w-2 rounded-full" style={{ background: MACRO_COLORS[f.key] }} />
              {f.label}
            </span>
            <div className="relative">
              <input
                type="number"
                min={0}
                className="input pr-10"
                value={targets[f.key]}
                onChange={(e) => handleField(f.key, e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{f.unit}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Presets */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-300">Goal presets</span>
        <div className="flex flex-wrap gap-2">
          {Object.keys(MACRO_PRESETS).map((name) => {
            const active = activePreset === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => setTargets(MACRO_PRESETS[name])}
                className={`chip border transition ${
                  active
                    ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                    : 'border-gray-200 text-gray-600 hover:border-accent-400 hover:text-accent-600 dark:border-white/10 dark:text-gray-300 dark:hover:text-accent-400'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
