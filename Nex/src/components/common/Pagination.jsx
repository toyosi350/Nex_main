import { cn } from '../../utils/misc.js'
import { IconButton } from './Button.jsx'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

export function Pagination({ page, totalPages, onPageChange, perPage, onPerPageChange, total, disabled }) {
  if (total === 0) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i += 1) pages.push(i)

  return (
    <div className="pagination">
      <div className="pagination-left">
        {perPage && onPerPageChange && (
          <label className="pagination-per">
            Rows
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              disabled={disabled}
            >
              {[5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {total !== undefined && <span className="pagination-total">Showing {total} records</span>}
      </div>
      <div className="pagination-right">
        <IconButton label="Previous page" disabled={page <= 1 || disabled} onClick={() => onPageChange(page - 1)}>
          <MdChevronLeft />
        </IconButton>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={cn('page-btn', p === page && 'page-btn-active')}
            disabled={disabled}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <IconButton
          label="Next page"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          <MdChevronRight />
        </IconButton>
      </div>
    </div>
  )
}

export default Pagination