import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageSquare, Search, ArrowLeft } from 'lucide-react'
import { Card, Button, Badge, Avatar, SectionHeader, EmptyState, PageTransition } from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

export default function Messages() {
  const { clients, getMessages, sendMessage } = useAppData()

  // Conversation list, ordered: clients with messages first.
  const ordered = useMemo(() => {
    return [...clients].sort((a, b) => {
      const an = getMessages(a.id).length > 0 ? 1 : 0
      const bn = getMessages(b.id).length > 0 ? 1 : 0
      return bn - an
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, getMessages])

  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter((c) => c.name.toLowerCase().includes(q))
  }, [ordered, query])

  // Default-select first client that has messages, else first client.
  const firstWithMsg = useMemo(
    () => ordered.find((c) => getMessages(c.id).length > 0) || ordered[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ordered],
  )
  const [selectedId, setSelectedId] = useState(firstWithMsg?.id)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'thread' (mobile only)

  const selected = clients.find((c) => c.id === selectedId)
  const thread = selectedId ? getMessages(selectedId) : []

  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // Auto-scroll to newest message whenever the thread or selection changes.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.length, selectedId])

  const openClient = (id) => {
    setSelectedId(id)
    setMobileView('thread')
  }

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    sendMessage(selectedId, 'coach', text)
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <SectionHeader title="Messages" subtitle="Your 1:1 conversations with clients" />

        <div className="grid h-[calc(100vh-15rem)] grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
          {/* LEFT — conversation list */}
          <Card
            className={`flex min-h-0 flex-col overflow-hidden p-0 ${
              mobileView === 'thread' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="border-b border-gray-100 p-3 dark:border-white/5">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="input pl-9"
                  placeholder="Search clients…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  No clients match “{query}”.
                </p>
              ) : (
                filtered.map((c) => {
                  const msgs = getMessages(c.id)
                  const last = msgs[msgs.length - 1]
                  const active = c.id === selectedId
                  return (
                    <button
                      key={c.id}
                      onClick={() => openClient(c.id)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active
                          ? 'bg-accent-500/10 ring-1 ring-accent-500/30'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Avatar initials={c.avatar} color={c.color} size={40} />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-sm font-semibold ${
                            active
                              ? 'text-accent-700 dark:text-accent-300'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {c.name}
                        </div>
                        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {last ? last.text : 'No messages yet'}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </Card>

          {/* RIGHT — thread */}
          <Card
            className={`flex min-h-0 flex-col overflow-hidden p-0 ${
              mobileView === 'list' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {!selected ? (
              <div className="grid flex-1 place-items-center p-6">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversation selected"
                  subtitle="Pick a client from the list to view your chat."
                />
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-white/5">
                  <button
                    onClick={() => setMobileView('list')}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-white/5"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Avatar initials={selected.avatar} color={selected.color} size={42} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {selected.name}
                    </div>
                    {selected.goal && <Badge className="mt-0.5">{selected.goal}</Badge>}
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {thread.length === 0 ? (
                    <div className="grid h-full place-items-center">
                      <EmptyState
                        icon={MessageSquare}
                        title="No messages yet"
                        subtitle="Say hello to start the conversation."
                      />
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {thread.map((m) => {
                        const mine = m.from === 'coach'
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                                mine
                                  ? 'rounded-br-md bg-accent-600 text-white'
                                  : 'rounded-bl-md bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'
                              }`}
                            >
                              {m.text}
                            </div>
                            <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
                              {m.time}
                            </span>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  )}
                </div>

                {/* Composer */}
                <div className="sticky bottom-0 border-t border-gray-100 bg-white/80 p-3 backdrop-blur dark:border-white/5 dark:bg-gray-900/60">
                  <div className="flex items-end gap-2">
                    <input
                      className="input"
                      placeholder="Write a reply…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onKeyDown}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="shrink-0"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                      <span className="ml-1 hidden sm:inline">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
