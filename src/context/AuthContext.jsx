import { createContext, useContext, useEffect, useState } from 'react'
import { isLiveMode, supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

// localStorage can throw / be unavailable when the app is opened from a file://
// URL (the single-file build). Fall back to in-memory state so nothing breaks.
const safeGet = (k) => {
  try { return localStorage.getItem(k) } catch { return null }
}
const safeSet = (k, v) => {
  try { localStorage.setItem(k, v) } catch { /* ignore */ }
}
const safeRemove = (k) => {
  try { localStorage.removeItem(k) } catch { /* ignore */ }
}

// Build the app user object from a Supabase session + the profile row.
async function userFromSession(session) {
  if (!session?.user) return null
  // Look up the profile row (created automatically on signup by the schema trigger).
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', session.user.id)
    .maybeSingle()
  const role = profile?.role || 'client'
  return {
    email: session.user.email,
    name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
    role,
    // For a logged-in client, their auth user id IS their clientId.
    // For a coach, clientId isn't used.
    clientId: role === 'client' ? session.user.id : null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = safeGet('zull-user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // In live mode, restore the session from Supabase on mount and listen for
  // auth-state changes (login, signup, signout, token refresh).
  useEffect(() => {
    if (!isLiveMode) return
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const u = await userFromSession(data.session)
      if (u) { safeSet('zull-user', JSON.stringify(u)); setUser(u) }
      else { safeRemove('zull-user'); setUser(null) }
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = await userFromSession(session)
      if (u) { safeSet('zull-user', JSON.stringify(u)); setUser(u) }
      else { safeRemove('zull-user'); setUser(null) }
    })
    return () => { cancelled = true; sub?.subscription?.unsubscribe?.() }
  }, [])

  // ---- DEMO mode login: same signature as before, no password check.
  const demoLogin = (email, role = 'coach', client = null) => {
    const u =
      role === 'client'
        ? {
            email: email || 'marcus@client.com',
            name: client?.name || 'Marcus Bell',
            role: 'client',
            clientId: client?.id || 'c1',
          }
        : { email: email || 'coach@zullcoaching.com', name: 'Coach Zull', role: 'coach' }
    safeSet('zull-user', JSON.stringify(u))
    setUser(u)
  }

  // ---- Public API ----

  // login(email, role, client) — kept for backward compatibility.
  // In live mode you typically call signInWithPassword instead.
  const login = (email, role = 'coach', client = null) => {
    if (!isLiveMode) return demoLogin(email, role, client)
    // Live-mode "login" without a password is a no-op — call signInWithPassword.
    return Promise.resolve(null)
  }

  const signInWithPassword = async (email, password) => {
    if (!isLiveMode) {
      // In demo mode, role is inferred from existing user state; default to client.
      demoLogin(email, 'client', null)
      return { ok: true }
    }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return { ok: false, error: err.message } }
    return { ok: true }
  }

  const signUp = async ({ email, password, fullName, intake }) => {
    if (!isLiveMode) {
      // Demo-mode signup is handled by registerClient() in AppDataContext.
      return { ok: true, demo: true }
    }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (err) { setLoading(false); setError(err.message); return { ok: false, error: err.message } }
    // Save the intake details to client_profiles. Profile row is created by the trigger.
    if (data?.user && intake) {
      await supabase.from('client_profiles').upsert({
        user_id: data.user.id,
        age: Number(intake.age) || null,
        height_cm: Number(intake.height) || null,
        weight_kg: Number(intake.weight) || null,
        goal: intake.goal || null,
        activity_level: intake.activityLevel || null,
        experience: intake.experience || null,
        equipment: intake.equipment || null,
        training_days: Number(intake.trainingDays) || null,
        injuries: intake.injuries || null,
        allergies: intake.allergies || null,
      })
    }
    setLoading(false)
    return { ok: true }
  }

  const logout = async () => {
    if (isLiveMode) {
      await supabase.auth.signOut()
    }
    safeRemove('zull-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signInWithPassword, signUp, loading, error, isLiveMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
