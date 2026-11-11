import { useParams } from 'react-router-dom'
import { useGetProductQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader } from '../../components/common/Card.jsx'
import { Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { StatCard } from '../../components/common/Card.jsx'
import { Money } from '../../components/common/Money.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { CategoryName } from './ProductListPage.jsx'
import { MdInventory2 } from 'react-icons/md'

export function ProductDetailPage() {
  const { productId } = useParams()
  const vendorId = useCurrentVendor()
  const { data: product, isFetching, isError, error, refetch } = useGetProductQuery({ vendorId, productId }, { skip: !vendorId })

  if (isFetching && !product) return <LoadingState label="Loading product…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!product) return <ErrorState title="Product not found" onRetry={refetch} />

  const movements = product.movements || []

  return (
    <div className="stack">
      <PageHeader
        title={product.name}
        subtitle={<> {product.sku} · <CategoryName id={product.categoryId} /> </>}
        icon={<MdInventory2 />}
        actions={<StatusPill status={product.status} />}
      />
      <div className="grid-4">
        <StatCard label="Available" value={product.available} />
        <StatCard label="Reserved" value={product.reserved} subtone="warning" />
        <StatCard label="Incoming" value={product.incoming} />
        <StatCard label="Inventory value" value={<Money value={product.inventoryValue} />} />
      </div>
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Stock movements">
            {movements.length === 0 ? (
              <p className="muted">No movements recorded.</p>
            ) : (
              <ul className="activity-list">
                {movements.map((m) => (
                  <li key={m.id} className="activity-item">
                    <span className={`activity-badge ${m.type === 'IN' ? 'ok' : 'warn'}`}>{m.type}</span>
                    <span className="activity-text">
                      {m.reason} · {m.warehouse || '—'}
                      <span className="muted"> · <DateCell value={m.at} /></span>
                    </span>
                    <span className="activity-time">{m.qty} units</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <aside className="doc-detail-side">
          <div className="stack-sm">
            <Card title="Pricing">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Selling price</div><div className="detail-value"><Money value={product.sellingPrice} /></div></div>
                <div className="detail-item"><div className="detail-label">Cost price</div><div className="detail-value"><Money value={product.costPrice} /></div></div>
                <div className="detail-item"><div className="detail-label">Tax rate</div><div className="detail-value">{product.taxRate}%</div></div>
              </div>
            </Card>
            <Card title="Details">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Category</div><div className="detail-value"><CategoryName id={product.categoryId} /></div></div>
                <div className="detail-item"><div className="detail-label">Unit</div><div className="detail-value">{product.unit}</div></div>
                <div className="detail-item"><div className="detail-label">Reorder level</div><div className="detail-value">{product.reorderLevel}</div></div>
                <div className="detail-item"><div className="detail-label">Brand</div><div className="detail-value">{product.brand || '—'}</div></div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ProductDetailPage