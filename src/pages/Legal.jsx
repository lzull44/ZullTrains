import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LogoMark } from '../components/layout/Logo.jsx'
import { COACHING_AGREEMENT, TERMS, PRIVACY } from '../data/legal.js'

const SECTIONS = [
  { id: 'agreement', title: 'Coaching Agreement', body: COACHING_AGREEMENT },
  { id: 'terms', title: 'Terms of Service', body: TERMS },
  { id: 'privacy', title: 'Privacy Policy', body: PRIVACY },
]

export default function Legal() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0b0d10] dark:text-gray-100">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-[#0b0d10]/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="text-[15px] font-extrabold tracking-tight">
              Zull<span className="font-medium text-gray-500 dark:text-gray-400">Coaching</span>
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost px-3 py-2 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Policies</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Plain-language summaries. These are starting templates — have them reviewed before launch.
          </p>
        </div>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="mb-3 text-xl font-bold tracking-tight">{s.title}</h2>
            <pre className="whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 p-5 font-sans text-sm leading-relaxed text-gray-600 dark:border-white/5 dark:bg-white/[0.03] dark:text-gray-300">
              {s.body}
            </pre>
          </section>
        ))}
      </main>
    </div>
  )
}
