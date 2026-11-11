import { useMemo, useState } from 'react'

function matchesQuery(item, keys, query) {
  if (!query) return true
  const haystack = keys
    .map((k) => {
      const v = item[k]
      if (v === undefined || v === null) return ''
      if (typeof v === 'object') return JSON.stringify(v)
      return String(v)
    })
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

/**
 * Client-side table state: search, sort, filter, pagination and row selection.
 * Pass the full (or already server-filtered) array of rows.
 */
export function useDataTable({
  items = [],
  searchableKeys = [],
  initialSortKey,
  initialSortDirection = 'asc',
  perPage = 10,
  rowId = 'id',
} = {}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(initialSortKey || null)
  const [sortDirection, setSortDirection] = useState(initialSortDirection)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(() => new Set())

  const filtered = useMemo(() => {
    let rows = query ? items.filter((it) => matchesQuery(it, searchableKeys, query)) : [...items]
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true })
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, sortKey, sortDirection])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(() => filtered.slice((safePage - 1) * perPage, safePage * perPage), [filtered, safePage, perPage])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const ids = pageRows.map((r) => r[rowId])
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      return new Set([...prev, ...ids])
    })
  }

  const clearSelection = () => setSelected(new Set())

  return {
    query,
    setQuery,
    sortKey,
    sortDirection,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    perPage,
    allRows: filtered,
    rows: pageRows,
    total,
    selected,
    toggleRow,
    toggleAll,
    clearSelection,
  }
}