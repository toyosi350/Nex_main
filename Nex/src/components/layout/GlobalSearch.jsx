import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchInput } from '../form/SearchInput.jsx'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useGlobalSearchQuery } from '../../features/vendor/api.js'
import { formatMoney } from '../../utils/format.js'
import { StatusPill } from '../common/StatusPill.jsx'

const GROUPS = [
  ['customers', 'Customers', '/customers'],
  ['providers', 'Suppliers', '/purchasing/suppliers'],
  ['products', 'Products', '/inventory/products'],
  ['orders', 'Orders', '/sales/orders'],
  ['invoices', 'Invoices', '/sales/invoices'],
  ['projects', 'Projects', '/projects'],
  ['tickets', 'Tickets', '/support/tickets'],
  ['employees', 'Employees', '/hr/employees'],
]

const NAME_KEYS = ['name', 'number', 'firstName', 'subject']

function displayName(item) {
  for (const k of NAME_KEYS) {
    if (item[k]) {
      if (k === 'firstName') return `${item.firstName} ${item.lastName || ''}`.trim()
      if (k === 'number') return `${item.kind === 'invoice' ? 'INV' : 'ORD'}-${item.number}`
      return item[k]
    }
  }
  return item.id
}

export function GlobalSearch({ basePath = '' }) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 350)
  const navigate = useNavigate()
  const { data, isFetching } = useGlobalSearchQuery({ q: debounced }, { skip: !debounced })

  const groups = useMemo(() => {
    const results = data?.results || {}
    return GROUPS.map(([key, label, path]) => ({ key, label, path, items: results[key] || [] })).filter(
      (g) => g.items.length > 0
    )
  }, [data])

  const go = (type, item) => {
    navigate(`${basePath}${type.path}/${item.id}`)
    setQuery('')
  }

  return (
    <div className="global-search">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search customers, invoices, orders, products…"
        className="global-search-input"
      />
      {query ? (
        <div className="global-search-results">
          {isFetching && <div className="global-search-status">Searching…</div>}
          {!isFetching && groups.length === 0 && <div className="global-search-status">No results for “{query}”</div>}
          {!isFetching &&
            groups.map((g) => (
              <div key={g.key} className="search-group">
                <div className="search-group-title">
                  {g.label} <span className="search-group-count">{g.items.length}</span>
                </div>
                {g.items.map((item) => (
                  <button type="button" key={item.id} className="search-result" onClick={() => go(g, item)}>
                    <span className="search-result-main">{displayName(item)}</span>
                    <span className="search-result-meta">
                      <StatusPill status={item.status} />
                      {(item.total !== undefined || item.grandTotal !== undefined) && (
                        <span className="money muted">{formatMoney(item.total ?? item.grandTotal)}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ))}
        </div>
      ) : null}
    </div>
  )
}

export default GlobalSearch