import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Bell, Moon, Sun, LogOut } from 'lucide-react'
import { CLIENT_NAV } from './clientNav.js'
import { Logo } from './Logo.jsx'
import { Footer } from './Footer.jsx'
import { Avatar } from '../ui/index.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { COACH } from '../../data/coach.js'
import { CLIENT_NOTIFICATIONS } from '../../data/clientPortal.js'

function ClientSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white px-4 py-5 transition-transform duration-300 dark:border-white/5 dark:bg-[#0e1116] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Logo />
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-1">
          {CLIENT_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-700 dark:text-accent-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="client-nav-active" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-600" />
                  )}
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Coach card */}
        <div className="mt-4 rounded-2xl border border-gray-100 p-3 dark:border-white/5">
          <div className="flex items-center gap-3">
            <img src={COACH.avatar} alt={COACH.name} className="h-10 w-10 rounded-xl object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{COACH.name}</div>
              <div className="truncate text-xs text-gray-400">Your coach</div>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400"
        >
          <LogOut size={18} /> Log out
        </button>
      </aside>
    </>
  )
}

function ClientTopbar({ onMenu }) {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const [openN, setOpenN] = useState(false)
  const urgent = CLIENT_NOTIFICATIONS.some((n) => n.urgent)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#0b0d10]/80 sm:px-6">
      <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <div className="text-sm font-semibold text-gray-900 dark:text-white">Client Portal</div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button onClick={() => setOpenN((o) => !o)} onBlur={() => setTimeout(() => setOpenN(false), 180)} className="relative grid h-9 w-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
            <Bell size={18} />
            {urgent && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b0d10]" />}
          </button>
          {openN && (
            <div className="absolute right-0 z-40 mt-1 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lift dark:border-white/10 dark:bg-[#15181d]">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-white/5 dark:text-white">Notifications</div>
              <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
                {CLIENT_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {n.urgent && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</span>
                      <span className="ml-auto text-xs text-gray-400">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ml-1 flex items-center gap-2.5">
          <Avatar initials={user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') || 'C'} color="#ec4899" size={36} />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</div>
            <div className="text-xs text-gray-400">Client</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export function ClientLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen">
      <ClientSidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <ClientTopbar onMenu={() => setOpen(true)} />
        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
