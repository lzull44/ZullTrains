import { motion } from 'framer-motion'

// Lightweight SVG ring gauge. `value`/`max` drive the arc; turns red when over.
export function MacroRing({ value = 0, max = 100, size = 120, stroke = 11, color = '#71717a', label, unit = '' }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const ratio = max ? Math.min(value / max, 1) : 0
  const over = max ? value > max : false
  const arcColor = over ? '#f43f5e' : color
  const pctDisplay = max ? Math.round((value / max) * 100) : 0

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-100 dark:stroke-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - ratio) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {Math.round(value)}
          <span className="text-xs font-medium text-gray-400">{unit}</span>
        </span>
        {label && <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</span>}
        <span className={`text-[10px] font-semibold ${over ? 'text-rose-500' : 'text-accent-600 dark:text-accent-400'}`}>
          {pctDisplay}%
        </span>
      </div>
    </div>
  )
}
