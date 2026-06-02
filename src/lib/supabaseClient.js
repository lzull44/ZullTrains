// Supabase live-mode wiring. Returns null/no-ops when env vars aren't set so
// the app falls back to localStorage demo mode automatically.
//
// To go live: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see .env.example
// and GO_LIVE.md), then run the SQL schema in supabase/schema.sql.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isLiveMode = Boolean(url && anon)
export const supabase = isLiveMode
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

// ---------- Shape mappers (DB row -> app shape) ----------

// profiles row -> the client object the app uses everywhere.
export function mapProfileToClient(p, cp = {}) {
  return {
    id: p.id,
    name: p.full_name || 'Client',
    email: p.email || '',
    avatar: (p.full_name || 'CL').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    age: cp.age || 0,
    height: cp.height_cm || 0,
    weight: cp.weight_kg || 0,
    goal: cp.goal || 'Fat Loss',
    activityLevel: cp.activity_level || 'Moderate',
    status: 'active',
    calories: cp.calories || 0,
    protein: cp.protein || 0,
    carbs: cp.carbs || 0,
    fat: cp.fat || 0,
    stepGoal: cp.step_goal || 10000,
    cardioGoal: cp.cardio_goal || 120,
    sleepGoal: cp.sleep_goal || 8,
    waterGoal: cp.water_goal || 3,
    notes: cp.notes || '',
    coachComments: cp.coach_comments || '',
    color: '#71717a',
    weightHistory: [],
    checkIns: [],
    photos: [],
    plan: 'Monthly Coaching',
    joined: (cp.joined || p.created_at || '').slice(0, 10),
    experience: cp.experience || '',
    equipment: cp.equipment || '',
    trainingDays: cp.training_days || 4,
    injuries: cp.injuries || '',
    allergies: cp.allergies || '',
  }
}

// ---------- Common queries ----------

// Pull every coach-visible row in parallel. Used right after auth on the coach
// side so the dashboard, clients list, and inbox have data.
export async function fetchAllForCoach() {
  if (!supabase) return null
  const [profiles, plans, msgs, subs, leads] = await Promise.all([
    supabase.from('profiles').select('*, client_profiles(*)').eq('role', 'client'),
    supabase.from('plans').select('*'),
    supabase.from('messages').select('*').order('created_at', { ascending: true }),
    supabase.from('subscriptions').select('*'),
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
  ])
  return {
    clients: (profiles.data || []).map((p) => mapProfileToClient(p, p.client_profiles || {})),
    plans: Object.fromEntries(
      (plans.data || []).map((row) => [row.user_id, { meals: row.meals || [], targets: row.targets || {}, workout: row.workout || [] }]),
    ),
    messages: (msgs.data || []).reduce((acc, m) => {
      const k = m.client_id
      const conv = acc[k] || (acc[k] = [])
      conv.push({ id: m.id, from: m.sender, text: m.body, time: new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) })
      return acc
    }, {}),
    subscriptions: Object.fromEntries(
      (subs.data || []).map((s) => [s.user_id, {
        packageId: s.package_id, name: s.package_id, price: 0, cadence: 'per month',
        since: (s.current_period_end ? new Date(s.current_period_end).toISOString().slice(0, 10) : ''),
        status: s.status,
      }]),
    ),
    leads: (leads.data || []).map((l) => ({
      id: l.id, name: l.name, email: l.email, phone: l.phone, goal: l.goal,
      timeline: l.timeline, preferredTime: l.preferred_time, context: l.notes,
      source: l.source, createdAt: l.created_at, status: l.status, notes: l.notes,
    })),
  }
}

// Single-client pull for the client portal.
export async function fetchForClient(clientId) {
  if (!supabase) return null
  const [profile, plan, msgs, sub] = await Promise.all([
    supabase.from('profiles').select('*, client_profiles(*)').eq('id', clientId).single(),
    supabase.from('plans').select('*').eq('user_id', clientId).maybeSingle(),
    supabase.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true }),
    supabase.from('subscriptions').select('*').eq('user_id', clientId).maybeSingle(),
  ])
  return {
    client: profile.data ? mapProfileToClient(profile.data, profile.data.client_profiles || {}) : null,
    plan: plan.data ? { meals: plan.data.meals || [], targets: plan.data.targets || {}, workout: plan.data.workout || [] } : null,
    messages: (msgs.data || []).map((m) => ({
      id: m.id, from: m.sender, text: m.body, time: new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    })),
    subscription: sub.data ? {
      packageId: sub.data.package_id, status: sub.data.status,
      since: sub.data.current_period_end ? new Date(sub.data.current_period_end).toISOString().slice(0, 10) : '',
    } : null,
  }
}

// Send a chat message (used by client portal + coach Messages page in live mode).
export async function sendMessageRemote(clientId, sender, body) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('messages')
    .insert({ client_id: clientId, sender, body })
    .select()
    .single()
  if (error) return null
  return { id: data.id, from: data.sender, text: data.body, time: 'Just now' }
}

// Insert a new lead (used by /apply form).
export async function insertLeadRemote(lead) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: lead.name, email: lead.email, phone: lead.phone,
      goal: lead.goal, timeline: lead.timeline, preferred_time: lead.preferredTime,
      notes: lead.context, source: lead.source, status: 'new',
    })
    .select()
    .single()
  if (error) return null
  return data
}

// Delete a lead (coach Leads tab).
export async function deleteLeadRemote(id) {
  if (!supabase) return false
  const { error } = await supabase.from('leads').delete().eq('id', id)
  return !error
}

// Delete a client. Removes the auth.users row via service role on the server
// side would be ideal — anon delete on profiles only succeeds if RLS allows
// the coach to delete client rows. The simplest non-destructive alternative
// is to flag the client as inactive instead; here we attempt the hard delete
// and let RLS govern.
export async function deleteClientRemote(id) {
  if (!supabase) return false
  // child rows first so RLS / FKs don't block
  await supabase.from('client_profiles').delete().eq('user_id', id)
  await supabase.from('plans').delete().eq('user_id', id)
  await supabase.from('messages').delete().eq('client_id', id)
  await supabase.from('subscriptions').delete().eq('user_id', id)
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  return !error
}
