import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox,
  Mail,
  Phone,
  Search,
  Filter,
  Trash2,
  Sparkles,
  Check,
  MessageSquare,
  Instagram,
} from 'lucide-react'
import {
  Card,
  Button,
  Badge,
  StatCard,
  SectionHeader,
  EmptyState,
  PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { COACH } from '../data/coach.js'

const STATUSES = ['All', 'New', 'Contacted', 'Converted', 'Archived']

// Tone classes per lead status — keeps badges + ring accents consistent.
const STATUS_STYLES = {
  new: {
    badge:
      'border border-gray-200 bg-white text-gray-800 dark:border-white/15 dark:bg-white/10 dark:text-gray-100',
    label: 'New',
  },
  contacted: {
    badge:
      'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
    label: 'Contacted',
  },
  converted: {
    badge:
      'border border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900',
    label: 'Converted',
  },
  archived: {
    badge:
      'border border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400',
    label: 'Archived',
  },
}

const daysAgo = (iso) => {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours <= 0) return 'just now'
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Leads() {
  const { leads, updateLead, deleteLead } = useAppData()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  // KPI counts off the raw list (don't let filter skew them).
  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, converted: 0, archived: 0 }
    for (const l of leads) {
      if (c[l.status] != null) c[l.status] += 1
    }
    return c
  }, [leads])

  // Filter + sort newest first.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads
      .filter((l) => {
        if (statusFilter !== 'All' && l.status !== statusFilter.toLowerCase()) return false
        if (!q) return true
        return (
          (l.name || '').toLowerCase().includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.context || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [leads, query, statusFilter])

  const onDelete = (lead) => {
    if (window.confirm(`Delete the application from ${lead.name || lead.email}? This can't be undone.`)) {
      deleteLead(lead.id)
    }
  }

  const segBtn = (active) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
    }`

  const statusBtn = (lead, target) => {
    const active = lead.status === target
    return (
      <button
        key={target}
        onClick={(e) => {
          e.stopPropagation()
          updateLead(lead.id, { status: target })
        }}
        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
          active
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            : 'border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
        }`}
      >
        {STATUS_STYLES[target].label}
      </button>
    )
  }

  return (
    <PageTransition>
      <SectionHeader
        title="Leads"
        subtitle="Discovery-call applications from your landing page"
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Inbox}
          label="New"
          value={counts.new}
          sub="Awaiting first reply"
          accent="accent"
        />
        <StatCard
          icon={MessageSquare}
          label="Contacted"
          value={counts.contacted}
          sub="In conversation"
          accent="amber"
        />
        <StatCard
          icon={Check}
          label="Converted"
          value={counts.converted}
          sub="Signed up as clients"
          accent="violet"
        />
      </div>

      {/* Controls */}
      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or context…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={segBtn(statusFilter === s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* List / Empty */}
      <div className="mt-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No applications yet"
            subtitle="Share your landing page on Instagram or in your link-in-bio so prospects can apply."
            action={
              <a
                href={COACH.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <Instagram size={14} /> Open Instagram
              </a>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            subtitle="Try clearing your search or changing the status filter."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {visible.map((lead) => {
                const isOpen = expandedId === lead.id
                const tone = STATUS_STYLES[lead.status] || STATUS_STYLES.new
                const ring =
                  lead.status === 'converted'
                    ? 'ring-1 ring-gray-900/20 dark:ring-white/30'
                    : ''
                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`p-5 ${ring}`}>
                      <div
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isOpen ? null : lead.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold text-gray-900 dark:text-white">
                                {lead.name || '(no name)'}
                              </span>
                              <Badge className={tone.badge}>{tone.label}</Badge>
                              {lead.source === 'calculator' && (
                                <Badge className="border border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                  <Sparkles size={11} /> Calculator
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 transition hover:text-gray-900 dark:hover:text-white"
                                >
                                  <Mail size={12} /> {lead.email}
                                </a>
                              )}
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 transition hover:text-gray-900 dark:hover:text-white"
                                >
                                  <Phone size={12} /> {lead.phone}
                                </a>
                              )}
                              <span>Applied {daysAgo(lead.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent('Your ZullCoaching application')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                              <Mail size={13} /> Reply
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(lead)
                              }}
                              className="grid h-8 w-8 place-items-center rounded-xl text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                              aria-label="Delete lead"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/5 dark:bg-white/5">
                            <div className="font-medium uppercase tracking-wide text-gray-400">
                              Goal
                            </div>
                            <div className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
                              {lead.goal || '—'}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/5 dark:bg-white/5">
                            <div className="font-medium uppercase tracking-wide text-gray-400">
                              Timeline
                            </div>
                            <div className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
                              {lead.timeline || '—'}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/5 dark:bg-white/5">
                            <div className="font-medium uppercase tracking-wide text-gray-400">
                              Preferred time
                            </div>
                            <div className="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
                              {lead.preferredTime || '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Status
                          </span>
                          {['new', 'contacted', 'converted', 'archived'].map((t) =>
                            statusBtn(lead, t),
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedId(isOpen ? null : lead.id)}
                          className="text-xs font-semibold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                          {isOpen ? 'Hide details' : 'View details'}
                        </button>
                      </div>

                      {/* Expanded body */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="body"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-white/5">
                              {lead.context && (
                                <div>
                                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    Their context
                                  </div>
                                  <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-700 dark:border-white/5 dark:bg-white/5 dark:text-gray-200">
                                    {lead.context}
                                  </p>
                                </div>
                              )}
                              <div>
                                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  Private notes
                                </div>
                                <textarea
                                  rows={3}
                                  defaultValue={lead.notes || ''}
                                  onBlur={(e) =>
                                    updateLead(lead.id, { notes: e.target.value })
                                  }
                                  placeholder="Add private notes about this lead…"
                                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/10"
                                />
                                <p className="mt-1.5 text-[11px] text-gray-400">
                                  Saved on blur · only you can see this.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
