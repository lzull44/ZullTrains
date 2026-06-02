import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Pencil, Trash2, Star, ArrowUpDown, Filter,
} from 'lucide-react'
import {
  Card, Button, SectionHeader, Modal, EmptyState, Tooltip, PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { CATEGORIES, CATEGORY_STYLES } from '../data/foods.js'

const COLUMNS = [
  { key: 'name', label: 'Food Name', align: 'left' },
  { key: 'category', label: 'Category', align: 'left' },
  { key: 'servingSizeGrams', label: 'Serving (g)', align: 'right' },
  { key: 'calories', label: 'Calories', align: 'right' },
  { key: 'protein', label: 'Protein', align: 'right' },
  { key: 'carbs', label: 'Carbs', align: 'right' },
  { key: 'fat', label: 'Fat', align: 'right' },
]

const emptyForm = {
  name: '', category: 'Protein', servingSizeGrams: 100,
  calories: 0, protein: 0, carbs: 0, fat: 0,
}

function CategoryTag({ category }) {
  const style = CATEGORY_STYLES[category]
  if (!style) return null
  return (
    <span className={`chip ${style.chip}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}

export default function FoodDatabase() {
  const { foods, addFood, updateFood, deleteFood, favorites, toggleFavorite } = useAppData()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [favOnly, setFavOnly] = useState(false)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [recent, setRecent] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const pushRecent = (id) =>
    setRecent((p) => [id, ...p.filter((x) => x !== id)].slice(0, 5))

  const recentFoods = useMemo(
    () => recent.map((id) => foods.find((f) => f.id === id)).filter(Boolean),
    [recent, foods],
  )

  const filtered = useMemo(() => {
    let out = foods
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      out = out.filter((f) => f.name.toLowerCase().includes(q))
    }
    if (category !== 'All') out = out.filter((f) => f.category === category)
    if (favOnly) out = out.filter((f) => favorites.includes(f.id))

    const { key, dir } = sort
    const mult = dir === 'asc' ? 1 : -1
    return [...out].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult
      return String(av).localeCompare(String(bv)) * mult
    })
  }, [foods, search, category, favOnly, favorites, sort])

  const toggleSort = (key) =>
    setSort((p) =>
      p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (food) => {
    pushRecent(food.id)
    setEditId(food.id)
    setForm({
      name: food.name,
      category: food.category,
      servingSizeGrams: food.servingSizeGrams,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      category: form.category,
      servingSizeGrams: Number(form.servingSizeGrams) || 0,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    }
    if (!payload.name) return
    if (editId) updateFood(editId, payload)
    else addFood(payload)
    setModalOpen(false)
  }

  const handleDelete = (food) => {
    if (window.confirm(`Delete "${food.name}" from the database?`)) deleteFood(food.id)
  }

  const numField = (label, key) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <input
        type="number"
        min="0"
        step="any"
        className="input"
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
      />
    </label>
  )

  return (
    <PageTransition>
      <div className="p-4 sm:p-6">
        <SectionHeader
          title="Food Database"
          subtitle={`${foods.length} foods`}
          action={
            <Button variant="primary" onClick={openAdd}>
              <Plus size={16} /> Add Food
            </Button>
          }
        />

        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search foods…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category segmented buttons */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
              {['All', ...CATEGORIES].map((cat) => {
                const active = category === cat
                const style = CATEGORY_STYLES[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {style && <span className={`h-2 w-2 rounded-full ${style.dot}`} />}
                    {cat}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setFavOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                favOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5'
              }`}
            >
              <Star size={14} className={favOnly ? 'fill-amber-400 text-amber-400' : ''} />
              Favorites only
            </button>
          </div>
        </div>

        {/* Recent foods */}
        {recentFoods.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Recent:</span>
            {recentFoods.map((f) => (
              <button
                key={f.id}
                onClick={() => openEdit(f)}
                className="chip bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[f.category]?.dot}`} />
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No foods match"
            subtitle="Try adjusting your search or category filters."
            action={
              <Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); setFavOnly(false) }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    <th className="w-10 px-4 py-3" />
                    {COLUMNS.map((col) => {
                      const active = sort.key === col.key
                      return (
                        <th
                          key={col.key}
                          className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          <button
                            onClick={() => toggleSort(col.key)}
                            className={`inline-flex items-center gap-1.5 transition hover:text-gray-700 dark:hover:text-gray-200 ${
                              active ? 'text-accent-600 dark:text-accent-400' : ''
                            } ${col.align === 'right' ? 'flex-row-reverse' : ''}`}
                          >
                            {col.label}
                            <ArrowUpDown size={12} className={active ? '' : 'opacity-40'} />
                            {active && (
                              <span className="text-[10px]">{sort.dir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </th>
                      )
                    })}
                    <th className="w-24 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filtered.map((food, i) => {
                    const isFav = favorites.includes(food.id)
                    return (
                      <motion.tr
                        key={food.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                        className="text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleFavorite(food.id)}
                            className="grid place-items-center text-gray-300 transition hover:text-amber-400 dark:text-gray-600"
                            aria-label="Toggle favorite"
                          >
                            <Star
                              size={16}
                              className={isFav ? 'fill-amber-400 text-amber-400' : ''}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { pushRecent(food.id); openEdit(food) }}
                            className="font-medium text-gray-900 transition hover:text-accent-600 dark:text-white dark:hover:text-accent-400"
                          >
                            {food.name}
                          </button>
                        </td>
                        <td className="px-4 py-3"><CategoryTag category={food.category} /></td>
                        <td className="px-4 py-3 text-right tabular-nums">{food.servingSizeGrams}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900 dark:text-white">{food.calories}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{food.protein}g</td>
                        <td className="px-4 py-3 text-right tabular-nums">{food.carbs}g</td>
                        <td className="px-4 py-3 text-right tabular-nums">{food.fat}g</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip label="Edit">
                              <button
                                onClick={() => openEdit(food)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                aria-label="Edit food"
                              >
                                <Pencil size={15} />
                              </button>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <button
                                onClick={() => handleDelete(food)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                                aria-label="Delete food"
                              >
                                <Trash2 size={15} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add / Edit modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editId ? 'Edit Food' : 'Add Food'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Food Name</span>
              <input
                className="input"
                placeholder="e.g. Chicken Breast"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Category</span>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              {numField('Serving Size (g)', 'servingSizeGrams')}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numField('Calories', 'calories')}
              {numField('Protein (g)', 'protein')}
              {numField('Carbs (g)', 'carbs')}
              {numField('Fat (g)', 'fat')}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Macros are per serving size shown above.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId ? 'Save Changes' : 'Add Food'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  )
}
