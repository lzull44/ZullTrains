import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { NAV_ITEMS } from './nav.js'
import { Logo } from './Logo.jsx'

export function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

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

        <nav className="mt-7 flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
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
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-600"
                    />
                  )}
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* AI assistant promo */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 p-4 text-white shadow-lift">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span className="text-sm font-semibold">Zull AI Coach</span>
          </div>
          <p className="mt-1 text-xs text-white/80">Auto-build meal plans that fit any macro target instantly.</p>
          <NavLink to="/meal-builder" onClick={onClose} className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25">
            Generate a plan
          </NavLink>
        </div>
      </aside>
    </>
  )
}
