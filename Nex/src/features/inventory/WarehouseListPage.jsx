import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetWarehousesQuery } from './api.js'
import { Money } from '../../components/common/Money.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { MdWarehouse } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function WarehouseListPage() {
  return (
    <ListPage
      title="Warehouses"
      subtitle="Storage locations and utilization"
      icon={<MdWarehouse />}
      permission={P.INVENTORY_VIEW}
      keyField="id"
      columns={[
        {
          key: 'name', label: 'Warehouse', sortable: true,
          render: (r) => (
            <span>
              <strong>{r.name}</strong>
              <div className="muted text-xs">{r.location || ''}</div>
            </span>
          ),
        },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'ACTIVE'} /> },
        { key: 'stockLines', label: 'Stock lines', align: 'right', sortable: true },
        { key: 'totalUnits', label: 'Units', align: 'right', sortable: true },
        { key: 'value', label: 'Value', align: 'right', sortable: true, render: (r) => <Money value={r.value} /> },
      ]}
      queryHook={useGetWarehousesQuery}
      paramsToArgs={(vid) => vid}
      pickData={(d) => ({ items: d || [], total: (d || []).length })}
      emptyTitle="No warehouses yet"
      createForm={undefined}
    />
  )
}

export default WarehouseListPage