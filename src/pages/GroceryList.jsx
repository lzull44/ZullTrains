import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Copy, Download, Printer, Check, ShoppingCart,
} from 'lucide-react'
import {
  Card, Button, ProgressBar, SectionHeader, EmptyState, PageTransition,
} from '../components/ui/index.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { CATEGORIES, CATEGORY_STYLES } from '../data/foods.js'

// Placeholder mock pricing — clearly an estimate, not real data.
const MOCK_PRICE_PER_100G = { Protein: 1.6, Carb: 0.4, Fat: 1.2, Vegetable: 0.7 }

export default function GroceryList() {
  const { groceryList } = useAppData()
  const [checked, setChecked] = useState({})
  const [copied, setCopied] = useState(false)

  const grouped = useMemo(() => {
    const map = {}
    groceryList.forEach((item) => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)))
    return CATEGORIES.filter((c) => map[c]?.length).map((c) => ({ category: c, items: map[c] }))
  }, [groceryList])

  const total = groceryList.length
  const checkedCount = groceryList.filter((i) => checked[i.foodId]).length

  const estCost = useMemo(
    () =>
      groceryList.reduce(
        (sum, i) => sum + (i.grams / 100) * (MOCK_PRICE_PER_100G[i.category] || 0.8),
        0,
      ),
    [groceryList],
  )

  const toggle = (id) => setChecked((p) => ({ ...p, [id]: !p[id] }))

  const buildText = () => {
    const lines = ['Grocery List', '============', '']
    grouped.forEach(({ category, items }) => {
      lines.push(`${category.toUpperCase()}`)
      items.forEach((i) => {
        lines.push(`  - ${i.name}  —  ${i.grams}g  (~${i.servings} servings)`)
      })
      lines.push('')
    })
    lines.push(`Est. total: $${estCost.toFixed(2)} / week (placeholder)`)
    return lines.join('\n')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const handleExport = () => {
    const rows = ['Category,Food,Grams,Servings']
    grouped.forEach(({ category, items }) => {
      items.forEach((i) => rows.push(`${category},"${i.name}",${i.grams},${i.servings}`))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grocery-list.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  if (total === 0) {
    return (
      <PageTransition>
        <div className="p-4 sm:p-6">
          <SectionHeader title="Grocery List" subtitle="Auto-generated from your meal plan" />
          <EmptyState
            icon={ShoppingCart}
            title="No groceries yet"
            subtitle="Build a meal plan and your shopping list will appear here automatically."
            action={
              <Link to="/meal-builder">
                <Button variant="primary">Go to Meal Builder</Button>
              </Link>
            }
          />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="p-4 sm:p-6">
        <SectionHeader
          title="Grocery List"
          subtitle="Auto-generated from your meal plan"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check size={15} className="text-accent-600" /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download size={15} /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={15} /> Print
              </Button>
            </div>
          }
        />

        {/* Progress + cost */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Shopping progress</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {checkedCount} / {total} items
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={checkedCount} max={total} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              <ShoppingCart size={14} /> Est. cost
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              ${estCost.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-gray-400">/ week</span>
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Rough estimate — placeholder pricing.</p>
          </Card>
        </div>

        {/* Grouped categories */}
        <div className="grid gap-5 md:grid-cols-2">
          {grouped.map(({ category, items }, gi) => {
            const style = CATEGORY_STYLES[category]
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: gi * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`chip ${style.chip}`}>
                        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{items.length} items</span>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {items.map((item, i) => {
                      const isChecked = !!checked[item.foodId]
                      return (
                        <motion.li
                          key={item.foodId}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                        >
                          <button
                            onClick={() => toggle(item.foodId)}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                                isChecked
                                  ? 'border-accent-600 bg-accent-600 text-white'
                                  : 'border-gray-300 dark:border-white/20'
                              }`}
                            >
                              {isChecked && <Check size={13} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block truncate text-sm font-medium transition ${
                                  isChecked
                                    ? 'text-gray-400 line-through dark:text-gray-600'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {item.name}
                              </span>
                            </span>
                            <span
                              className={`shrink-0 text-right text-xs tabular-nums transition ${
                                isChecked ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              <span className="font-semibold">{item.grams}g</span>
                              <span className="ml-2 text-gray-400 dark:text-gray-500">~{item.servings} srv</span>
                            </span>
                          </button>
                        </motion.li>
                      )
                    })}
                  </ul>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </PageTransition>
  )
}
