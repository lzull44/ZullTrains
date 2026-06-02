import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Utensils,
  Dumbbell,
  Salad,
  Moon,
  Flame,
  Lock,
  Check,
  PlayCircle,
  Printer,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  Badge,
  Button,
  ProgressBar,
  SectionHeader,
  EmptyState,
  PageTransition,
} from '../../components/ui/index.jsx'
import { MacroRing } from '../../components/ui/MacroRing.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { findFood } from '../../data/foods.js'
import { scaleFood, sumMacros, MACRO_COLORS } from '../../utils/macros.js'

const today = new Date().toISOString().slice(0, 10)
const demoUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent('how to ' + name)}`

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const TABS = [
  { key: 'meals', label: 'Meal Plan', icon: Utensils },
  { key: 'training', label: 'Training', icon: Dumbbell },
]

// small read-only macro cell
function MacroCell({ value, color, unit = 'g' }) {
  return (
    <span className="tabular-nums" style={{ color }}>
      {value}
      <span className="text-[10px] text-gray-400">{unit}</span>
    </span>
  )
}

function MealCard({ meal, macros, eaten, onToggleEaten }) {
  return (
    <Card className={eaten ? 'ring-1 ring-accent-500/40' : ''}>
      <CardHeader
        title={meal.name}
        subtitle={`${meal.rows.length} item${meal.rows.length === 1 ? '' : 's'}`}
        icon={Salad}
        action={
          <button
            type="button"
            onClick={onToggleEaten}
            aria-pressed={eaten}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              eaten
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-full border ${
                eaten
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : 'border-gray-300 dark:border-white/20'
              }`}
            >
              {eaten && <Check size={11} strokeWidth={3} />}
            </span>
            Eaten
          </button>
        }
      />
      <div className={`px-5 pb-2 pt-1 transition ${eaten ? 'opacity-60' : ''}`}>
        {/* header row */}
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b border-gray-100 px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:border-white/5 sm:grid">
          <span>Food</span>
          <span className="w-12 text-right">Grams</span>
          <span className="w-12 text-right">Cal</span>
          <span className="w-12 text-right">P</span>
          <span className="w-12 text-right">C</span>
          <span className="w-12 text-right">F</span>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-white/5">
          {meal.rows.map((row) => {
            const food = findFood(row.foodId)
            const m = scaleFood(food, row.grams)
            return (
              <li
                key={row.id}
                className="grid grid-cols-2 items-center gap-x-3 gap-y-1 px-1 py-2.5 text-sm sm:grid-cols-[1fr_auto_auto_auto_auto_auto]"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {food ? food.name : 'Unknown food'}
                </span>
                <span className="w-12 text-right tabular-nums text-gray-500 dark:text-gray-400">
                  {row.grams}g
                </span>
                <span className="hidden w-12 text-right tabular-nums text-gray-700 dark:text-gray-200 sm:block">
                  {m.calories}
                </span>
                <span className="hidden w-12 text-right sm:block">
                  <MacroCell value={m.protein} color={MACRO_COLORS.protein} />
                </span>
                <span className="hidden w-12 text-right sm:block">
                  <MacroCell value={m.carbs} color={MACRO_COLORS.carbs} />
                </span>
                <span className="hidden w-12 text-right sm:block">
                  <MacroCell value={m.fat} color={MACRO_COLORS.fat} />
                </span>
                {/* mobile macro summary */}
                <span className="col-span-2 flex gap-3 text-xs sm:hidden">
                  <span className="text-gray-500 dark:text-gray-400">{m.calories} kcal</span>
                  <MacroCell value={m.protein} color={MACRO_COLORS.protein} />
                  <MacroCell value={m.carbs} color={MACRO_COLORS.carbs} />
                  <MacroCell value={m.fat} color={MACRO_COLORS.fat} />
                </span>
              </li>
            )
          })}
        </ul>
        {/* meal totals */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 py-3 dark:border-white/5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Meal total</span>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span className="text-gray-900 dark:text-white">{macros.calories} kcal</span>
            <MacroCell value={macros.protein} color={MACRO_COLORS.protein} />
            <MacroCell value={macros.carbs} color={MACRO_COLORS.carbs} />
            <MacroCell value={macros.fat} color={MACRO_COLORS.fat} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function MealPlan({ meals, mealMacros, dailyTotals, targets, mealLog, onToggleEaten }) {
  if (!meals || meals.length === 0) {
    return (
      <EmptyState
        icon={Utensils}
        title="Your coach hasn't assigned a plan yet"
        subtitle="Once Coach Zull builds your meal plan it will appear here."
      />
    )
  }

  const rings = [
    { key: 'calories', label: 'Calories', value: dailyTotals.calories, max: targets.calories, unit: '' },
    { key: 'protein', label: 'Protein', value: dailyTotals.protein, max: targets.protein, unit: 'g' },
    { key: 'carbs', label: 'Carbs', value: dailyTotals.carbs, max: targets.carbs, unit: 'g' },
    { key: 'fat', label: 'Fat', value: dailyTotals.fat, max: targets.fat, unit: 'g' },
  ]

  const eatenCount = meals.filter((m) => mealLog[m.id]).length
  const adherence = meals.length ? Math.round((eatenCount / meals.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Daily totals vs target */}
      <motion.div variants={item}>
        <Card>
          <CardHeader title="Daily totals vs target" subtitle="How your full day adds up" icon={Flame} />
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            {rings.map((r) => (
              <div key={r.key} className="flex flex-col items-center">
                <MacroRing
                  value={r.value}
                  max={r.max}
                  size={104}
                  stroke={10}
                  color={MACRO_COLORS[r.key]}
                  label={r.label}
                  unit={r.unit}
                />
                <span className="mt-2 text-xs text-gray-400">
                  of {r.max}
                  {r.unit}
                </span>
              </div>
            ))}
          </div>
          {/* Today's adherence */}
          <div className="border-t border-gray-100 px-5 py-4 dark:border-white/5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Today&apos;s adherence
              </span>
              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {eatenCount}/{meals.length} meals &middot; {adherence}%
              </span>
            </div>
            <ProgressBar value={adherence} max={100} color={MACRO_COLORS.protein} />
          </div>
        </Card>
      </motion.div>

      {/* Meals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {meals.map((meal) => (
          <motion.div key={meal.id} variants={item}>
            <MealCard
              meal={meal}
              macros={mealMacros(meal)}
              eaten={!!mealLog[meal.id]}
              onToggleEaten={() => onToggleEaten(meal.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ExerciseRow({ ex, log, onSetLog }) {
  const done = !!log.done
  const savedSet = (log.sets && log.sets[0]) || {}
  const [weight, setWeight] = useState(savedSet.weight ?? '')
  const [reps, setReps] = useState(savedSet.reps ?? '')

  const saveSet = (w, r) => onSetLog({ sets: [{ weight: w, reps: r }] })

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 py-2.5 text-sm sm:grid-cols-[auto_1fr_auto_auto]">
      {/* done checkbox */}
      <button
        type="button"
        onClick={() => onSetLog({ done: !done })}
        aria-pressed={done}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        className={`grid h-5 w-5 place-items-center rounded-md border transition ${
          done
            ? 'border-accent-500 bg-accent-500 text-white'
            : 'border-gray-300 text-transparent hover:border-accent-400 dark:border-white/20'
        }`}
      >
        <Check size={13} strokeWidth={3} />
      </button>

      {/* name + demo link + prescription */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate font-medium text-gray-900 dark:text-gray-100 ${
              done ? 'line-through opacity-60' : ''
            }`}
          >
            {ex.name}
          </span>
          <a
            href={demoUrl(ex.name)}
            target="_blank"
            rel="noreferrer"
            title="Watch demo"
            aria-label={`Watch demo for ${ex.name}`}
            className="shrink-0 text-gray-400 transition hover:text-accent-600 dark:hover:text-accent-400"
          >
            <PlayCircle size={16} />
          </a>
        </div>
        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {ex.sets} &times; {ex.reps} &middot; RPE {ex.rpe}
        </span>
      </div>

      {/* log inputs: top-set weight + reps */}
      <div className="col-span-3 flex items-center gap-2 sm:col-span-1 sm:col-start-3">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => saveSet(weight, reps)}
          placeholder="kg"
          aria-label={`Weight for ${ex.name}`}
          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums text-gray-900 outline-none transition focus:border-accent-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
        <span className="text-xs text-gray-400">&times;</span>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => saveSet(weight, reps)}
          placeholder="reps"
          aria-label={`Reps for ${ex.name}`}
          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums text-gray-900 outline-none transition focus:border-accent-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      </div>
    </li>
  )
}

function Training({ workout, workoutLog, onSetLog }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  if (!workout || workout.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No training plan assigned yet"
        subtitle="Once Coach Zull builds your workout split it will show up here."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {workout.map((day) => {
        const isToday = day.day === today
        const isRest = day.exercises.length === 0
        const doneCount = day.exercises.filter((ex) => workoutLog[ex.name]?.done).length
        return (
          <motion.div key={day.day} variants={item}>
            <Card
              className={`h-full ${isToday ? 'ring-2 ring-accent-500/40' : ''} ${
                isRest ? 'bg-gray-50/60 dark:bg-white/[0.02]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      isRest
                        ? 'bg-gray-100 text-gray-400 dark:bg-white/5'
                        : 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                    }`}
                  >
                    {isRest ? <Moon size={18} /> : <Dumbbell size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{day.day}</h3>
                      {isToday && (
                        <Badge className="bg-accent-500/15 text-accent-600 dark:text-accent-400">Today</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{day.focus}</p>
                  </div>
                </div>
                {!isRest && (
                  <span className="shrink-0 text-xs font-medium tabular-nums text-gray-400">
                    {doneCount}/{day.exercises.length} done
                  </span>
                )}
              </div>

              {isRest ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  Rest / recovery
                </div>
              ) : (
                <div className="px-5 pb-4 pt-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:border-white/5">
                    <span>Exercise</span>
                    <span>Log top set</span>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {day.exercises.map((ex) => (
                      <ExerciseRow
                        key={ex.name}
                        ex={ex}
                        log={workoutLog[ex.name] || {}}
                        onSetLog={(data) => onSetLog(ex.name, data)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function ClientPlan() {
  const [tab, setTab] = useState('meals')
  const { user } = useAuth()
  const {
    getClientPlan,
    mealMacros,
    getMealLog,
    toggleMealEaten,
    getWorkoutLog,
    setExerciseLog,
  } = useAppData()
  const cid = user.clientId
  const plan = getClientPlan(cid)
  const meals = plan.meals
  const targets = plan.targets
  const dailyTotals = sumMacros(meals.flatMap((m) => m.rows.map((r) => scaleFood(findFood(r.foodId), r.grams))))

  const mealLog = getMealLog(cid, today)
  const workoutLog = getWorkoutLog(cid, today)

  return (
    <PageTransition>
      <SectionHeader
        title="My Plan"
        subtitle="Your coach-assigned nutrition & training — read-only"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <Lock size={12} /> Assigned by {`Coach Zull`}
            </span>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={14} className="mr-1.5" /> Print plan
            </Button>
          </div>
        }
      />

      {/* Segmented tabs */}
      <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'text-accent-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="plan-tab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      <motion.div
        key={tab}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {tab === 'meals' ? (
          <MealPlan
            meals={meals}
            mealMacros={mealMacros}
            dailyTotals={dailyTotals}
            targets={targets}
            mealLog={mealLog}
            onToggleEaten={(mealId) => toggleMealEaten(cid, today, mealId)}
          />
        ) : (
          <Training
            workout={plan.workout}
            workoutLog={workoutLog}
            onSetLog={(name, data) => setExerciseLog(cid, today, name, data)}
          />
        )}
      </motion.div>
    </PageTransition>
  )
}
