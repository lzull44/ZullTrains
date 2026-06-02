import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Sparkles, RefreshCw, Check } from 'lucide-react'

import { Modal, Button, Tooltip } from '../ui/index.jsx'
import { MacroRing } from '../ui/MacroRing.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { FOODS, CATEGORIES, CATEGORY_STYLES } from '../../data/foods.js'
import { scaleFood, sumMacros, round, pct, MACRO_COLORS } from '../../utils/macros.js'

const GOALS = ['Fat Loss', 'Maintenance', 'Lean Bulk']

// ---- Time-of-day meal templates ----
// Default plan layout per meal count so meals follow common eating patterns.
const PLAN_BY_COUNT = {
  2: ['breakfast', 'dinner'],
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'snack', 'dinner'],
  5: ['breakfast', 'snack', 'lunch', 'snack', 'dinner'],
  6: ['breakfast', 'snack', 'lunch', 'snack', 'dinner', 'snack'],
}
const NAME_BY_TYPE = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
// Snacks are smaller; full meals (lunch/dinner) carry more macros.
const TYPE_WEIGHT = { breakfast: 1, lunch: 1.3, dinner: 1.3, snack: 0.55 }

// Which meal slots a food naturally belongs in (by food.name).
// Foods not listed default to ['lunch','dinner'] so they're treated as "full meal" foods.
const FOOD_MEAL_TAGS = {
  // proteins
  'Eggs': ['breakfast'],
  'Egg Whites': ['breakfast'],
  'Greek Yogurt': ['breakfast', 'snack'],
  'Whey Protein': ['breakfast', 'snack'],
  'Chicken Breast': ['lunch', 'dinner'],
  '96/4 Ground Beef': ['lunch', 'dinner'],
  'Salmon': ['lunch', 'dinner'],
  'Turkey Breast': ['breakfast', 'lunch', 'dinner'],
  'Tuna': ['lunch'],
  // carbs
  'Oats': ['breakfast'],
  'Cream of Rice': ['breakfast'],
  'Jasmine Rice (cooked)': ['lunch', 'dinner'],
  'White Rice (cooked)': ['lunch', 'dinner'],
  'Potato': ['lunch', 'dinner'],
  'Sweet Potato': ['lunch', 'dinner'],
  'Sourdough Bread': ['breakfast', 'lunch'],
  'Bagel': ['breakfast'],
  'Banana': ['breakfast', 'snack'],
  'Blueberries': ['breakfast', 'snack'],
  'Strawberries': ['breakfast', 'snack'],
  'Honey': ['breakfast', 'snack'],
  // fats
  'Peanut Butter': ['breakfast', 'snack'],
  'Almond Butter': ['breakfast', 'snack'],
  'Olive Oil': ['lunch', 'dinner'],
  'Avocado': ['breakfast', 'lunch', 'dinner'],
  'Butter': ['breakfast', 'lunch', 'dinner'],
  // vegetables (snacks skip veg entirely)
  'Broccoli': ['lunch', 'dinner'],
  'Frozen Vegetable Medley': ['lunch', 'dinner'],
  'Spinach': ['breakfast', 'lunch', 'dinner'],
  'Asparagus': ['lunch', 'dinner'],
}
const fitsMeal = (food, type) => {
  const tags = FOOD_MEAL_TAGS[food.name] || ['lunch', 'dinner']
  return tags.includes(type)
}

// pick a random element from an array (used to vary food choices per generate)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// pick a protein source, biased toward LEAN options (low fat per gram protein)
// so incidental fat from the protein doesn't blow past the fat target.
const pickLeanProtein = (arr) => {
  if (!arr.length) return undefined
  const ranked = [...arr].sort((a, b) => a.fat / (a.protein || 1) - b.fat / (b.protein || 1))
  const lean = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.6)))
  return pick(lean)
}

// Solve grams to hit `targetMacro` grams of a given nutrient for `food`.
// food.<key> is per food.servingSizeGrams, so grams = target / (perGram).
const solveGrams = (food, key, targetMacro) => {
  if (!food) return 0
  const perGram = food[key] / food.servingSizeGrams
  if (!perGram || perGram <= 0) return 0
  return targetMacro / perGram
}

const clampRound = (g) => {
  const r = Math.round(g / 5) * 5
  return Math.max(10, Math.min(500, r))
}

let _aid = 0
const aid = (p) => `${p}-ab${Date.now()}-${++_aid}`

