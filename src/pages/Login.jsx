import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Check, Moon, Sun, Briefcase, User } from 'lucide-react'

import { Button } from '../components/ui/index.jsx'
import { LogoMark } from '../components/layout/Logo.jsx'
import zullLogo from '../assets/zull-logo.png'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { ACTIVITY_LEVELS, GOALS } from '../data/clients.js'

const FEATURES = [
  'Personalized macro & meal plans in minutes',
  'Automated weekly check-ins and adherence scoring',
  'A branded client portal — chat, plans, and payments',
]

export default function Login() {
  const { login, signInWithPassword, signUp, isLiveMode, error: authError, loading: authLoading } = useAuth()
  const { theme, toggle } = useTheme()
  const { registerClient, findClientByEmail } = useAppData()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [role, setRole] = useState('coach')
  const [signup, setSignup] = useState(false) // client signup mode
  const [intake, setIntake] = useState({
    name: '', email: '', password: '',
    age: '', height: '', weight: '', activityLevel: 'Moderate', goal: 'Fat Loss',
    experience: 'Beginner', equipment: 'Full gym', trainingDays: '4', injuries: '', allergies: '',
  })

  const selectRole = (r) => {
    setRole(r)
    if (r === 'coach') setSignup(false)
  }
  const setI = (patch) => setIntake((p) => ({ ...p, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLiveMode) {
      const { ok } = await signInWithPassword(email, password)
      if (ok) navigate('/')
      return
    }
    // Demo mode (file:// single-file build)
    if (role === 'client') {
      const existing = findClientByEmail(email)
      login(email, 'client', existing ? { id: existing.id, name: existing.name } : null)
    } else {
      login(email, role)
    }
    navigate('/')
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (isLiveMode) {
      const { ok } = await signUp({
        email: intake.email,
        password: intake.password,
        fullName: intake.name,
        intake,
      })
      if (ok) navigate('/')
      return
    }
    const id = registerClient(intake)
    login(intake.email, 'client', { id, name: intake.name || 'New Client' })
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#0b0d10] lg:grid lg:grid-cols-2">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute right-5 top-5 z-30 grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white/80 text-gray-600 backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* LEFT — branded gradient panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-black lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* soft grid + glow */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <LogoMark size={40} />
        </motion.div>

        <div className="relative z-10 max-w-md">
          <motion.img
            src={zullLogo}
            alt="ZullCoaching — Stronger. Healthier. Better You."
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 w-72 max-w-full"
          />
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-base text-white/70"
          >
            The all-in-one platform for online fitness coaches — plans, check-ins, and revenue in one place.
          </motion.p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.26 + i * 0.08 }}
                className="flex items-start gap-3 text-white/90"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
                  <Check size={14} className="text-white" />
                </span>
                <span className="text-sm font-medium">{f}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs font-medium text-white/60">
          Built by ZullCoaching — premium coaching infrastructure.
        </div>
      </div>

      {/* RIGHT — auth card */}
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12">
        {/* ambient glow behind the card */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 mx-auto w-full max-w-sm"
        >
          <div className="card border-gray-100 p-7 shadow-lift dark:border-white/5 sm:p-8">
            {/* ZC mark + wordmark */}
            <div className="mb-7 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <LogoMark size={64} />
              </motion.div>
              <h1 className="mt-4 text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Zull<span className="font-medium text-gray-500 dark:text-gray-400">Coaching</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {role === 'coach'
                  ? 'Sign in to your coaching dashboard'
                  : signup
                    ? 'Create your client profile'
                    : 'Sign in to your client portal'}
              </p>
            </div>

            {/* Role toggle */}
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/5">
              {[
                { id: 'coach', label: 'Coach', icon: Briefcase },
                { id: 'client', label: 'Client', icon: User },
              ].map((r) => {
                const active = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRole(r.id)}
                    className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active ? 'text-accent-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-white/10" />
                    )}
                    <r.icon size={15} className="relative z-10" />
                    <span className="relative z-10">{r.label}</span>
                  </button>
                )
              })}
            </div>

            {role === 'client' && signup ? (
              /* ---- Client signup: intake stats ---- */
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</span>
                    <input required className="input" value={intake.name} onChange={(e) => setI({ name: e.target.value })} placeholder="Alex Morgan" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                    <input required type="email" className="input" value={intake.email} onChange={(e) => setI({ email: e.target.value })} placeholder="you@email.com" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>
                    <input required={isLiveMode} minLength={isLiveMode ? 8 : 0} type="password" className="input" value={intake.password} onChange={(e) => setI({ password: e.target.value })} placeholder={isLiveMode ? 'at least 8 characters' : '••••••••'} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Age</span>
                    <input required type="number" min="13" max="100" className="input" value={intake.age} onChange={(e) => setI({ age: e.target.value })} placeholder="28" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</span>
                    <input required type="number" min="120" max="230" className="input" value={intake.height} onChange={(e) => setI({ height: e.target.value })} placeholder="180" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</span>
                    <input required type="number" min="35" max="250" className="input" value={intake.weight} onChange={(e) => setI({ weight: e.target.value })} placeholder="84" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Activity level</span>
                    <select className="input" value={intake.activityLevel} onChange={(e) => setI({ activityLevel: e.target.value })}>
                      {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Primary goal</span>
                    <select className="input" value={intake.goal} onChange={(e) => setI({ goal: e.target.value })}>
                      {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Experience</span>
                    <select className="input" value={intake.experience} onChange={(e) => setI({ experience: e.target.value })}>
                      {['Beginner', 'Intermediate', 'Advanced'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Training days/week</span>
                    <select className="input" value={intake.trainingDays} onChange={(e) => setI({ trainingDays: e.target.value })}>
                      {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Available equipment</span>
                    <select className="input" value={intake.equipment} onChange={(e) => setI({ equipment: e.target.value })}>
                      {['Full gym', 'Home gym', 'Minimal (dumbbells/bands)', 'Bodyweight only'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Injuries or limitations <span className="font-normal text-gray-400">(optional)</span></span>
                    <input className="input" value={intake.injuries} onChange={(e) => setI({ injuries: e.target.value })} placeholder="e.g. knee sensitivity, lower-back" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Allergies / foods to avoid <span className="font-normal text-gray-400">(optional)</span></span>
                    <input className="input" value={intake.allergies} onChange={(e) => setI({ allergies: e.target.value })} placeholder="e.g. lactose, shellfish, no pork" />
                  </label>
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Create profile <ArrowRight size={18} />
                </Button>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setSignup(false)} className="font-semibold text-accent-600 hover:text-accent-700 dark:text-accent-400">
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              /* ---- Sign in ---- */
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <div className="relative">
                      <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === 'coach' ? 'coach@zullcoaching.com' : 'you@email.com'}
                        className="input pl-11"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <div className="relative">
                      <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input px-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500/40 dark:border-white/20 dark:bg-white/5"
                      />
                      Remember me
                    </label>
                    <a href="#" className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400">
                      Forgot password?
                    </a>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Sign in
                    <ArrowRight size={18} />
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {role === 'client' && (
                    <>
                      New client?{' '}
                      <button type="button" onClick={() => setSignup(true)} className="font-semibold text-accent-600 hover:text-accent-700 dark:text-accent-400">
                        Create your profile
                      </button>
                    </>
                  )}
                </p>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">Built by ZullCoaching</p>
        </motion.div>
      </div>
    </div>
  )
}
