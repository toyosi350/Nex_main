import { useParams } from 'react-router-dom'
import { useGetSupplierQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader } from '../../components/common/Card.jsx'
import { Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Money } from '../../components/common/Money.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Link } from 'react-router-dom'
import { DateCell } from '../../components/common/DateCell.jsx'

export function SupplierDetailPage() {
  const { supplierId } = useParams()
  const vendorId = useCurrentVendor()
  const { data: supplier, isFetching, isError, error, refetch } = useGetSupplierQuery({ vendorId, supplierId }, { skip: !vendorId })

  if (isFetching && !supplier) return <LoadingState label="Loading supplier…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!supplier) return <ErrorState title="Supplier not found" onRetry={refetch} />

  const orders = supplier.purchaseOrders || []
  const products = supplier.products || []

  return (
    <div className="stack">
      <PageHeader
        title={supplier.name}
        subtitle={supplier.contactPerson ? `Contact: ${supplier.contactPerson}` : undefined}
        icon={<Avatar name={supplier.name} size="md" />}
        actions={<StatusPill status={supplier.status} />}
      />
      <div className="grid-3">
        <Card title="Contact">
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{supplier.email || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{supplier.phone || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Address</div><div className="detail-value">{supplier.address || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Payment terms</div><div className="detail-value">{supplier.paymentTerms}</div></div>
            <div className="detail-item"><div className="detail-label">Payment method</div><div className="detail-value">{supplier.paymentMethod?.replace('_', ' ')}</div></div>
          </div>
        </Card>
        <Card title={`Purchase orders (${orders.length})`}>
          {orders.length === 0 ? (
            <p className="muted">No purchase orders yet.</p>
          ) : (
            <ul className="activity-list">
              {orders.map((po) => (
                <li key={po.id} className="activity-item">
                  <span className="activity-badge">PO</span>
                  <Link to={`/purchasing/orders/${po.id}`} className="activity-text">
                    {po.number}
                    <span className="muted"> · <DateCell value={po.createdAt} /></span>
                  </Link>
                  <span className="activity-time"><Money value={po.total} /></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={`Products (${products.length})`}>
          {products.length === 0 ? (
            <p className="muted">No linked products.</p>
          ) : (
            <ul className="activity-list">
              {products.map((p) => (
                <li key={p.id} className="activity-item">
                  <span className="activity-text">{p.sku} · {p.name}</span>
                  <span className="activity-time">{p.stock} in stock</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default SupplierDetailPage