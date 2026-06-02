import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Trash, GripVertical } from 'lucide-react'

import { Button, Tooltip } from '../ui/index.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { findFood, CATEGORIES, CATEGORY_STYLES } from '../../data/foods.js'
import { scaleFood, MACRO_COLORS, round } from '../../utils/macros.js'

const rowAnim = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

// A grouped <select> of every food, favorites starred and surfaced first per group.
function FoodSelect({ value, foods, favorites, onChange }) {
  return (
    <select className="input w-full min-w-[150px]" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select food…</option>
      {CATEGORIES.map((cat) => {
        const inCat = foods.filter((f) => f.category === cat)
        if (!inCat.length) return null
        // Favorites first within their category.
        const sorted = [...inCat].sort((a, b) => {
          const fa = favorites.includes(a.id) ? 0 : 1
          const fb = favorites.includes(b.id) ? 0 : 1
          return fa - fb || a.name.localeCompare(b.name)
        })
        return (
          <optgroup key={cat} label={CATEGORY_STYLES[cat]?.label || cat}>
            {sorted.map((f) => (
              <option key={f.id} value={f.id}>
                {favorites.includes(f.id) ? '★ ' : ''}
                {f.name}
              </option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}

export default function MealCard({ meal, index }) {
  const { foods, favorites, updateRow, removeRow, addRow, removeMeal, setMeals, mealMacros } = useAppData()
  const [editingName, setEditingName] = useState(false)

  const totals = mealMacros(meal)

  const renameMeal = (name) =>
    setMeals((p) => p.map((m) => (m.id === meal.id ? { ...m, name } : m)))

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/5">
        <Tooltip label="Drag to reorder">
          <button
            type="button"
            className="cursor-grab touch-none rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 active:cursor-grabbing dark:hover:bg-white/5"
            aria-label="Reorder meal"
          >
            <GripVertical size={18} />
          </button>
        </Tooltip>

        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-500/10 text-xs font-bold text-accent-600 dark:text-accent-400">
          {index + 1}
        </span>

        {editingName ? (
          <input
            autoFocus
            className="input max-w-[200px] py-1.5 text-sm font-semibold"
            value={meal.name}
            onChange={(e) => renameMeal(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="truncate text-sm font-semibold text-gray-900 transition hover:text-accent-600 dark:text-white dark:hover:text-accent-400"
            title="Click to rename"
          >
            {meal.name}
          </button>
        )}

        {/* Macro summary chip */}
        <span className="ml-auto hidden items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400 sm:inline-flex">
          <span className="font-semibold text-gray-900 dark:text-white">{round(totals.calories)}</span> kcal
          <span style={{ color: MACRO_COLORS.protein }}>{round(totals.protein, 1)}P</span>
          <span style={{ color: MACRO_COLORS.carbs }}>{round(totals.carbs, 1)}C</span>
          <span style={{ color: MACRO_COLORS.fat }}>{round(totals.fat, 1)}F</span>
        </span>

        <Tooltip label="Remove meal">
          <button
            type="button"
            onClick={() => removeMeal(meal.id)}
            className="ml-auto rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-500 sm:ml-0"
            aria-label="Remove meal"
          >
            <Trash size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-4 py-2 font-semibold">Food</th>
              <th className="px-2 py-2 font-semibold">Grams</th>
              <th className="px-2 py-2 text-right font-semibold">Cal</th>
              <th className="px-2 py-2 text-right font-semibold" style={{ color: MACRO_COLORS.protein }}>Protein</th>
              <th className="px-2 py-2 text-right font-semibold" style={{ color: MACRO_COLORS.carbs }}>Carbs</th>
              <th className="px-2 py-2 text-right font-semibold" style={{ color: MACRO_COLORS.fat }}>Fat</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {meal.rows.map((row) => {
                const food = findFood(row.foodId)
                const m = scaleFood(food, Number(row.grams) || 0)
                return (
                  <motion.tr
                    key={row.id}
                    {...rowAnim}
                    className="border-t border-gray-50 align-middle dark:border-white/5"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {food && (
                          <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_STYLES[food.category]?.dot || 'bg-gray-300'}`} />
                        )}
                        <FoodSelect
                          value={row.foodId}
                          foods={foods}
                          favorites={favorites}
                          onChange={(foodId) => updateRow(meal.id, row.id, { foodId })}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        className="input w-20 py-2 text-center"
                        value={row.grams}
                        onChange={(e) => updateRow(meal.id, row.id, { grams: e.target.value === '' ? '' : Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-gray-900 dark:text-white">{round(m.calories)}</td>
                    <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300">{round(m.protein, 1)}</td>
                    <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300">{round(m.carbs, 1)}</td>
                    <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300">{round(m.fat, 1)}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(meal.id, row.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                        aria-label="Remove food"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>

            {meal.rows.length === 0 && (
              <tr className="border-t border-gray-50 dark:border-white/5">
                <td colSpan={7} className="px-4 py-5 text-center text-xs text-gray-400">
                  No foods yet — add one below.
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer totals */}
          <tfoot>
            <tr className="border-t border-gray-100 bg-gray-50/60 text-sm font-semibold dark:border-white/5 dark:bg-white/[0.03]">
              <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">Meal totals</td>
              <td className="px-2 py-2.5" />
              <td className="px-2 py-2.5 text-right text-gray-900 dark:text-white">{round(totals.calories)}</td>
              <td className="px-2 py-2.5 text-right" style={{ color: MACRO_COLORS.protein }}>{round(totals.protein, 1)}</td>
              <td className="px-2 py-2.5 text-right" style={{ color: MACRO_COLORS.carbs }}>{round(totals.carbs, 1)}</td>
              <td className="px-2 py-2.5 text-right" style={{ color: MACRO_COLORS.fat }}>{round(totals.fat, 1)}</td>
              <td className="px-2 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add food */}
      <div className="px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => addRow(meal.id)}>
          <Plus size={15} /> Add Food
        </Button>
      </div>
    </motion.div>
  )
}
