import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'

const STARTERS = [
  'Build a 2,600 kcal plan',
  'Swap chicken for salmon',
  'Why is my client stalling?',
]

// Placeholder AI assistant — canned responses, no backend.
export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi Coach 👋 I'm your Zull AI assistant. Ask me to build plans, adjust macros, or analyze a client." },
  ])
  const [input, setInput] = useState('')

  const send = (text) => {
    const t = (text ?? input).trim()
    if (!t) return
    setMessages((m) => [
      ...m,
      { role: 'user', text: t },
      { role: 'ai', text: "This is a demo assistant. In production I'd generate that for you instantly — try the Auto-Build tool in Meal Builder for a working version." },
    ])
    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent-600 text-white shadow-lift transition hover:bg-accent-700"
        aria-label="AI assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="card fixed bottom-24 right-5 z-40 flex h-[460px] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-accent-600 to-accent-700 px-4 py-3 text-white dark:border-white/5">
              <Sparkles size={16} />
              <span className="text-sm font-semibold">Zull AI Coach</span>
              <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">Beta</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-accent-600 text-white'
                        : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-white/5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="input"
                placeholder="Ask the AI coach…"
              />
              <button onClick={() => send()} className="btn-primary px-3 py-2.5">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
