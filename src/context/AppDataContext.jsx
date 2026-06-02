import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CLIENTS } from '../data/clients.js'
import { FOODS, findFood } from '../data/foods.js'
import { scaleFood, sumMacros, estimateTargetsFromStats } from '../utils/macros.js'
import { WORKOUT_PLAN, MESSAGE_SEED } from '../data/clientPortal.js'
import { usePersistentState, clearPersisted } from '../hooks/usePersistentState.js'
import { isLiveMode, fetchAllForCoach, fetchForClient, sendMessageRemote, insertLeadRemote, deleteLeadRemote, deleteClientRemote } from '../lib/supabaseClient.js'
import { useAuth } from './AuthContext.jsx'

const estimateTargets = estimateTargetsFromStats

// Read demo-mode synchronously so seeders can decide whether to ship demo data.
// Default is "on" (demo mode) — the coach can flip it on first launch via Settings
// to start with a clean roster and an honest dashboard.
const isDemoMode = () => {
  try { return localStorage.getItem('zull:v1:demoMode') !== 'off' } catch { return true }
}
// "Start clean" — wipes all stored data and locks demoMode to off, then reloads.
export const wipeToLive = () => {
  clearPersisted()
  try { localStorage.setItem('zull:v1:demoMode', 'off') } catch { /* ignore */ }
  try { window.location.reload() } catch { /* ignore */ }
}

const AppDataContext = createContext(null)

let _rid = 1000
const rid = () => `r${++_rid}`

// Build a sensible starter plan referencing real food ids by name.
const byName = (name) => (FOODS.find((x) => x.name === name) || {}).id

const starterMeals = () => [
  {
    id: 'm1', name: 'Meal 1',
    rows: [
      { id: rid(), foodId: byName('Oats'), grams: 80 },
      { id: rid(), foodId: byName('Whey Protein'), grams: 30 },
      { id: rid(), foodId: byName('Blueberries'), grams: 100 },
    ],
  },
  {
    id: 'm2', name: 'Meal 2',
    rows: [
      { id: rid(), foodId: byName('Chicken Breast'), grams: 200 },
      { id: rid(), foodId: byName('Jasmine Rice (cooked)'), grams: 250 },
      { id: rid(), foodId: byName('Broccoli'), grams: 150 },
    ],
  },
  {
    id: 'm3', name: 'Meal 3',
    rows: [
      { id: rid(), foodId: byName('96/4 Ground Beef'), grams: 170 },
      { id: rid(), foodId: byName('Sweet Potato'), grams: 200 },
      { id: rid(), foodId: byName('Avocado'), grams: 50 },
    ],
  },
  {
    id: 'm4', name: 'Meal 4',
    rows: [
      { id: rid(), foodId: byName('Greek Yogurt'), grams: 200 },
      { id: rid(), foodId: byName('Peanut Butter'), grams: 20 },
      { id: rid(), foodId: byName('Banana'), grams: 120 },
    ],
  },
]

