// Food database. Macro values are per `servingSizeGrams`.
// categories: Protein | Carb | Fat | Vegetable

export const CATEGORIES = ['Protein', 'Carb', 'Fat', 'Vegetable']

export const CATEGORY_STYLES = {
  Protein: { label: 'Protein', dot: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  Carb: { label: 'Carb', dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  Fat: { label: 'Fat', dot: 'bg-sky-500', chip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  Vegetable: { label: 'Vegetable', dot: 'bg-accent-500', chip: 'bg-accent-500/10 text-accent-600 dark:text-accent-400' },
}

let _id = 0
const f = (name, category, servingSizeGrams, calories, protein, carbs, fat, favorite = false) => ({
  id: `food-${++_id}`,
  name,
  category,
  servingSizeGrams,
  calories,
  protein,
  carbs,
  fat,
  favorite,
})

export const FOODS = [
  // PROTEINS (values per 100g unless noted)
  f('Chicken Breast', 'Protein', 100, 165, 31, 0, 3.6, true),
  f('96/4 Ground Beef', 'Protein', 100, 152, 21, 0, 7, true),
  f('Salmon', 'Protein', 100, 208, 20, 0, 13),
  f('Eggs', 'Protein', 50, 72, 6.3, 0.4, 4.8, true),
  f('Egg Whites', 'Protein', 100, 52, 11, 0.7, 0.2),
  f('Greek Yogurt', 'Protein', 100, 59, 10, 3.6, 0.4, true),
  f('Whey Protein', 'Protein', 30, 120, 24, 3, 1.5, true),
  f('Turkey Breast', 'Protein', 100, 135, 30, 0, 1),
  f('Tuna', 'Protein', 100, 116, 26, 0, 1),

  // CARBS
  f('Jasmine Rice (cooked)', 'Carb', 100, 130, 2.7, 28, 0.3, true),
  f('White Rice (cooked)', 'Carb', 100, 130, 2.4, 28, 0.3),
  f('Oats', 'Carb', 100, 389, 16.9, 66, 6.9, true),
  f('Cream of Rice', 'Carb', 100, 380, 6, 86, 0.5),
  f('Potato', 'Carb', 100, 77, 2, 17, 0.1),
  f('Sweet Potato', 'Carb', 100, 86, 1.6, 20, 0.1, true),
  f('Sourdough Bread', 'Carb', 100, 289, 12, 56, 1.9),
  f('Bagel', 'Carb', 100, 250, 10, 49, 1.5),
  f('Banana', 'Carb', 100, 89, 1.1, 23, 0.3, true),
  f('Blueberries', 'Carb', 100, 57, 0.7, 14, 0.3),
  f('Strawberries', 'Carb', 100, 32, 0.7, 7.7, 0.3),
  f('Honey', 'Carb', 100, 304, 0.3, 82, 0),

  // FATS
  f('Peanut Butter', 'Fat', 100, 588, 25, 20, 50, true),
  f('Almond Butter', 'Fat', 100, 614, 21, 19, 56),
  f('Olive Oil', 'Fat', 100, 884, 0, 0, 100),
  f('Avocado', 'Fat', 100, 160, 2, 9, 15, true),
  f('Butter', 'Fat', 100, 717, 0.9, 0.1, 81),

  // VEGETABLES
  f('Broccoli', 'Vegetable', 100, 34, 2.8, 7, 0.4, true),
  f('Frozen Vegetable Medley', 'Vegetable', 100, 65, 2.6, 13, 0.4),
  f('Spinach', 'Vegetable', 100, 23, 2.9, 3.6, 0.4),
  f('Asparagus', 'Vegetable', 100, 20, 2.2, 3.9, 0.1),
]

export const findFood = (id) => FOODS.find((x) => x.id === id)
