import { useParams, Link } from 'react-router-dom'
import { useGetOrderQuery, useOrderTransitionMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { DocDetailLayout } from './DocDetail.jsx'
import { Card } from '../../components/common/Card.jsx'
import { LinesTable, TotalsPanel, ActivityTimeline } from '../../components/common/DocumentSections.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { useToast } from '../../hooks/useToast.js'
import * as statuses from '../../constants/statuses.js'
import { MdShoppingCart } from 'react-icons/md'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const { data: order, isFetching, isError, error, refetch } = useGetOrderQuery({ vendorId, orderId }, { skip: !vendorId })
  const [transition, tState] = useOrderTransitionMutation()

  if (isFetching && !order) return <LoadingState label="Loading order…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!order) return <ErrorState title="Order not found" onRetry={refetch} />

  const summary = [
    ['Order number', order.number],
    ['Status', <StatusPill key="s" status={order.status} />],
    ['Ordered', <DateCell key="d" value={order.orderedAt} />],
    ['Expected delivery', <DateCell key="e" value={order.expectedDelivery} />],
  ]

  // Support the real API re-exporting total as `total` or the seeded `grandTotal`.
  const total = order.total ?? order.grandTotal
  const subtotal = order.subtotal ?? total
  const discount = order.discount ?? 0
  const tax = order.tax ?? 0

  return (
    <DocDetailLayout
      title={order.number}
      subtitle={<Link to={`/customers/${order.customerId}`}>{order.customerName}</Link>}
      icon={<MdShoppingCart />}
      status={order.status}
      stateMap={statuses.ORDER_TRANSITIONS}
      onTransition={async (to) => {
        try {
          await transition({ vendorId, orderId, to }).unwrap()
          toast.success(`Order marked ${to}`)
        } catch (err) {
          toast.error(err?.data?.message || 'Transition failed')
        }
      }}
      transitioning={tState.isLoading}
      sidebar={
        <div className="stack-sm">
          <Card title="Summary"><SummaryList rows={summary} /></Card>
          {(order.quoteId || order.invoice) && (
            <Card title="Linked documents">
              <div className="flex-col gap-2">
                {order.quoteId && <Link to={`/sales/quotes/${order.quoteId}`} className="link-btn">View source quote</Link>}
                {order.invoice && <Link to={`/sales/invoices/${order.invoice.id}`} className="link-btn">View invoice {order.invoice.number}</Link>}
              </div>
            </Card>
          )}
          <Card title="Activity"><ActivityTimeline activity={order.activity} /></Card>
        </div>
      }
    >
      <Card padded={false}>
        <LinesTable lines={order.lines} />
        <div className="divider" />
        <TotalsPanel
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
        />
      </Card>
    </DocDetailLayout>
  )
}

function SummaryList({ rows }) {
  return (
    <div className="detail-grid">
      {rows.map(([l, v]) => (
        <div key={l} className="detail-item">
          <div className="detail-label">{l}</div>
          <div className="detail-value">{v}</div>
        </div>
      ))}
    </div>
  )
}

export default OrderDetailPage