// Exercise library + a rules-based workout generator for the AI Workout Builder.

export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core']

// A handful of solid exercises per muscle group. `compound: true` ones lead a session.
export const EXERCISE_LIBRARY = {
  Chest: [
    { name: 'Barbell Bench Press', compound: true },
    { name: 'Incline DB Press', compound: true },
    { name: 'Machine Chest Press', compound: true },
    { name: 'Cable Fly' },
    { name: 'Push-ups' },
  ],
  Back: [
    { name: 'Weighted Pull-ups', compound: true },
    { name: 'Barbell Row', compound: true },
    { name: 'Lat Pulldown', compound: true },
    { name: 'Chest-Supported Row' },
    { name: 'Straight-Arm Pulldown' },
  ],
  Shoulders: [
    { name: 'Seated Shoulder Press', compound: true },
    { name: 'DB Shoulder Press', compound: true },
    { name: 'Cable Lateral Raise' },
    { name: 'DB Lateral Raise' },
    { name: 'Rear-Delt Fly' },
  ],
  Arms: [
    { name: 'EZ-Bar Curl' },
    { name: 'Hammer Curl' },
    { name: 'Incline DB Curl' },
    { name: 'Rope Triceps Pushdown' },
    { name: 'Overhead Triceps Extension' },
    { name: 'Close-Grip Bench Press', compound: true },
  ],
  Legs: [
    { name: 'Back Squat', compound: true },
    { name: 'Leg Press', compound: true },
    { name: 'Romanian Deadlift', compound: true },
    { name: 'Walking Lunges' },
    { name: 'Leg Extension' },
    { name: 'Leg Curl' },
    { name: 'Standing Calf Raise' },
  ],
  Glutes: [
    { name: 'Hip Thrust', compound: true },
    { name: 'Bulgarian Split Squat', compound: true },
    { name: 'Cable Kickback' },
    { name: 'Glute Bridge' },
    { name: 'Sumo Deadlift', compound: true },
  ],
  Core: [
    { name: 'Hanging Leg Raise' },
    { name: 'Cable Crunch' },
    { name: 'Plank' },
    { name: 'Ab Wheel Rollout' },
    { name: 'Russian Twist' },
  ],
}

// rep/RPE scheme by goal
const SCHEME = {
  'Fat Loss': { compound: '8-10', iso: '12-15', rpe: 8 },
  Maintenance: { compound: '6-8', iso: '10-12', rpe: 8 },
  'Lean Bulk': { compound: '5-7', iso: '8-12', rpe: 8 },
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const shuffle = (a) => {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Build a weekly split.
//  - priorityMuscles: groups the client wants to bring up (get extra frequency/volume)
//  - days: training days per week (2-6)
//  - goal: 'Fat Loss' | 'Maintenance' | 'Lean Bulk'
// Returns: [{ day, focus, exercises: [{name, sets, reps, rpe}] }] over a 7-day week
// (non-training days are inserted as Rest).
export function buildWorkout({ priorityMuscles = [], days = 4, goal = 'Maintenance' } = {}) {
  const scheme = SCHEME[goal] || SCHEME.Maintenance
  const d = Math.max(2, Math.min(6, days))

  // Build a weighted muscle pool: priority muscles appear more often.
  const base = MUSCLE_GROUPS
  const weighted = []
  base.forEach((m) => {
    const reps = priorityMuscles.includes(m) ? 3 : 1
    for (let i = 0; i < reps; i += 1) weighted.push(m)
  })

  // Decide muscles per training day (2-3 groups each), prioritizing the wanted ones.
  const pool = shuffle(weighted)
  const trainingDays = []
  let pi = 0
  for (let i = 0; i < d; i += 1) {
    const groups = []
    const count = priorityMuscles.length ? 2 : Math.random() < 0.5 ? 2 : 3
    while (groups.length < count) {
      const m = pool[pi % pool.length]
      pi += 1
      if (!groups.includes(m)) groups.push(m)
      if (pi > pool.length * 3) break // safety
    }
    trainingDays.push(groups)
  }

  // Map training days onto the week: fill training days first, rest fills the gaps,
  // then nudge a mid-week rest for nicer spacing on 4-5 day splits.
  let tIdx = 0
  const layout = []
  for (let i = 0; i < 7; i += 1) layout.push(i < d ? 'train' : 'rest')
  // interleave a mid-week rest for nicer spacing on 4-5 day splits
  if (d === 4) layout.splice(3, 0, layout.splice(4, 1)[0])
  if (d === 5) layout.splice(5, 0, layout.splice(6, 1)[0])

  const out = []
  for (let i = 0; i < 7; i += 1) {
    const day = DAY_NAMES[i]
    if (layout[i] === 'rest' || tIdx >= trainingDays.length) {
      out.push({ day, focus: 'Rest / recovery', exercises: [] })
      continue
    }
    const groups = trainingDays[tIdx]
    tIdx += 1
    const exercises = []
    groups.forEach((g, gi) => {
      const lib = shuffle(EXERCISE_LIBRARY[g] || [])
      const isPriority = priorityMuscles.includes(g)
      const take = isPriority ? 3 : 2
      lib.slice(0, take).forEach((ex, ei) => {
        const compound = ex.compound && ei === 0
        exercises.push({
          name: ex.name,
          muscle: g,
          sets: compound ? 4 : 3,
          reps: compound ? scheme.compound : scheme.iso,
          rpe: scheme.rpe + (isPriority ? 1 : 0),
        })
      })
      void gi
    })
    out.push({ day, focus: groups.join(' / '), exercises })
  }
  return out
}
