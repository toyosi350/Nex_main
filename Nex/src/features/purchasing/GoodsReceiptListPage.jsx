import { Link } from 'react-router-dom'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetGoodsReceiptsQuery } from './api.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdInventory2 } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function GoodsReceiptListPage() {
  return (
    <ListPage
      title="Goods receipts"
      subtitle="Received inventory batches (GRNs)"
      icon={<MdInventory2 />}
      permission={P.PURCHASE_VIEW}
      columns={[
        {
          key: 'number', label: 'GRN', sortable: true,
          render: (r) => (
            <span>
              <strong>{r.number}</strong>
              <div className="muted text-xs">{r.supplierName}</div>
            </span>
          ),
        },
        {
          key: 'purchaseOrderId', label: 'Purchase order',
          render: (r) => r.purchaseOrderId ? <Link to={`/purchasing/orders/${r.purchaseOrderId}`}>View PO</Link> : <span className="muted">—</span>,
        },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'receivedAt', label: 'Received', render: (r) => <DateCell value={r.receivedAt} /> },
        {
          key: 'total', label: 'Total', align: 'right', sortable: true,
          render: (r) => <Money value={(r.lines || []).reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitCost || 0), 0)} />,
        },
      ]}
      queryHook={useGetGoodsReceiptsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      options={{ searchPlaceholder: 'Search receipts…' }}
      emptyTitle="No goods receipts yet"
    />
  )
}

export default GoodsReceiptListPage