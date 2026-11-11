/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from 'react-router-dom'
import { DocumentForm } from './DocumentForm.jsx'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { useGetOrdersQuery, useCreateOrderMutation } from './api.js'
import { Link } from 'react-router-dom'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdShoppingCart } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export const ORDER_COLUMNS = [
  {
    key: 'number',
    label: 'Order',
    sortable: true,
    render: (r) => (
      <span>
        <Link to={`/sales/orders/${r.id}`}><strong>{r.number}</strong></Link>
        <div className="muted text-xs">{r.customerName}</div>
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
  { key: 'orderedAt', label: 'Ordered', render: (r) => <DateCell value={r.orderedAt} /> },
  { key: 'expectedDelivery', label: 'Delivery', render: (r) => <DateCell value={r.expectedDelivery} /> },
  { key: 'grandTotal', label: 'Total', align: 'right', sortable: true, render: (r) => <Money value={r.grandTotal ?? r.total} /> },
]

export function OrderListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Sales orders"
      subtitle="Confirmed orders and fulfillment"
      icon={<MdShoppingCart />}
      permission={P.ORDER_VIEW}
      columns={ORDER_COLUMNS}
      queryHook={useGetOrdersQuery}
      paramsToArgs={(vendorId, params) => ({ vendorId, params })}
      createForm={OrderForm}
      createTitle="New sales order"
      createLabel="New order"
      options={{
        searchPlaceholder: 'Search orders…',
        statuses: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'CONFIRMED', label: 'Confirmed' },
          { value: 'RESERVED', label: 'Reserved' },
          { value: 'FULFILLED', label: 'Fulfilled' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
      }}
      emptyTitle="No sales orders yet"
      onRowClick={(row) => navigate(`/sales/orders/${row.id}`)}
    />
  )
}

function OrderForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateOrderMutation()
  const toast = useToast()

  return (
    <DocumentForm
      title="order"
      onDone={onDone}
      submitting={createState.isLoading}
      initial={{ dueDate: undefined, validUntil: undefined }}
      onSubmit={async (values) => {
        try {
          await create({ vendorId, ...values, status: 'PENDING' }).unwrap()
          toast.success('Order created')
          onDone()
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to create order')
        }
      }}
    />
  )
}

export default OrderListPage