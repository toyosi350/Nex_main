import { useState, useCallback } from 'react'
import { useDebounce } from './useDebounce.js'

/**
 * Drives server-side list queries against the mock/API:
 * page, perPage, q (debounced), sortBy/sortDir, status filter + extra params.
 */
export function useListParams(initial = {}) {
  const [page, setPage] = useState(initial.page || 1)
  const [perPage, setPerPage] = useState(initial.perPage || 10)
  const [sortBy, setSortBy] = useState(initial.sortBy || 'createdAt')
  const [sortDir, setSortDir] = useState(initial.sortDir || 'DESC')
  const [status, setStatus] = useState(initial.status || 'ALL')
  const [search, setSearch] = useState(initial.search || '')
  const [extra, setExtra] = useState(initial.extra || {})

  const debouncedSearch = useDebounce(search, 320)

  const params = {
    page,
    perPage,
    sortBy,
    sortDir,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(status && status !== 'ALL' ? { status } : {}),
    ...extra,
  }

  const onSort = useCallback((key) => {
    setSortBy((current) => {
      if (current === key) {
        setSortDir((d) => (d === 'ASC' ? 'DESC' : 'ASC'))
        return current
      }
      setSortDir('DESC')
      return key
    })
  }, [])

  const reset = useCallback(() => {
    setPage(1)
    setPerPage(initial.perPage || 10)
    setSortBy(initial.sortBy || 'createdAt')
    setSortDir(initial.sortDir || 'DESC')
    setStatus('ALL')
    setSearch('')
    setExtra({})
  }, [initial])

  return {
    params,
    page,
    setPage,
    perPage,
    setPerPage,
    sortBy,
    sortDir,
    onSort,
    status,
    setStatus,
    search,
    setSearch,
    extra,
    setExtra,
    reset,
  }
}

export default useListParams