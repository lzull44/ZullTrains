import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Instagram } from 'lucide-react'
import { PageTransition } from '../../components/ui/index.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAppData } from '../../context/AppDataContext.jsx'
import { COACH } from '../../data/coach.js'

const QUICK_REPLIES = [
  'I hit my macros today',
  'Can we adjust my plan?',
  'Logged my check-in',
]

const COACH_AUTO_REPLY = "Got it 👍 I'll take a look and get back to you shortly."

function CoachAvatar({ size = 36, className = '' }) {
  return (
    <img
      src={COACH.avatar}
      alt={COACH.name}
      className={`shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-white/10 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export default function ClientMessages() {
  const { user } = useAuth()
  const { getMessages, sendMessage: pushMessage } = useAppData()
  const clientId = user?.clientId
  const messages = getMessages(clientId)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const threadRef = useRef(null)
  const typingTimer = useRef(null)

  const scrollToBottom = useCallback(() => {
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing, scrollToBottom])

  useEffect(() => () => clearTimeout(typingTimer.current), [])

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim()
      if (!trimmed || !clientId) return
      pushMessage(clientId, 'client', trimmed)
      setDraft('')
      // simulate the coach reading + replying
      setTyping(true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        setTyping(false)
        pushMessage(clientId, 'coach', COACH_AUTO_REPLY)
      }, 1200)
    },
    [clientId, pushMessage],
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(draft)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(draft)
    }
  }

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden card">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CoachAvatar size={44} />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent-500 dark:border-[#15181d]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  {COACH.name}
                </h2>
                <span className="hidden items-center gap-1.5 text-xs font-medium text-accent-600 dark:text-accent-400 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                  Online
                </span>
              </div>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                Usually replies within a few hours
              </p>
            </div>
          </div>
          <a
            href={COACH.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost px-3 py-2 text-xs"
          >
            <Instagram size={16} />
            <span className="hidden sm:inline">@{COACH.handle}</span>
          </a>
        </div>

        {/* Message thread */}
        <div
          ref={threadRef}
          className="flex-1 space-y-1 overflow-y-auto bg-gray-50/60 px-3 py-4 dark:bg-black/10 sm:px-5"
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isClient = m.from === 'client'
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex items-end gap-2 py-1 ${isClient ? 'justify-end' : 'justify-start'}`}
                >
                  {!isClient && <CoachAvatar size={28} />}
                  <div className={`flex max-w-[78%] flex-col sm:max-w-[68%] ${isClient ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isClient
                          ? 'rounded-br-md bg-accent-600 text-white'
                          : 'rounded-bl-md bg-white text-gray-800 dark:bg-white/10 dark:text-gray-100'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">{m.time}</span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          <AnimatePresence>
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-end gap-2 py-1"
              >
                <CoachAvatar size={28} />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-white/10">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Coach is typing…
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick replies */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 px-3 pt-3 dark:border-white/5 sm:px-5">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className="chip border border-gray-200 bg-white text-gray-600 transition hover:border-accent-500 hover:text-accent-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-accent-400"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Sticky input row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 sm:px-5">
          <input
            className="input"
            placeholder={`Message ${COACH.name.split(' ')[0]}…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="btn-primary h-[42px] w-[42px] shrink-0 !px-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
