// Shared premium UI primitives. Import these everywhere for visual consistency.
import { motion } from 'framer-motion'

// ---- Card ----
export function Card({ className = '', hover = false, children, ...rest }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ---- Button ----
export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    danger: 'btn bg-rose-500 text-white hover:bg-rose-600',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-base' }
  return (
    <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

// ---- Badge / chip ----
export function Badge({ className = '', children }) {
  return <span className={`chip ${className}`}>{children}</span>
}

// ---- Stat card (KPI tile) ----
export function StatCard({ icon: Icon, label, value, delta, deltaTone = 'up', accent = 'accent', sub }) {
  const tones = { up: 'text-accent-600 dark:text-accent-400', down: 'text-rose-500' }
  const accents = {
    accent: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    violet: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover p-5"
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${accents[accent]}`}>
            <Icon size={20} />
          </div>
        )}
        {delta != null && (
          <span className={`text-xs font-semibold ${tones[deltaTone]}`}>{delta}</span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</div>
        <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{label}</div>
        {sub && <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</div>}
      </div>
    </motion.div>
  )
}

// ---- Progress bar ----
export function ProgressBar({ value, max = 100, color = '#71717a', over = false, height = 8 }) {
  const ratio = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5" style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${ratio}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: over ? '#f43f5e' : color }}
      />
    </div>
  )
}

// ---- Avatar ----
export function Avatar({ initials, color = '#71717a', size = 40 }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}

// ---- Section header ----
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`card relative z-10 w-full ${maxWidth} p-6`}
      >
        {title && <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
        {children}
      </motion.div>
    </div>
  )
}

// ---- Empty state ----
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-14 text-center">
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400">
          <Icon size={24} />
        </div>
      )}
      <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-gray-400">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---- Tooltip (lightweight) ----
export function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 dark:bg-white dark:text-gray-900">
        {label}
      </span>
    </span>
  )
}

// ---- Page transition wrapper ----
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
