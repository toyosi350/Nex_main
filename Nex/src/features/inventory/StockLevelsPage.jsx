import { useState } from 'react'
import { PageHeader } from '../../components/common/Card.jsx'
import { DataTable } from '../../components/common/DataTable.jsx'
import { SearchInput } from '../../components/form/SearchInput.jsx'
import { useGetInventoryQuery, useGetWarehousesQuery } from './api.js'
import { useListParams } from '../../hooks/useListParams.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { usePermissions } from '../../hooks/usePermissions.js'
import { Money } from '../../components/common/Money.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { MdWarehouse } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function StockLevelsPage() {
  const vendorId = useCurrentVendor()
  const { hasPermission } = usePermissions()
  const [warehouse, setWarehouse] = useState('')
  const list = useListParams({ perPage: 20, initial: { perPage: 20 } })
  const { data: warehouses } = useGetWarehousesQuery(vendorId, { skip: !vendorId })
  const params = { ...list.params, ...(warehouse ? { warehouseId: warehouse } : {}) }
  const { data, isFetching, isError, error, refetch } = useGetInventoryQuery(
    { vendorId, params },
    { skip: !vendorId || (P.INVENTORY_VIEW && !hasPermission(P.INVENTORY_VIEW)) }
  )
  const rows = data?.items || []
  const total = data?.total || 0

  const columns = [
    {
      key: 'productName', label: 'Product', sortable: true,
      render: (r) => (
        <span>
          <strong>{r.productName}</strong>
          <div className="muted text-xs">{r.sku}</div>
        </span>
      ),
    },
    { key: 'warehouseName', label: 'Warehouse', render: (r) => r.warehouseName },
    { key: 'available', label: 'Available', align: 'right', sortable: true },
    { key: 'reserved', label: 'Reserved', align: 'right' },
    { key: 'incoming', label: 'Incoming', align: 'right' },
    { key: 'value', label: 'Value', align: 'right', render: (r) => <Money value={r.value} /> },
    {
      key: 'status',
      label: 'Stock status',
      render: (r) => r.available <= 0 ? <Badge tone="danger">Out</Badge> : r.available <= r.reorderLevel ? <Badge tone="warning">Low</Badge> : <Badge tone="success">OK</Badge>,
    },
  ]

  return (
    <div className="stack">
      <PageHeader title="Stock levels" subtitle="Product availability by warehouse" icon={<MdWarehouse />} />
      <div className="toolbar">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Filter by SKU…" />
        <select className="select toolbar-filter" value={warehouse} onChange={(e) => { setWarehouse(e.target.value); list.setPage(1) }} aria-label="Filter by warehouse">
          <option value="">All warehouses</option>
          {(warehouses || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        loading={isFetching}
        error={isError ? error : null}
        onRetry={refetch}
        emptyTitle="No stock records"
        pagination={{
          page: list.page,
          totalPages: data?.totalPages || 1,
          total,
          perPage: list.perPage,
          onPerPageChange: (n) => { list.setPerPage(n); list.setPage(1) },
          onPageChange: list.setPage,
          sortKey: list.sortBy,
          sortDirection: list.sortDir.toLowerCase(),
          onSort: list.onSort,
          disabled: isFetching,
        }}
      />
    </div>
  )
}

export default StockLevelsPage