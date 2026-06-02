import { Logo } from './Logo.jsx'

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-5 text-sm text-gray-400 dark:border-white/5 sm:flex-row">
        <Logo size={28} />
        <p>
          Built by <span className="font-semibold text-gray-600 dark:text-gray-300">ZullCoaching</span> · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
