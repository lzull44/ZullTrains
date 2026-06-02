import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Moon, Sun, Plus, Trophy, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { Avatar } from '../ui/index.jsx'

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function NotificationsBell() {
  const navigate = useNavigate()
  const {
    coachNotifications, unreadNotificationsCount,
    markNotificationRead, markAllNotificationsRead, clearNotifications,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const hasUnread = unreadNotificationsCount > 0

  const openItem = (n) => {
    markNotificationRead(n.id)
    setOpen(false)
    if (n.clientId) navigate(`/clients/${n.clientId}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="relative grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#0b0d10]">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lift dark:border-white/10 dark:bg-[#15181d]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
            {coachNotifications.length > 0 && (
              <div className="flex items-center gap-3 text-[11px]">
                {hasUnread && (
                  <button
                    onMouseDown={markAllNotificationsRead}
                    className="font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onMouseDown={clearNotifications}
                  className="font-medium text-gray-400 hover:text-rose-500"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
            {coachNotifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-gray-400">
                Nothing yet — PRs and milestones from your clients will land here.
              </p>
            ) : (
              coachNotifications.map((n) => (
                <button
                  key={n.id}
                  onMouseDown={() => openItem(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/5 ${
                    !n.read ? 'bg-accent-500/[0.04]' : ''
                  }`}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                    {n.type === 'pr' ? <Trophy size={15} /> : <Check size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {n.clientName}
                      </span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-600" />}
                      <span className="ml-auto shrink-0 text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.type === 'pr' && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        New PR on <span className="font-medium text-gray-700 dark:text-gray-200">{n.exerciseName}</span>
                        {' — '}{n.weight} kg
                        {n.previous ? <span className="text-gray-400"> (was {n.previous} kg)</span> : null}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onMenu }) {
  const { theme, toggle } = useTheme()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#0b0d10]/80 sm:px-6">
      <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden" onClick={onMenu}>
        <Menu size={20} />
      </button>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search clients, foods, plans…" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationsBell />
        <button className="btn-primary hidden px-3 py-2 text-xs sm:inline-flex">
          <Plus size={15} /> New Plan
        </button>
        <div className="ml-1 flex items-center gap-2.5">
          <Avatar initials="ZC" color="#71717a" size={36} />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Coach Zull</div>
            <div className="text-xs text-gray-400">Head Coach</div>
          </div>
        </div>
      </div>
    </header>
  )
}
