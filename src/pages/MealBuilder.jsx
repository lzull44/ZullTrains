import { useRef, useState } from 'react'
import { Reorder } from 'framer-motion'
import {
  Wand2, Plus, Save, Copy, Trash, RefreshCw, ChevronDown, GripVertical, UserCheck, Check,
} from 'lucide-react'

import {
  Button, SectionHeader, Tooltip, EmptyState, PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import MealCard from '../components/mealbuilder/MealCard.jsx'
import LiveMacroPanel from '../components/mealbuilder/LiveMacroPanel.jsx'
import CoachAdjustments from '../components/mealbuilder/CoachAdjustments.jsx'
import AutoBuildModal from '../components/mealbuilder/AutoBuildModal.jsx'

let _did = 0
const did = (p) => `${p}-d${Date.now()}-${++_did}`

export default function MealBuilder() {
  const {
    meals, setMeals, addMeal, clearAllMeals, resetMeals,
    mealTemplates, saveTemplate, loadTemplate,
    clients, targets, assignMealPlan, assignClientTargets,
  } = useAppData()

  const [autoOpen, setAutoOpen] = useState(false)
  const [tplOpen, setTplOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')
  const tplRef = useRef(null)

  // Assign the current plan (meals + macro targets) to a specific client.
  const assignToClient = (c) => {
    assignMealPlan(c.id, meals)
    assignClientTargets(c.id, targets)
    setAssignOpen(false)
    setAssignMsg(`Plan assigned to ${c.name}`)
    setTimeout(() => setAssignMsg(''), 2600)
  }

  const handleSaveTemplate = () => {
    const name = window.prompt('Template name', `Plan ${mealTemplates.length + 1}`)
    if (name && name.trim()) saveTemplate(name.trim())
  }

  // Duplicate the whole current plan: append fresh copies of every meal with new ids.
  const duplicatePlan = () => {
    setMeals((prev) => [
      ...prev,
      ...prev.map((m) => ({
        id: did('m'),
        name: `${m.name} (copy)`,
        rows: m.rows.map((r) => ({ id: did('r'), foodId: r.foodId, grams: r.grams })),
      })),
    ])
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all foods from every meal? Meals stay, rows are emptied.')) clearAllMeals()
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => setAutoOpen(true)}
        className="bg-gradient-to-r from-accent-600 to-zinc-500 hover:from-accent-700 hover:to-zinc-600"
      >
        <Wand2 size={15} /> Auto-Build (AI)
      </Button>
      {/* Assign to client dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAssignOpen((o) => !o)}
          onBlur={() => setTimeout(() => setAssignOpen(false), 150)}
        >
          <UserCheck size={15} /> Assign to client <ChevronDown size={14} />
        </Button>
        {assignOpen && (
          <div className="absolute right-0 z-30 mt-1 max-h-72 w-60 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lift dark:border-white/10 dark:bg-[#15181d]">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Assign plan + macros to
            </p>
            {clients.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => assignToClient(c)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-gray-200 dark:hover:text-accent-300"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: c.color }}>
                  {c.avatar}
                </span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {assignMsg && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2.5 py-1.5 text-xs font-semibold text-accent-600 dark:text-accent-400">
          <Check size={14} /> {assignMsg}
        </span>
      )}

      <Button variant="ghost" size="sm" onClick={addMeal}>
        <Plus size={15} /> Add Meal
      </Button>
      <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
        <Save size={15} /> Save Template
      </Button>

      {/* Load template dropdown */}
      <div className="relative" ref={tplRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTplOpen((o) => !o)}
          onBlur={() => setTimeout(() => setTplOpen(false), 150)}
        >
          Load Template <ChevronDown size={14} />
        </Button>
        {tplOpen && (
          <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lift dark:border-white/10 dark:bg-[#15181d]">
            {mealTemplates.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No saved templates yet.</p>
            ) : (
              mealTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={() => { loadTemplate(t.id); setTplOpen(false) }}
                  className="block w-full px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-gray-200 dark:hover:text-accent-300"
                >
                  {t.name}
                  <span className="ml-1 text-gray-400">· {t.meals.length} meals</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={duplicatePlan}>
        <Copy size={15} /> Duplicate Plan
      </Button>
      <Button variant="ghost" size="sm" onClick={handleClearAll}>
        <Trash size={15} /> Clear All
      </Button>
      <Button variant="ghost" size="sm" onClick={resetMeals}>
        <RefreshCw size={15} /> Reset
      </Button>
    </div>
  )

  return (
    <PageTransition>
      <div className="p-4 sm:p-6">
        <SectionHeader
          title="Meal Builder"
          subtitle="Build meals with live macro math"
          action={toolbar}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column: draggable list of meals */}
          <div className="lg:col-span-2">
            {meals.length === 0 ? (
              <EmptyState
                icon={Wand2}
                title="No meals yet"
                subtitle="Add a meal manually or let the AI Auto-Build a plan from your macro targets."
                action={
                  <Button variant="primary" size="sm" onClick={() => setAutoOpen(true)}>
                    <Wand2 size={15} /> Auto-Build a plan
                  </Button>
                }
              />
            ) : (
              <Reorder.Group
                axis="y"
                values={meals}
                onReorder={setMeals}
                className="space-y-4"
              >
                {meals.map((meal, index) => (
                  <Reorder.Item
                    key={meal.id}
                    value={meal}
                    dragListener
                    whileDrag={{ scale: 1.01, boxShadow: '0 18px 40px -12px rgba(0,0,0,0.35)' }}
                    className="list-none"
                  >
                    <MealCard meal={meal} index={index} />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
              <GripVertical size={13} /> Drag a meal by its handle to reorder. Macros recompute live as
              <span className="font-mono text-gray-500 dark:text-gray-400">macro × grams ÷ serving size</span>.
            </p>
          </div>

          {/* Side column: sticky live panel + coach tools */}
          <div className="space-y-6 lg:col-span-1">
            <LiveMacroPanel />
            <CoachAdjustments />
          </div>
        </div>

        <AutoBuildModal open={autoOpen} onClose={() => setAutoOpen(false)} />
      </div>
    </PageTransition>
  )
}