export default function AutoBuildModal({ open, onClose }) {
  const { targets, setMeals, favorites } = useAppData()

  const [form, setForm] = useState(() => ({
    calories: targets.calories,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
    mealCount: 4,
    goal: 'Maintenance',
    trainingDay: true,
    favoriteIds: [...favorites],
    avoidIds: [],
  }))
  const [preview, setPreview] = useState(null) // built meals (for recap)

  const set = (patch) => setForm((p) => ({ ...p, ...patch }))

  const toggleFav = (id) =>
    set({
      favoriteIds: form.favoriteIds.includes(id)
        ? form.favoriteIds.filter((x) => x !== id)
        : [...form.favoriteIds, id],
      avoidIds: form.avoidIds.filter((x) => x !== id),
    })
  const toggleAvoid = (id) =>
    set({
      avoidIds: form.avoidIds.includes(id)
        ? form.avoidIds.filter((x) => x !== id)
        : [...form.avoidIds, id],
      favoriteIds: form.favoriteIds.filter((x) => x !== id),
    })

  // ---- The fitter ----
  // Picks one protein/carb/fat/veg food per meal, then iteratively solves grams.
  // Each macro accounts for what the OTHER foods in the meal already contribute
  // (e.g. oats add protein, veg adds carbs) so totals converge to target instead
  // of overshooting. Protein -> carbs -> fat, repeated until stable.
  const generate = () => {
    const n = Math.max(2, Math.min(6, Number(form.mealCount) || 4))

    const allowed = FOODS.filter((f) => !form.avoidIds.includes(f.id))
    // Pool of a category, optionally restricted to foods that fit a meal type
    // (e.g. breakfast picks oats/eggs, not chicken+rice). Favorites prioritized.
    const byCat = (cat, mealType = null) => {
      let inCat = allowed.filter((f) => f.category === cat)
      if (mealType) {
        const fit = inCat.filter((f) => fitsMeal(f, mealType))
        if (fit.length) inCat = fit
      }
      const favs = inCat.filter((f) => form.favoriteIds.includes(f.id))
      const poolPref = favs.length && Math.random() < 0.7 ? favs : inCat
      return poolPref.length ? poolPref : inCat
    }

    // Meal types per slot (e.g. 4 meals -> [breakfast, lunch, snack, dinner]).
    const types = PLAN_BY_COUNT[n] || Array(n).fill('lunch')

    // Distribute macros across meals: snacks get less, full meals more.
    // Training day adds a small carb boost on earlier meals on top of that.
    const baseWeights = types.map((t) => TYPE_WEIGHT[t] || 1)
    const baseSum = baseWeights.reduce((a, b) => a + b, 0)
    const carbWeights = baseWeights.map((w, i) => (form.trainingDay ? w * (1 + (n - i) * 0.08) : w))
    const carbSum = carbWeights.reduce((a, b) => a + b, 0)
    const share = (i) => ({
      protein: (form.protein * baseWeights[i]) / baseSum,
      carbs: (form.carbs * carbWeights[i]) / carbSum,
      fat: (form.fat * baseWeights[i]) / baseSum,
    })

    // Choose foods per meal once, biased by that meal's type.
    const sel = types.map((t) => {
      const vegPool = t === 'snack' ? [] : byCat('Vegetable', t)
      return {
        type: t,
        protein: pickLeanProtein(byCat('Protein', t)),
        carb: pick(byCat('Carb', t)),
        fat: t === 'snack' ? pick(byCat('Fat', t)) : pick(byCat('Fat', t)),
        veg: vegPool.length ? pick(vegPool) : null,
      }
    })

    const contrib = (food, g) => (food ? scaleFood(food, g) : { calories: 0, protein: 0, carbs: 0, fat: 0 })
    const grams = sel.map(() => ({ protein: 100, carb: 100, fat: 0, veg: 90 }))

    // iterate to convergence
    for (let iter = 0; iter < 5; iter += 1) {
      for (let i = 0; i < n; i += 1) {
        const s = share(i)
        const f = sel[i]
        const g = grams[i]
        g.veg = f.veg ? 90 : 0

        // protein source fills the gap left by carb/fat/veg protein
        const pOther = contrib(f.carb, g.carb).protein + contrib(f.fat, g.fat).protein + contrib(f.veg, g.veg).protein
        g.protein = f.protein ? clampRound(solveGrams(f.protein, 'protein', Math.max(0, s.protein - pOther))) : 0

        // carb source fills the gap left by protein/fat/veg carbs
        const cOther = contrib(f.protein, g.protein).carbs + contrib(f.fat, g.fat).carbs + contrib(f.veg, g.veg).carbs
        g.carb = f.carb ? clampRound(solveGrams(f.carb, 'carbs', Math.max(0, s.carbs - cOther))) : 0

        // fat source fills the gap; skip entirely if protein+carb+veg already cover it
        const fOther = contrib(f.protein, g.protein).fat + contrib(f.carb, g.carb).fat + contrib(f.veg, g.veg).fat
        const fatGap = s.fat - fOther
        g.fat = f.fat && fatGap > 3 ? clampRound(solveGrams(f.fat, 'fat', fatGap)) : 0
      }
    }

    // Name meals by slot ("Breakfast", "Lunch", "Snack 1" / "Snack 2" if multiple).
    const typeCounts = {}
    const totalsByType = types.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {})
    const meals = sel.map((f, i) => {
      const g = grams[i]
      const t = types[i]
      typeCounts[t] = (typeCounts[t] || 0) + 1
      const name =
        totalsByType[t] > 1
          ? `${NAME_BY_TYPE[t]} ${typeCounts[t]}`
          : NAME_BY_TYPE[t] || `Meal ${i + 1}`
      const rows = []
      if (f.protein && g.protein > 0) rows.push({ id: aid('r'), foodId: f.protein.id, grams: g.protein })
      if (f.carb && g.carb > 0) rows.push({ id: aid('r'), foodId: f.carb.id, grams: g.carb })
      if (f.fat && g.fat > 0) rows.push({ id: aid('r'), foodId: f.fat.id, grams: g.fat })
      if (f.veg && g.veg > 0) rows.push({ id: aid('r'), foodId: f.veg.id, grams: g.veg })
      return { id: aid('m'), name, rows }
    })

    setMeals(meals)
    setPreview(meals)
  }

  const recap = useMemo(() => {
    if (!preview) return null
    return sumMacros(
      preview.flatMap((m) => m.rows.map((r) => scaleFood(FOODS.find((x) => x.id === r.foodId), r.grams))),
    )
  }, [preview])

  const RING_KEYS = [
    { key: 'calories', label: 'Calories', unit: '' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbs', label: 'Carbs', unit: 'g' },
    { key: 'fat', label: 'Fat', unit: 'g' },
  ]

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-zinc-400 text-white shadow-sm shadow-accent-600/30">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-Build Meal Plan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI fits foods to the target macros across your meals
          </p>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
        {/* Macro targets */}
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">Targets</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RING_KEYS.map((m) => (
              <label key={m.key} className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: MACRO_COLORS[m.key] }} />
                  {m.label}
                </span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={form[m.key]}
                  onChange={(e) => set({ [m.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Meal count + goal + training toggle */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">Number of meals</span>
            <select
              className="input"
              value={form.mealCount}
              onChange={(e) => set({ mealCount: Number(e.target.value) })}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} meals</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">Goal type</span>
            <select className="input" value={form.goal} onChange={(e) => set({ goal: e.target.value })}>
              {GOALS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <div className="block">
            <span className="mb-1 block text-[11px] font-semibold text-gray-500 dark:text-gray-400">Day type</span>
            <div className="flex rounded-xl border border-gray-200 p-1 dark:border-white/10">
              {[
                { v: true, label: 'Training' },
                { v: false, label: 'Rest' },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => set({ trainingDay: d.v })}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                    form.trainingDay === d.v
                      ? 'bg-accent-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {form.trainingDay && (
          <p className="-mt-2 text-[11px] text-accent-600 dark:text-accent-400">
            Training day: carbs skewed toward earlier (peri-workout) meals.
          </p>
        )}

        {/* Favorite / avoid food chips */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Food preferences</span>
            <span className="text-[11px] text-gray-400">tap once = favor · twice = avoid</span>
          </div>
          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => {
              const inCat = FOODS.filter((f) => f.category === cat)
              return (
                <div key={cat}>
                  <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[cat]?.dot}`} />
                    {CATEGORY_STYLES[cat]?.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {inCat.map((f) => {
                      const fav = form.favoriteIds.includes(f.id)
                      const avoid = form.avoidIds.includes(f.id)
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => (avoid ? toggleAvoid(f.id) : fav ? toggleAvoid(f.id) : toggleFav(f.id))}
                          className={`chip border transition ${
                            avoid
                              ? 'border-rose-400 bg-rose-500/10 text-rose-600 line-through dark:text-rose-400'
                              : fav
                                ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-300'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-white/10 dark:text-gray-400'
                          }`}
                        >
                          {fav && <Check size={11} />}
                          {f.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recap after generate */}
        {recap && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/5 dark:bg-white/[0.03]"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <Wand2 size={14} className="text-accent-600 dark:text-accent-400" />
              Generated fit vs targets
            </div>
            <div className="flex flex-wrap items-center justify-around gap-3">
              {RING_KEYS.map((m) => (
                <MacroRing
                  key={m.key}
                  value={recap[m.key]}
                  max={form[m.key]}
                  size={m.key === 'calories' ? 92 : 76}
                  stroke={m.key === 'calories' ? 9 : 8}
                  color={MACRO_COLORS[m.key]}
                  label={m.label}
                  unit={m.unit}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400 sm:grid-cols-4">
              {RING_KEYS.map((m) => (
                <div key={m.key} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                    {pct(recap[m.key], form[m.key])}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-accent-600 dark:text-accent-400">
              Meals written to the builder — close to review and fine-tune.
            </p>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/5">
        <Tooltip label="Re-run to shuffle food choices">
          <span className="text-[11px] text-gray-400">Each generate reshuffles foods.</span>
        </Tooltip>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            {recap ? 'Done' : 'Cancel'}
          </Button>
          <Button variant="primary" size="md" onClick={generate}>
            {recap ? <RefreshCw size={15} /> : <Sparkles size={15} />}
            {recap ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
