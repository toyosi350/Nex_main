import { useCallback, useState } from 'react'

export function usePagination({ total, perPage = 10, initialPage = 1 } = {}) {
  const [page, setPage] = useState(initialPage)

  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage))

  const goToPage = useCallback(
    (p) => {
      setPage(Math.max(1, Math.min(totalPages, p)))
    },
    [totalPages]
  )

  const next = useCallback(() => goToPage(page + 1), [goToPage, page])
  const prev = useCallback(() => goToPage(page - 1), [goToPage, page])

  return { page, totalPages, perPage, setPage, goToPage, next, prev }
}