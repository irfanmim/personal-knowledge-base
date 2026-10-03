import categories from '../categories.json'

const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const categoryLabel = (key) => categories.find((c) => c.key === key)?.label ?? titleCase(key)

// Display order: categories.json order first, then unknown categories alphabetically.
export const categoryOrder = (key) => {
  const i = categories.findIndex((c) => c.key === key)
  return i === -1 ? categories.length : i
}

export const STATUS_LABELS = { draft: 'Draft', evolving: 'Evolving', complete: 'Complete' }

// 'YYYY-MM-DD' -> 'Oct 3, 2026' (UTC so it never shifts by timezone)
export const formatDate = (day) =>
  day ? new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''

// Group entries into [{ key, label, entries }] in display order.
export function groupByCategory(entries) {
  const map = new Map()
  for (const e of entries) {
    if (!map.has(e.category)) map.set(e.category, [])
    map.get(e.category).push(e)
  }
  return [...map.keys()]
    .sort((a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b))
    .map((key) => ({ key, label: categoryLabel(key), entries: map.get(key) }))
}
