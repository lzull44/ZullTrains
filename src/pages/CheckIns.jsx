import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Smile, Battery, Moon, Droplet, Activity, Footprints, HeartPulse, Check, Sparkles,
} from 'lucide-react'

import {
  PageTransition, SectionHeader, Card, CardHeader, Button, Badge, ProgressBar, Avatar,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

const RATINGS = [
  { key: 'hunger', label: 'Hunger', icon: Smile, invert: true },
  { key: 'energy', label: 'Energy', icon: Battery },
  { key: 'sleep', label: 'Sleep quality', icon: Moon },
  { key: 'digestion', label: 'Digestion', icon: Droplet },
  { key: 'stress', label: 'Stress', icon: HeartPulse, invert: true },
]

// A rating maps 1-5 -> normalized 0-100. For "invert" metrics (hunger/stress)
// a low value is good, so we flip it.
const normRating = (v, invert) => {
  const pct = ((v - 1) / 4) * 100
  return invert ? 100 - pct : pct
}

export default function CheckIns() {
  const { clients, updateClient } = useAppData()
  const [selectedId, setSelectedId] = useState(clients[0]?.id)

  const client = clients.find((c) => c.id === selectedId) || clients[0]
  const latest = client?.checkIns?.[client.checkIns.length - 1]

  // ---- editable check-in state (prefilled from client's latest entry) ----
  const [form, setForm] = useState(() => seed(client, latest))

  // Re-seed when switching clients
  useEffect(() => {
    setForm(seed(client, client?.checkIns?.[client.checkIns.length - 1]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // ---- live adherence score ----
  const adherence = useMemo(() => {
    const ratingScores = RATINGS.map((r) => normRating(form[r.key], r.invert))
    const completion = [Number(form.steps) || 0, Number(form.cardio) || 0]
    const all = [...ratingScores, ...completion]
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length)
  }, [form])

  // ---- rule-based macro suggestions ----
  const suggestions = useMemo(() => buildSuggestions(form, adherence, client), [form, adherence, client])

  const save = () => {
    if (!client) return
    const entry = {
      week: `W${(client.checkIns?.length || 0) + 1}`,
      hunger: form.hunger, energy: form.energy, sleep: form.sleep,
      digestion: form.digestion, stress: form.stress,
      steps: Number(form.steps) || 0, cardio: Number(form.cardio) || 0,
      adherence, notes: form.notes,
    }
    updateClient(client.id, {
      weight: Number(form.currentWeight) || client.weight,
      compliance: adherence,
      checkIns: [...(client.checkIns || []), entry],
    })
  }

  if (!client) return null

  return (
    <PageTransition>
      <SectionHeader title="Check-Ins" subtitle="Review weekly client submissions" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* LEFT — client list */}
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Clients</span>
          </div>
          <div className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
            {clients.map((c) => {
              const submitted = (c.checkIns?.length || 0) > 0
              const active = c.id === selectedId
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    active ? 'bg-accent-500/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Avatar initials={c.avatar} color={c.color} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.name}</div>
                    <div className="mt-0.5">
                      <Badge
                        className={
                          submitted
                            ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }
                      >
                        {submitted ? 'Submitted' : 'Due'}
                      </Badge>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* MAIN + review */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          {/* Check-in form */}
          <Card className="overflow-hidden">
            <CardHeader
              title={`${client.name} — weekly check-in`}
              subtitle={`Week ${(client.checkIns?.length || 0) + 1}`}
              icon={Activity}
            />
            <div className="space-y-7 p-5">
              {/* Weight */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current weight (kg)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.currentWeight}
                    onChange={(e) => set('currentWeight', e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Weekly avg weight (kg)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.avgWeight}
                    onChange={(e) => set('avgWeight', e.target.value)}
                    className="input"
                  />
                </Field>
              </div>

              {/* Ratings */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Wellness ratings</h4>
                <div className="space-y-4">
                  {RATINGS.map((r) => (
                    <RatingRow
                      key={r.key}
                      icon={r.icon}
                      label={r.label}
                      value={form[r.key]}
                      onChange={(v) => set(r.key, v)}
                    />
                  ))}
                </div>
              </div>

              {/* Completions */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Completion
                  icon={Footprints}
                  label="Step completion"
                  value={form.steps}
                  onChange={(v) => set('steps', v)}
                />
                <Completion
                  icon={HeartPulse}
                  label="Cardio completion"
                  value={form.cardio}
                  onChange={(v) => set('cardio', v)}
                />
              </div>

              {/* Notes */}
              <Field label="Client notes">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="How did the week go?"
                  className="input resize-none"
                />
              </Field>

              <div className="flex justify-end">
                <Button onClick={save}>
                  <Check size={16} />
                  Save check-in
                </Button>
              </div>
            </div>
          </Card>

          {/* Coach review panel */}
          <div className="space-y-5">
            <Card className="p-5">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly adherence</h4>
              <div className="mt-3 flex items-end gap-2">
                <motion.span
                  key={adherence}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white"
                >
                  {adherence}
                </motion.span>
                <span className="mb-1 text-sm text-gray-400">/ 100</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={adherence} max={100} />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {adherence >= 85 ? 'Elite consistency.' : adherence >= 65 ? 'On track — minor tweaks.' : 'Needs attention this week.'}
              </p>
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-accent-600 dark:text-accent-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Macro adjustments</h4>
              </div>
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-xl border border-gray-100 p-3 dark:border-white/5"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{s.title}</div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{s.detail}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

// ---- helpers ----
function seed(client, latest) {
  return {
    currentWeight: client?.weight ?? '',
    avgWeight: client?.weight ? Math.round(client.weight * 10) / 10 : '',
    hunger: latest?.hunger ?? 3,
    energy: latest?.energy ?? 3,
    sleep: latest?.sleep ?? 3,
    digestion: latest?.digestion ?? 3,
    stress: latest?.stress ?? 3,
    steps: latest?.steps ?? 80,
    cardio: latest?.cardio ?? 80,
    notes: '',
  }
}

function buildSuggestions(form, adherence, client) {
  const out = []
  const prev = client?.checkIns?.[client.checkIns.length - 1]
  const stalled = prev && Math.abs((Number(form.avgWeight) || 0) - (client?.weight || 0)) < 0.3

  if (stalled && adherence >= 80) {
    out.push({
      title: 'Reduce calories by 100–150',
      detail: 'Weight stalled with high adherence — pull from carbs first.',
    })
  }
  if (form.hunger >= 4 && form.energy <= 2) {
    out.push({
      title: 'Add a refeed (+200 kcal carbs)',
      detail: 'High hunger and low energy signal under-fueling.',
    })
  }
  if (Number(form.steps) < 70) {
    out.push({
      title: 'Increase daily step target',
      detail: 'Step completion is low — raise NEAT before cutting food.',
    })
  }
  if (form.sleep <= 2 || form.stress >= 4) {
    out.push({
      title: 'Hold macros, prioritize recovery',
      detail: 'Poor sleep / high stress — avoid a deficit increase this week.',
    })
  }
  if (out.length === 0) {
    out.push({
      title: 'Maintain current macros',
      detail: 'Metrics are balanced — stay the course and reassess next week.',
    })
  }
  return out.slice(0, 3)
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  )
}

function RatingRow({ icon: Icon, label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}/5</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                n <= value
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Completion({ icon: Icon, label, value, onChange }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Icon size={15} className="text-gray-400" />
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-600"
      />
      <div className="mt-2">
        <ProgressBar value={Number(value) || 0} max={100} height={6} />
      </div>
    </div>
  )
}