export function AppDataProvider({ children }) {
  const demo = isDemoMode()

  // All state persists to localStorage (survives refresh).
  // When demo mode is OFF (coach has "started clean"), seeded demo rows are skipped.
  const [clients, setClients] = usePersistentState('clients', () => (demo ? CLIENTS : []))
  const [foods, setFoods] = usePersistentState('foods', () => FOODS)
  const [targets, setTargets] = usePersistentState('targets', { calories: 2600, protein: 200, carbs: 290, fat: 75 })
  const [meals, setMeals] = usePersistentState('meals', starterMeals)
  const [mealTemplates, setMealTemplates] = usePersistentState('mealTemplates', [])
  const [favorites, setFavorites] = usePersistentState('favorites', () => FOODS.filter((f) => f.favorite).map((f) => f.id))

  // ---- per-client assignments: meal plan + diet (macro targets) + workout ----
  const [clientPlans, setClientPlans] = usePersistentState('clientPlans', () =>
    demo
      ? {
          c1: {
            meals: starterMeals(),
            targets: { calories: 2100, protein: 200, carbs: 180, fat: 55 },
            workout: WORKOUT_PLAN,
          },
        }
      : {},
  )

  // ---- per-client 1:1 message threads (coach <-> client) ----
  const [messages, setMessages] = usePersistentState('messages', () => (demo ? { c1: MESSAGE_SEED } : {}))

  // ---- per-client daily logs, progress photos, and active subscription ----
  const [dailyLogs, setDailyLogs] = usePersistentState('dailyLogs', {})       // { [clientId]: [{date, weight, steps, water, sleep}] }
  const [progressPhotos, setProgressPhotos] = usePersistentState('progressPhotos', {}) // { [clientId]: [{id, dataUrl, date, label}] }
  const [subscriptions, setSubscriptions] = usePersistentState('subscriptions', {})    // { [clientId]: {packageId, name, price, cadence, since, status} }

  // ---- client workout/meal logging + signed agreements ----
  const [workoutLogs, setWorkoutLogs] = usePersistentState('workoutLogs', {})  // { [clientId]: { [date]: { [exerciseName]: {done, sets:[{weight,reps}]} } } }
  const [mealLogs, setMealLogs] = usePersistentState('mealLogs', {})           // { [clientId]: { [date]: { [mealId]: true } } }
  const [agreements, setAgreements] = usePersistentState('agreements', {})     // { [clientId]: { signedAt, parqFlags, version } }

  // ---- discovery-call leads (from /apply on the public landing) ----
  const [leads, setLeads] = usePersistentState('leads', [])  // [{ id, name, email, goal, timeline, context, preferredTime, source, createdAt, status }]

  // ---- client testimonials (captured at the 4-week milestone) ----
  const [testimonials, setTestimonials] = usePersistentState('testimonials', {})  // { [clientId]: { quote, rating, allowFeature, createdAt } }

  // ---- personal records (per client / exercise) + coach notifications ----
  const [clientPRs, setClientPRs] = usePersistentState('clientPRs', {})   // { [clientId]: { [exerciseName]: { weight, reps, date } } }
  const [coachNotifications, setCoachNotifications] = usePersistentState('coachNotifications', [])  // [{ id, type, clientId, clientName, exerciseName?, weight?, previous?, date, createdAt, read }]

  // ---- Live-mode hydration: pull real data from Supabase on login ----
  // (No-op in demo mode, so the single-file build keeps using localStorage.)
  const { user } = useAuth()
  useEffect(() => {
    if (!isLiveMode || !user) return
    let cancelled = false
    if (user.role === 'coach') {
      fetchAllForCoach().then((data) => {
        if (cancelled || !data) return
        if (data.clients) setClients(data.clients)
        if (data.messages) setMessages(data.messages)
        if (data.leads) setLeads(data.leads)
        if (data.subscriptions) setSubscriptions(data.subscriptions)
        if (data.plans) setClientPlans(data.plans)
      })
    } else if (user.role === 'client' && user.clientId) {
      fetchForClient(user.clientId).then((data) => {
        if (cancelled || !data) return
        if (data.client) setClients((prev) => {
          const others = prev.filter((c) => c.id !== data.client.id)
          return [data.client, ...others]
        })
        if (data.plan) setClientPlans((prev) => ({ ...prev, [user.clientId]: data.plan }))
        if (data.messages) setMessages((prev) => ({ ...prev, [user.clientId]: data.messages }))
        if (data.subscription) setSubscriptions((prev) => ({ ...prev, [user.clientId]: data.subscription }))
      })
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.clientId])

  // ---- client CRUD ----
  const addClient = (c) => setClients((p) => [{ ...c, id: `c${Date.now()}` }, ...p])
  const updateClient = (id, patch) =>
    setClients((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const deleteClient = (id) => {
    setClients((p) => p.filter((c) => c.id !== id))
    if (isLiveMode) deleteClientRemote(id).catch(() => {})
  }

  // Client self-signup: create a client from intake stats + preferences, return the new id.
  const registerClient = ({
    name, email, age, height, weight, activityLevel, goal,
    experience, equipment, trainingDays, injuries, allergies,
  }) => {
    const id = `c${Date.now()}`
    const initials = (name || 'New Client').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    const targets = estimateTargets({ weight, height, age, activityLevel, goal })
    const client = {
      id, name: name || 'New Client', avatar: initials, email,
      age: Number(age) || 0, height: Number(height) || 0, weight: Number(weight) || 0,
      goal: goal || 'Fat Loss', activityLevel: activityLevel || 'Moderate', status: 'active',
      ...targets,
      stepGoal: 10000, cardioGoal: 120, sleepGoal: 8, waterGoal: 3,
      // intake preferences (so the coach can build a tailored plan)
      experience: experience || 'Beginner',
      equipment: equipment || 'Full gym',
      trainingDays: Number(trainingDays) || 4,
      injuries: injuries || '',
      allergies: allergies || '',
      compliance: 0, color: '#71717a', weightHistory: [{ week: 'W1', weight: Number(weight) || 0 }],
      checkIns: [], notes: '', coachComments: '', photos: [], plan: 'Monthly Coaching',
      joined: new Date().toISOString().slice(0, 10),
    }
    setClients((p) => [client, ...p])
    setClientPlans((p) => ({ ...p, [id]: { meals: [], targets, workout: [] } }))
    setMessages((p) => ({ ...p, [id]: [] }))
    return id
  }

  // ---- assignments ----
  const getClientPlan = (clientId) => {
    const cp = clientPlans[clientId]
    const client = clients.find((c) => c.id === clientId)
    return {
      meals: cp?.meals || [],
      workout: cp?.workout || [],
      targets: cp?.targets || (client
        ? { calories: client.calories, protein: client.protein, carbs: client.carbs, fat: client.fat }
        : { calories: 0, protein: 0, carbs: 0, fat: 0 }),
    }
  }
  const assignMealPlan = (clientId, mealsToAssign) =>
    setClientPlans((p) => ({ ...p, [clientId]: { ...(p[clientId] || {}), meals: JSON.parse(JSON.stringify(mealsToAssign)) } }))
  const assignClientTargets = (clientId, t) =>
    setClientPlans((p) => ({ ...p, [clientId]: { ...(p[clientId] || {}), targets: { ...t } } }))
  const assignWorkout = (clientId, workout) =>
    setClientPlans((p) => ({ ...p, [clientId]: { ...(p[clientId] || {}), workout: JSON.parse(JSON.stringify(workout)) } }))

  // ---- messaging ----
  const getMessages = (clientId) => messages[clientId] || []
  const sendMessage = async (clientId, from, text) => {
    // Optimistic local insert (works in both modes).
    const localId = `msg${Date.now()}`
    setMessages((p) => ({
      ...p,
      [clientId]: [...(p[clientId] || []), { id: localId, from, text, time: 'Just now' }],
    }))
    // Persist to Supabase in live mode (best-effort; ignore failure for offline UX).
    if (isLiveMode) {
      try { await sendMessageRemote(clientId, from, text) } catch { /* ignore */ }
    }
  }

  // ---- account lookup (email -> client, for client sign-in) ----
  const findClientByEmail = (email) =>
    clients.find((c) => c.email && email && c.email.toLowerCase() === email.toLowerCase())

  // ---- daily logs (client self-logging: weight/steps/water/sleep) ----
  const getDailyLogs = (clientId) => dailyLogs[clientId] || []
  const logDaily = (clientId, entry) => {
    const date = entry.date || new Date().toISOString().slice(0, 10)
    setDailyLogs((p) => {
      const existing = (p[clientId] || []).filter((e) => e.date !== date)
      return { ...p, [clientId]: [...existing, { date, ...entry }].sort((a, b) => a.date.localeCompare(b.date)) }
    })
    if (entry.weight) updateClient(clientId, { weight: Number(entry.weight) })
  }

  // ---- progress photos (real uploads as data URLs) ----
  const getProgressPhotos = (clientId) => progressPhotos[clientId] || []
  const addProgressPhoto = (clientId, dataUrl, label = '') =>
    setProgressPhotos((p) => ({
      ...p,
      [clientId]: [
        { id: `ph${Date.now()}`, dataUrl, label, date: new Date().toISOString().slice(0, 10) },
        ...(p[clientId] || []),
      ],
    }))
  const removeProgressPhoto = (clientId, photoId) =>
    setProgressPhotos((p) => ({ ...p, [clientId]: (p[clientId] || []).filter((x) => x.id !== photoId) }))

  // ---- subscriptions (checkout records the active package) ----
  const getSubscription = (clientId) => subscriptions[clientId] || null
  const subscribe = (clientId, pkg) => {
    const since = new Date().toISOString().slice(0, 10)
    // Trials are time-limited; compute the explicit end date so the portal can
    // show a countdown and so the coach knows when to follow up.
    const trialEndsAt = pkg.trialDays
      ? new Date(Date.now() + pkg.trialDays * 86400000).toISOString().slice(0, 10)
      : null
    setSubscriptions((p) => ({
      ...p,
      [clientId]: {
        packageId: pkg.id, name: pkg.name, price: pkg.price, cadence: pkg.cadence,
        since, status: 'active',
        ...(trialEndsAt ? { trialEndsAt } : {}),
      },
    }))
    updateClient(clientId, { plan: pkg.name })
  }
  const cancelSubscription = (clientId) =>
    setSubscriptions((p) => {
      const next = { ...p }
      delete next[clientId]
      return next
    })

  // ---- workout logging (client logs what they actually did) ----
  const getWorkoutLog = (clientId, date) => workoutLogs[clientId]?.[date] || {}
  const setExerciseLog = (clientId, date, exerciseName, data) => {
    setWorkoutLogs((p) => {
      const forClient = p[clientId] || {}
      const forDate = forClient[date] || {}
      const prev = forDate[exerciseName] || {}
      return {
        ...p,
        [clientId]: { ...forClient, [date]: { ...forDate, [exerciseName]: { ...prev, ...data } } },
      }
    })

    // PR detection: compare top weight in `data.sets` to the previous record.
    // First-ever log establishes a baseline (no notification); subsequent
    // logs that beat the record fire a coach notification + update the PR.
    const newTop = (data.sets || []).reduce(
      (best, s) => {
        const w = Number(s?.weight) || 0
        return w > best.weight ? { weight: w, reps: Number(s?.reps) || 0 } : best
      },
      { weight: 0, reps: 0 },
    )
    if (newTop.weight <= 0) return
    const prevPR = clientPRs[clientId]?.[exerciseName]
    if (!prevPR) {
      // first log of this exercise — establish a baseline silently
      setClientPRs((p) => ({
        ...p,
        [clientId]: { ...(p[clientId] || {}), [exerciseName]: { ...newTop, date } },
      }))
      return
    }
    if (newTop.weight > prevPR.weight) {
      const client = clients.find((c) => c.id === clientId)
      setClientPRs((p) => ({
        ...p,
        [clientId]: { ...(p[clientId] || {}), [exerciseName]: { ...newTop, date } },
      }))
      setCoachNotifications((p) => [
        {
          id: `n${Date.now()}`,
          type: 'pr',
          clientId,
          clientName: client?.name || 'Client',
          exerciseName,
          weight: newTop.weight,
          reps: newTop.reps,
          previous: prevPR.weight,
          date,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...p,
      ].slice(0, 50))
    }
  }

  // ---- meal logging (check off meals eaten -> adherence) ----
  const getMealLog = (clientId, date) => mealLogs[clientId]?.[date] || {}
  const toggleMealEaten = (clientId, date, mealId) =>
    setMealLogs((p) => {
      const forClient = p[clientId] || {}
      const forDate = { ...(forClient[date] || {}) }
      if (forDate[mealId]) delete forDate[mealId]
      else forDate[mealId] = true
      return { ...p, [clientId]: { ...forClient, [date]: forDate } }
    })

  // ---- coaching agreement + PAR-Q acceptance ----
  const getAgreement = (clientId) => agreements[clientId] || null
  const acceptAgreement = (clientId, parqFlags = []) =>
    setAgreements((p) => ({
      ...p,
      [clientId]: { signedAt: new Date().toISOString(), parqFlags, version: '1.0' },
    }))

  // ---- discovery-call leads (coach inbox) ----
  const addLead = (lead) => {
    const localId = `lead${Date.now()}`
    setLeads((p) => [{ id: localId, createdAt: new Date().toISOString(), status: 'new', ...lead }, ...p])
    // In live mode the /apply form runs while the visitor is anonymous (no auth);
    // the RLS policy on `public.leads` allows anon inserts. Best-effort.
    if (isLiveMode) {
      insertLeadRemote(lead).then((row) => {
        if (!row) return
        setLeads((p) => p.map((l) => (l.id === localId ? { ...l, id: row.id, createdAt: row.created_at } : l)))
      }).catch(() => { /* ignore */ })
    }
    return localId
  }
  const updateLead = (id, patch) =>
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const deleteLead = (id) => {
    setLeads((p) => p.filter((l) => l.id !== id))
    if (isLiveMode) deleteLeadRemote(id).catch(() => {})
  }

  // ---- testimonials ----
  const getTestimonial = (clientId) => testimonials[clientId] || null
  const addTestimonial = (clientId, data) =>
    setTestimonials((p) => ({
      ...p,
      [clientId]: { createdAt: new Date().toISOString(), ...data },
    }))
  const removeTestimonial = (clientId) =>
    setTestimonials((p) => {
      const n = { ...p }; delete n[clientId]; return n
    })

  // ---- coach notifications (PRs, etc) ----
  const markNotificationRead = (id) =>
    setCoachNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)))
  const markAllNotificationsRead = () =>
    setCoachNotifications((p) => p.map((n) => ({ ...n, read: true })))
  const clearNotifications = () => setCoachNotifications([])
  const unreadNotificationsCount = coachNotifications.filter((n) => !n.read).length

  const getClientPRs = (clientId) => clientPRs[clientId] || {}

  // ---- Loyalty rewards: discount earned from milestones + PRs ----
  // Pure derivation from existing state — no separate storage needed.
  const getEarnedDiscount = (clientId) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return { percent: 0, milestones: [], next: null }

    const prsCount = Object.keys(clientPRs[clientId] || {}).length
    const logs = dailyLogs[clientId] || []
    const dateSet = new Set(logs.map((l) => l.date))
    let streak = 0
    const d = new Date()
    for (;;) {
      const k = d.toISOString().slice(0, 10)
      if (dateSet.has(k)) { streak += 1; d.setDate(d.getDate() - 1) } else break
    }
    const checkIns = (client.checkIns || []).length
    const photos = (progressPhotos[clientId] || []).length

    const tiers = [
      { key: 'pr1', met: prsCount >= 1, percent: 5, label: 'First PR logged' },
      { key: 'pr3', met: prsCount >= 3, percent: 5, label: '3 different PRs' },
      { key: 's30', met: streak >= 30, percent: 5, label: '30-day logging streak' },
      { key: 'ci4', met: checkIns >= 4, percent: 5, label: '4 check-ins submitted' },
      { key: 'ph4', met: photos >= 4, percent: 5, label: '4 progress photos uploaded' },
    ]
    const earned = tiers.filter((t) => t.met)
    const percent = Math.min(25, earned.reduce((s, t) => s + t.percent, 0))
    const next = tiers.find((t) => !t.met) || null
    return { percent, milestones: tiers, earned, next }
  }

  // ---- "Download my data" for a client (privacy policy compliance) ----
  const exportClientData = (clientId) => ({
    exportedAt: new Date().toISOString(),
    profile: clients.find((c) => c.id === clientId) || null,
    plan: clientPlans[clientId] || null,
    messages: messages[clientId] || [],
    dailyLogs: dailyLogs[clientId] || [],
    workoutLogs: workoutLogs[clientId] || {},
    mealLogs: mealLogs[clientId] || {},
    progressPhotos: (progressPhotos[clientId] || []).map(({ id, label, date }) => ({ id, label, date })),
    subscription: subscriptions[clientId] || null,
    agreement: agreements[clientId] || null,
    testimonial: testimonials[clientId] || null,
  })

  // ---- food CRUD ----
  const addFood = (food) => setFoods((p) => [{ ...food, id: `food-u${Date.now()}` }, ...p])
  const updateFood = (id, patch) =>
    setFoods((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  const deleteFood = (id) => setFoods((p) => p.filter((f) => f.id !== id))
  const toggleFavorite = (id) =>
    setFavorites((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  // ---- meal operations ----
  const addRow = (mealId) =>
    setMeals((p) => p.map((m) => (m.id === mealId ? { ...m, rows: [...m.rows, { id: rid(), foodId: '', grams: 100 }] } : m)))
  const removeRow = (mealId, rowId) =>
    setMeals((p) => p.map((m) => (m.id === mealId ? { ...m, rows: m.rows.filter((r) => r.id !== rowId) } : m)))
  const updateRow = (mealId, rowId, patch) =>
    setMeals((p) => p.map((m) => (m.id === mealId ? { ...m, rows: m.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) } : m)))
  const addMeal = () =>
    setMeals((p) => [...p, { id: `m${Date.now()}`, name: `Meal ${p.length + 1}`, rows: [] }])
  const removeMeal = (mealId) => setMeals((p) => p.filter((m) => m.id !== mealId))
  const clearAllMeals = () => setMeals((p) => p.map((m) => ({ ...m, rows: [] })))
  const resetMeals = () => setMeals(starterMeals())

  const saveTemplate = (name) =>
    setMealTemplates((p) => [...p, { id: `t${Date.now()}`, name, meals: JSON.parse(JSON.stringify(meals)) }])
  const loadTemplate = (templateId) => {
    const t = mealTemplates.find((x) => x.id === templateId)
    if (t) setMeals(JSON.parse(JSON.stringify(t.meals)))
  }

  // ---- derived: macros for a single meal ----
  const mealMacros = (meal) =>
    sumMacros(meal.rows.map((r) => scaleFood(findFood(r.foodId), r.grams)))

  // ---- derived: daily totals across all meals ----
  const dailyTotals = useMemo(
    () => sumMacros(meals.flatMap((m) => m.rows.map((r) => scaleFood(findFood(r.foodId), r.grams)))),
    [meals],
  )

  // ---- derived: grocery list (combine duplicates, group by category) ----
  const groceryList = useMemo(() => {
    const totals = {}
    meals.forEach((m) =>
      m.rows.forEach((r) => {
        if (!r.foodId || !r.grams) return
        if (!totals[r.foodId]) totals[r.foodId] = 0
        totals[r.foodId] += Number(r.grams)
      }),
    )
    return Object.entries(totals)
      .map(([foodId, grams]) => {
        const food = findFood(foodId)
        if (!food) return null
        return {
          foodId,
          name: food.name,
          category: food.category,
          grams,
          servings: Math.round((grams / food.servingSizeGrams) * 10) / 10,
        }
      })
      .filter(Boolean)
  }, [meals])

  const value = {
    clients, addClient, updateClient, deleteClient, registerClient,
    foods, addFood, updateFood, deleteFood, favorites, toggleFavorite,
    targets, setTargets,
    meals, setMeals, addRow, removeRow, updateRow, addMeal, removeMeal, clearAllMeals, resetMeals,
    mealTemplates, saveTemplate, loadTemplate,
    mealMacros, dailyTotals, groceryList,
    clientPlans, getClientPlan, assignMealPlan, assignClientTargets, assignWorkout,
    messages, getMessages, sendMessage,
    findClientByEmail,
    getDailyLogs, logDaily,
    getProgressPhotos, addProgressPhoto, removeProgressPhoto,
    getSubscription, subscribe, cancelSubscription,
    getWorkoutLog, setExerciseLog, getMealLog, toggleMealEaten,
    getAgreement, acceptAgreement,
    leads, addLead, updateLead, deleteLead,
    testimonials, getTestimonial, addTestimonial, removeTestimonial,
    exportClientData,
    // PRs + coach notifications
    clientPRs, getClientPRs,
    coachNotifications, unreadNotificationsCount,
    markNotificationRead, markAllNotificationsRead, clearNotifications,
    // Loyalty rewards
    getEarnedDiscount,
    demoMode: demo,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export const useAppData = () => {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
