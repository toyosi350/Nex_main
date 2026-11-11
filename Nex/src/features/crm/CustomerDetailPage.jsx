import { Link, useParams, useNavigate } from 'react-router-dom'
import { useGetCustomerQuery } from './api.js'
import { useGetInvoicesQuery } from '../sales/api.js'
import { useGetOrdersQuery } from '../sales/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DataTable } from '../../components/common/DataTable.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Tabs } from '../../components/common/Tabs.jsx'
import { Button } from '../../components/common/Button.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { formatDate, formatRelativeTime } from '../../utils/format.js'
import { useState } from 'react'
import { MdGroups, MdArrowBack } from 'react-icons/md'

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const vendorId = useCurrentVendor()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const { data: customer, isFetching, isError, error, refetch } = useGetCustomerQuery({ vendorId, customerId }, { skip: !vendorId })
  const { data: invData } = useGetInvoicesQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId || !customer })
  const { data: ordData } = useGetOrdersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId || !customer })

  if (isFetching && !customer) return <LoadingState label="Loading customer…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />

  const invoices = (invData?.items || []).filter((i) => i.customerId === customer.id)
  const orders = (ordData?.items || []).filter((o) => o.customerId === customer.id)

  const invCols = [
    { key: 'number', label: 'Invoice', render: (r) => <Link to={`/sales/invoices/${r.id}`}>{r.number}</Link> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'issueDate', label: 'Issued', render: (r) => <DateCell value={r.issueDate} /> },
    { key: 'dueDate', label: 'Due', render: (r) => <DateCell value={r.dueDate} /> },
    { key: 'total', label: 'Amount', align: 'right', render: (r) => <Money value={r.total} /> },
    { key: 'amountPaid', label: 'Paid', align: 'right', render: (r) => <Money value={r.amountPaid} /> },
  ]

  const ordCols = [
    { key: 'number', label: 'Order', render: (r) => <Link to={`/sales/orders/${r.id}`}>{r.number}</Link> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'orderDate', label: 'Ordered', render: (r) => <DateCell value={r.orderDate} /> },
    { key: 'grandTotal', label: 'Amount', align: 'right', render: (r) => <Money value={r.grandTotal} /> },
  ]

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'invoices', label: 'Invoices', count: invoices.length },
    { value: 'orders', label: 'Orders', count: orders.length },
    { value: 'activity', label: 'Activity' },
  ]

  return (
    <div className="stack">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><MdArrowBack /> Back</Button>

      <PageHeader
        title={customer.company || `${customer.firstName} ${customer.lastName}`}
        subtitle={`${customer.firstName} ${customer.lastName}${customer.email ? ` · ${customer.email}` : ''}`}
        icon={<MdGroups />}
        actions={<StatusPill status={customer.status} />}
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="stack">
          <div className="grid grid-stats">
            <OverviewStat label="Total invoiced" value={<Money value={customer.totalInvoiced} />} />
            <OverviewStat label="Paid to date" value={<Money value={customer.paidAmount} />} />
            <OverviewStat label="Outstanding balance" value={<Money value={customer.outstanding} tone={customer.outstanding > 0 ? 'danger' : undefined} />} />
            <OverviewStat label="Invoices / Orders" value={`${customer.invoiceCount ?? 0} / ${customer.orderCount ?? 0}`} />
          </div>

          <Card title="Contact details">
            <div className="detail-grid">
              <DetailItem label="Phone" value={customer.phone || '—'} />
              <DetailItem label="Address" value={customer.address || '—'} />
              <DetailItem label="Payment terms" value={customer.paymentTerms} />
              <DetailItem label="Credit limit" value={customer.creditLimit ? <Money value={customer.creditLimit} /> : '—'} />
              <DetailItem label="Customer since" value={formatDate(customer.createdAt)} />
            </div>
          </Card>

          {customer.notes?.length > 0 && (
            <Card title="Notes">
              {customer.notes.map((n, i) => (
                <div key={i} className="note-item">
                  <p className="mb-2">{n.text}</p>
                  <span className="muted text-xs">{n.by} · {formatRelativeTime(n.at)}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <Card padded={false}>
          <DataTable columns={invCols} rows={invoices} rowKey="id" emptyTitle="No invoices yet" onRowClick={(r) => navigate(`/sales/invoices/${r.id}`)} />
        </Card>
      )}

      {tab === 'orders' && (
        <Card padded={false}>
          <DataTable columns={ordCols} rows={orders} rowKey="id" emptyTitle="No orders yet" onRowClick={(r) => navigate(`/sales/orders/${r.id}`)} />
        </Card>
      )}

      {tab === 'activity' && (
        <Card title="Activity timeline" padded={false}>
          <ul className="activity-list">
            {customer.activity?.map((a) => (
              <li key={a.id} className="activity-item">
                <span className="activity-badge">{a.type?.[0] || '•'}</span>
                <span className="activity-text">{a.title}</span>
                <span className="activity-time muted">{formatRelativeTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function OverviewStat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  )
}

export default CustomerDetailPage