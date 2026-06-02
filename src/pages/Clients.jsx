import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, Filter, Trash2, Pencil, Users, ChevronRight } from 'lucide-react'
import {
  Button,
  Badge,
  ProgressBar,
  Avatar,
  SectionHeader,
  Modal,
  EmptyState,
  PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { ACTIVITY_LEVELS, GOALS } from '../data/clients.js'

const PALETTE = ['#ec4899', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6']

const STATUS_FILTERS = ['all', 'active', 'needs-checkin']

const initialsFrom = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?'

const blankForm = () => ({
  name: '',
  age: 30,
  height: 175,
  weight: 75,
  goal: GOALS[0],
  activityLevel: ACTIVITY_LEVELS[1],
  calories: 2200,
  protein: 180,
  carbs: 220,
  fat: 65,
  stepGoal: 10000,
  cardioGoal: 120,
  sleepGoal: 8,
  waterGoal: 3,
})

function StatusChip({ status }) {
  if (status === 'needs-checkin') {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Needs check-in
      </Badge>
    )
  }
  return (
    <Badge className="bg-accent-500/10 text-accent-600 dark:text-accent-400">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Active
    </Badge>
  )
}

function ClientForm({ form, setForm }) {
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const num = (k, v) => set(k, v === '' ? '' : Number(v))

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Full name</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Marcus Bell"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Age</label>
          <input type="number" className="input" value={form.age} onChange={(e) => num('age', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Height (cm)</label>
          <input type="number" className="input" value={form.height} onChange={(e) => num('height', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Weight (kg)</label>
          <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => num('weight', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Goal</label>
          <select className="input" value={form.goal} onChange={(e) => set('goal', e.target.value)}>
            {GOALS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Activity level</label>
          <select className="input" value={form.activityLevel} onChange={(e) => set('activityLevel', e.target.value)}>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Macro targets</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            ['calories', 'Cal'],
            ['protein', 'Protein'],
            ['carbs', 'Carbs'],
            ['fat', 'Fat'],
          ].map(([k, lbl]) => (
            <div key={k}>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</label>
              <input type="number" className="input" value={form[k]} onChange={(e) => num(k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Lifestyle goals</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            ['stepGoal', 'Steps'],
            ['cardioGoal', 'Cardio (m)'],
            ['sleepGoal', 'Sleep (h)'],
            ['waterGoal', 'Water (L)'],
          ].map(([k, lbl]) => (
            <div key={k}>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{lbl}</label>
              <input type="number" step="0.1" className="input" value={form[k]} onChange={(e) => num(k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete }) {
  const navigate = useNavigate()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative cursor-pointer card card-hover overflow-hidden p-5"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      {/* hover actions */}
      <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(client) }}
          className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          aria-label="Edit client"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(client) }}
          className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20"
          aria-label="Delete client"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex items-center gap-3.5">
        <Avatar initials={client.avatar} color={client.color} size={52} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{client.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">{client.goal}</Badge>
            <span className="text-xs text-gray-400">{client.activityLevel}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 py-3 dark:bg-white/[0.03]">
        {[
          ['Age', client.age],
          ['Height', `${client.height}cm`],
          ['Weight', `${client.weight}kg`],
        ].map(([lbl, val]) => (
          <div key={lbl} className="text-center">
            <div className="text-sm font-bold text-gray-900 dark:text-white">{val}</div>
            <div className="text-[11px] text-gray-400">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-500 dark:text-gray-400">Compliance</span>
          <span className="font-semibold text-gray-900 dark:text-white">{client.compliance}%</span>
        </div>
        <ProgressBar value={client.compliance} max={100} color={client.compliance >= 85 ? '#71717a' : client.compliance >= 70 ? '#f59e0b' : '#f43f5e'} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <StatusChip status={client.status} />
        <span className="flex items-center gap-1 text-xs font-medium text-accent-600 opacity-0 transition group-hover:opacity-100 dark:text-accent-400">
          View profile <ChevronRight size={14} />
        </span>
      </div>
    </motion.div>
  )
}

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useAppData()

  const [query, setQuery] = useState('')
  const [goalFilter, setGoalFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = adding, else client id
  const [form, setForm] = useState(blankForm())
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false
      if (goalFilter !== 'all' && c.goal !== goalFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (activityFilter !== 'all' && c.activityLevel !== activityFilter) return false
      return true
    })
  }, [clients, query, goalFilter, statusFilter, activityFilter])

  const activeCount = clients.filter((c) => c.status === 'active').length

  const openAdd = () => {
    setEditing(null)
    setForm(blankForm())
    setFormOpen(true)
  }

  const openEdit = (client) => {
    setEditing(client.id)
    setForm({
      name: client.name,
      age: client.age,
      height: client.height,
      weight: client.weight,
      goal: client.goal,
      activityLevel: client.activityLevel,
      calories: client.calories,
      protein: client.protein,
      carbs: client.carbs,
      fat: client.fat,
      stepGoal: client.stepGoal,
      cardioGoal: client.cardioGoal,
      sleepGoal: client.sleepGoal,
      waterGoal: client.waterGoal,
    })
    setFormOpen(true)
  }

  const submit = () => {
    if (!form.name.trim()) return
    if (editing) {
      updateClient(editing, { ...form, avatar: initialsFrom(form.name) })
    } else {
      addClient({
        ...form,
        avatar: initialsFrom(form.name),
        status: 'active',
        compliance: 80,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        weightHistory: [],
        checkIns: [],
        photos: [],
        notes: '',
        coachComments: '',
        plan: 'Standard',
        joined: new Date().toISOString().slice(0, 10),
      })
    }
    setFormOpen(false)
  }

  const doDelete = () => {
    if (confirmDelete) deleteClient(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <PageTransition>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SectionHeader
        title="Clients"
        subtitle={`${activeCount} active client${activeCount === 1 ? '' : 's'} · ${clients.length} total`}
        action={
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Client
          </Button>
        }
      />

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status segmented */}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s === 'needs-checkin' ? 'Needs check-in' : 'Active'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-gray-400">
            <Filter size={15} />
          </div>

          <select className="input w-auto py-2" value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)}>
            <option value="all">All goals</option>
            {GOALS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select className="input w-auto py-2" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
            <option value="all">All activity</option>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients match your filters"
          subtitle="Try adjusting your search or filters, or add a new client to your roster."
          action={
            <Button onClick={openAdd}>
              <Plus size={16} /> Add Client
            </Button>
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.3 }}
            >
              <ClientCard client={c} onEdit={openEdit} onDelete={setConfirmDelete} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Client' : 'Add Client'}
        maxWidth="max-w-xl"
      >
        <ClientForm form={form} setForm={setForm} />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name.trim()}>
            {editing ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete client?"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will permanently remove{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{confirmDelete?.name}</span>{' '}
          and all of their data from your roster. This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={doDelete}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </Modal>
    </div>
    </PageTransition>
  )
}
