import zullMark from '../../assets/zull-mark.png'

// The ZullCoaching mark (white athletic-Z on black). Renders as a rounded tile
// that reads as an app icon on both light and dark surfaces.
export function LogoMark({ size = 56, className = '' }) {
  const r = Math.round(size * 0.24)
  return (
    <img
      src={zullMark}
      alt="ZullCoaching"
      className={`shrink-0 object-cover ${className}`}
      style={{ width: size, height: size, borderRadius: r }}
    />
  )
}

export function Logo({ size = 36, showText = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      {showText && (
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900 dark:text-white">
          Zull<span className="font-medium text-gray-500 dark:text-gray-400">Coaching</span>
        </span>
      )}
    </div>
  )
}
