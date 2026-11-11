import { cn } from '../../utils/misc.js'
import { Spinner } from './Spinner.jsx'
import { EmptyState } from './state/EmptyState.jsx'
import { ErrorState } from './state/ErrorState.jsx'
import { Pagination } from './Pagination.jsx'
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md'

/**
 * Featured data table. Supports:
 * - column renderers & sorting indicators
 * - row selection & striping
 * - empty / loading / error states
 * - server-side pagination callbacks
 */
export function DataTable({
  columns,
  rows = [],
  rowKey = 'id',
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  selection,
  pagination,
  emptyTitle,
  emptyMessage,
  className,
  tableClassName,
  dense = false,
}) {
  const renderSortIcon = (col) => {
    if (!pagination?.sortKey) return null
    if (pagination.sortKey !== col.key) return null
    return pagination.sortDirection === 'asc' ? <MdArrowDropUp /> : <MdArrowDropDown />
  }

  const showCheckbox = !!selection

  return (
    <div className={cn('datatable', className)}>
      <div className="datatable-scroll">
        <table className={cn('table', dense && 'table-dense', tableClassName)}>
          <thead>
            <tr>
              {showCheckbox && (
                <th className="table-check">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selection.allChecked}
                    onChange={selection.onToggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('text-truncate', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                  style={{ width: col.width }}
                >
                  <span className="table-th-inner">
                    {col.label}
                    {col.sortable && pagination?.onSort && (
                      <button type="button" className="table-sort" onClick={() => pagination.onSort(col.key)}>
                        {renderSortIcon(col)}
                      </button>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row[rowKey]}
                className={cn(onRowClick && 'table-row-click', selection?.selected?.has(row[rowKey]) && 'table-row-selected')}
                onClick={() => onRowClick?.(row)}
              >
                {showCheckbox && (
                  <td className="table-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selection.selected.has(row[rowKey])}
                      onChange={() => selection.onToggle(row[rowKey])}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="datatable-loading">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <ErrorState message={error?.data?.message || error?.message} onRetry={onRetry} />
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState title={emptyTitle || 'No records found'} message={emptyMessage} />
      )}

      {pagination && !loading && !error && rows.length > 0 && <Pagination {...pagination} />}
    </div>
  )
}

export default DataTable