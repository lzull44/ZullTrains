import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell, Sparkles, RefreshCw, Check, Save, ChevronDown, Target, Calendar, Zap,
} from 'lucide-react'

import {
  Card, Button, Badge, SectionHeader, EmptyState, Tooltip, PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { buildWorkout, MUSCLE_GROUPS } from '../data/exercises.js'

const DAYS_OPTIONS = [2, 3, 4, 5, 6]
const GOALS = ['Fat Loss', 'Maintenance', 'Lean Bulk']

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function WorkoutBuilder() {
  const { clients, assignWorkout, getClientPlan } = useAppData()

  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [priorityMuscles, setPriorityMuscles] = useState([])
  const [days, setDays] = useState(4)
  const [goal, setGoal] = useState('Maintenance')
  const [plan, setPlan] = useState(null)
  const [assigned, setAssigned] = useState(false)

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0]
  const existingWorkout = clientId ? getClientPlan(clientId).workout || [] : []
  const existingTrainingDays = existingWorkout.filter((d) => d.exercises?.length).length

  const trainingDays = useMemo(
    () => (plan ? plan.filter((d) => d.exercises.length > 0) : []),
    [plan],
  )

  const toggleMuscle = (m) => {
    setPriorityMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  const generate = () => {
    setPlan(buildWorkout({ priorityMuscles, days, goal }))
    setAssigned(false)
  }

  const handleAssign = () => {
    if (!plan || !clientId) return
    assignWorkout(clientId, plan)
    setAssigned(true)
    setTimeout(() => setAssigned(false), 4000)
  }

  return (
    <PageTransition>
      <SectionHeader
        title="Workout Builder"
        subtitle="AI-generate a training split and assign it to a client"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ----- Config panel ----- */}
        <div className="lg:col-span-5">
          <Card className="p-5 lg:sticky lg:top-6">
            {/* Client selector */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Target size={13} /> Client
              </label>
              <div className="relative mt-2">
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value)
                    setAssigned(false)
                  }}
                  className="input appearance-none pr-9"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.goal}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {selectedClient && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-white/5 dark:bg-white/5">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ background: selectedClient.color || '#71717a' }}
                  >
                    {selectedClient.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {selectedClient.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {existingTrainingDays > 0
                        ? `Currently assigned: ${existingTrainingDays}-day split`
                        : 'No split assigned yet'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Muscle groups */}
            <div className="mt-6">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Zap size={13} /> Muscle groups to prioritize
              </label>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Areas they want to bring up — these get more frequency &amp; volume.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((m) => {
                  const active = priorityMuscles.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMuscle(m)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'border-accent-500 bg-accent-500/10 text-accent-600 ring-1 ring-accent-500/40 dark:text-accent-300'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'
                      }`}
                    >
                      {active && <Check size={14} />}
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Training days */}
            <div className="mt-6">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Calendar size={13} /> Training days / week
              </label>
              <div className="mt-2 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`min-w-[40px] rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      days === d
                        ? 'bg-accent-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Goal
              </label>
              <div className="relative mt-2">
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input appearance-none pr-9"
                >
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Generate */}
            <div className="mt-7 flex gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={generate}
                className="flex-1 justify-center bg-gradient-to-r from-accent-600 to-zinc-500 hover:from-accent-700 hover:to-zinc-600"
              >
                <Sparkles size={17} /> Generate plan
              </Button>
              {plan && (
                <Tooltip label="Reshuffle the split">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={generate}
                    aria-label="Regenerate"
                  >
                    <RefreshCw size={17} />
                  </Button>
                </Tooltip>
              )}
            </div>
          </Card>
        </div>

        {/* ----- Preview ----- */}
        <div className="lg:col-span-7">
          {!plan ? (
            <Card className="p-5">
              <EmptyState
                icon={Dumbbell}
                title="No plan generated yet"
                subtitle="Pick the muscle groups to prioritize, set training days and goal, then hit Generate plan."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary + assign bar */}
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <Sparkles size={16} className="text-accent-600 dark:text-accent-400" />
                      {trainingDays.length} training days · {goal}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {priorityMuscles.length
                        ? `Prioritizing ${priorityMuscles.join(', ')}`
                        : 'Balanced full-body emphasis'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleAssign}
                    className={assigned ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                  >
                    {assigned ? <Check size={16} /> : <Save size={16} />}
                    {assigned
                      ? 'Assigned'
                      : `Assign to ${selectedClient?.name?.split(' ')[0] || 'client'}`}
                  </Button>
                </div>

                <AnimatePresence>
                  {assigned && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Check size={15} />
                        Assigned to {selectedClient?.name} ✓ — they&apos;ll see it in their portal.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Day cards */}
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              >
                {plan.map((day, i) => {
                  const rest = day.exercises.length === 0
                  return (
                    <motion.div key={`${day.day}-${i}`} variants={fadeUp}>
                      <Card className={`p-5 ${rest ? 'opacity-80' : ''}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`grid h-9 w-9 place-items-center rounded-xl ${
                                rest
                                  ? 'bg-gray-100 text-gray-400 dark:bg-white/5'
                                  : 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                              }`}
                            >
                              {rest ? <Calendar size={16} /> : <Dumbbell size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {day.day}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {day.focus}
                              </p>
                            </div>
                          </div>
                          {!rest && (
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {day.focus.split(' / ').map((g) =>
                                priorityMuscles.includes(g) ? (
                                  <Badge
                                    key={g}
                                    className="bg-accent-500/10 text-accent-600 dark:text-accent-300"
                                  >
                                    {g}
                                  </Badge>
                                ) : null,
                              )}
                            </div>
                          )}
                        </div>

                        {rest ? (
                          <p className="mt-3 text-sm italic text-gray-400 dark:text-gray-500">
                            Rest / recovery — mobility, steps, or a full off-day.
                          </p>
                        ) : (
                          <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
                                <tr>
                                  <th className="px-4 py-2.5 font-medium">Exercise</th>
                                  <th className="px-4 py-2.5 text-center font-medium">Sets</th>
                                  <th className="px-4 py-2.5 text-center font-medium">Reps</th>
                                  <th className="px-4 py-2.5 text-center font-medium">RPE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {day.exercises.map((ex, ei) => {
                                  const isPriority = priorityMuscles.includes(ex.muscle)
                                  return (
                                    <tr
                                      key={`${ex.name}-${ei}`}
                                      className="text-gray-700 dark:text-gray-200"
                                    >
                                      <td className="px-4 py-2.5">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {ex.name}
                                        </span>
                                        <span
                                          className={`ml-2 text-xs ${
                                            isPriority
                                              ? 'text-accent-600 dark:text-accent-400'
                                              : 'text-gray-400 dark:text-gray-500'
                                          }`}
                                        >
                                          {ex.muscle}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-center tabular-nums">
                                        {ex.sets}
                                      </td>
                                      <td className="px-4 py-2.5 text-center tabular-nums">
                                        {ex.reps}
                                      </td>
                                      <td className="px-4 py-2.5 text-center tabular-nums">
                                        {ex.rpe}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
