// Core macro math. Single source of truth for the whole app.
// FORMULA: actual macro = food macro * entered grams / serving size grams

export const round = (n, d = 0) => {
  const p = 10 ** d
  return Math.round((n + Number.EPSILON) * p) / p
}

// Compute scaled macros for `grams` of a `food` (food macros are per food.servingSizeGrams).
export function scaleFood(food, grams) {
  if (!food || !food.servingSizeGrams) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }
  const factor = grams / food.servingSizeGrams
  return {
    calories: round(food.calories * factor),
    protein: round(food.protein * factor, 1),
    carbs: round(food.carbs * factor, 1),
    fat: round(food.fat * factor, 1),
  }
}

// Sum a list of { calories, protein, carbs, fat } objects.
export function sumMacros(items) {
  return items.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

// Calories implied by macros (4/4/9). Useful for the coach adjustment tool.
export const caloriesFromMacros = (p, c, f) => round(p * 4 + c * 4 + f * 9)

// Percentage of target hit, clamped display value plus raw value.
export function pct(value, target) {
  if (!target) return 0
  return round((value / target) * 100)
}

// Macro target presets for the Coach Adjustment tool.
// Values are per-kg-bodyweight multipliers applied against a base; here we ship
// concrete macro splits keyed by goal for an ~85kg male example client.
export const MACRO_PRESETS = {
  'Fat Loss': { calories: 2100, protein: 200, carbs: 180, fat: 55 },
  Maintenance: { calories: 2600, protein: 190, carbs: 280, fat: 75 },
  'Lean Bulk': { calories: 3000, protein: 200, carbs: 360, fat: 80 },
  Refeed: { calories: 2900, protein: 180, carbs: 420, fat: 55 },
  'Reverse Diet': { calories: 2400, protein: 190, carbs: 240, fat: 70 },
}

// Apply a calorie delta with carb-first priority.
// When calories increase: add carbs first, then protein; fats stay stable.
// When calories decrease: remove carbs first, then protein; fats stay stable.
export function applyCalorieDelta(macros, delta) {
  const carbCals = macros.carbs * 4
  let remaining = delta
  let newCarbCals = carbCals + remaining

  if (newCarbCals < 0) {
    // carbs can't go negative — overflow pulls from protein
    remaining = newCarbCals
    newCarbCals = 0
  } else {
    remaining = 0
  }

  let newProteinCals = macros.protein * 4 + remaining
  if (newProteinCals < 0) newProteinCals = 0

  const carbs = round(newCarbCals / 4)
  const protein = round(newProteinCals / 4)
  const fat = macros.fat
  return {
    protein,
    carbs,
    fat,
    calories: caloriesFromMacros(protein, carbs, fat),
  }
}

export const MACRO_COLORS = {
  calories: '#71717a',
  protein: '#f43f5e',
  carbs: '#f59e0b',
  fat: '#0ea5e9',
}

// Rough starting macros from body stats (Mifflin-St Jeor) + goal adjustment.
// Shared by registerClient (context) and the public macro calculator on the
// marketing site, so they always agree.
export function estimateTargetsFromStats({
  weight = 80,
  height = 178,
  age = 30,
  sex = 'male',
  activityLevel = 'Moderate',
  goal = 'Maintenance',
} = {}) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'female' ? -161 : 5)
  const mult = { Low: 1.3, Moderate: 1.5, High: 1.7, Athlete: 1.9 }[activityLevel] || 1.45
  let cals = bmr * mult
  if (goal === 'Fat Loss') cals -= 400
  if (goal === 'Lean Bulk') cals += 300
  const protein = round(weight * 2.2)
  const fat = round(weight * 0.9)
  const carbs = Math.max(0, round((cals - protein * 4 - fat * 9) / 4))
  return { calories: round(cals), protein, carbs, fat }
}

