import { useGetAdminDashboardQuery } from './api.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { BarChart, LineChart } from '../../components/charts/Charts.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Link } from 'react-router-dom'
import { MdDashboard } from 'react-icons/md'

export function AdminDashboardPage() {
  const { data, isFetching, isError, error, refetch } = useGetAdminDashboardQuery()

  if (isFetching && !data) return <LoadingState label="Loading platform dashboard…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!data) return null

  const m = data.metrics || {}
  const revenueByVendor = (data.revenueByVendor || []).slice(0, 8)

  return (
    <div className="stack">
      <PageHeader title="Platform overview" subtitle="Health of the Nex-IV platform" icon={<MdDashboard />} />
      <div className="grid-4">
        <StatCard label="Vendors" value={m.totalVendors} />
        <StatCard label="Active vendors" value={m.activeVendors} tone="success" />
        <StatCard label="Pending onboarding" value={m.pendingVendors} tone="warning" />
        <StatCard label="Platform revenue" value={<Money value={m.platformRevenue} />} />
      </div>
      <div className="grid-4">
        <StatCard label="Users" value={m.activeUsers} />
        <StatCard label="Customers" value={m.totalCustomers} />
        <StatCard label="Transactions" value={m.totalTransactions} />
        <StatCard label="Open tickets" value={m.openTickets} tone="danger" />
      </div>
      <div className="grid-2">
        <Card title="Revenue by vendor">
          <BarChart data={revenueByVendor} xKey="name" series={[{ key: 'revenue', name: 'Revenue', color: '#4f46e5' }]} height={260} />
        </Card>
        <Card title="Monthly activity">
          <LineChart data={data.monthlyActivity || []} xKey="label" series={[
            { key: 'revenue', name: 'Revenue', color: '#2563eb' },
            { key: 'invoices', name: 'Invoices', color: '#16a34a' },
            { key: 'tickets', name: 'Tickets', color: '#d97706' },
          ]} height={260} />
        </Card>
      </div>
      <Card title="Recent vendor signups">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>City</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Signed up</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentVendors || []).map((v) => (
              <tr key={v.id}>
                <td>
                  <Link to={`/admin/vendors/${v.id}`} className="flex items-center gap-2">
                    <Avatar name={v.company} size="sm" />
                    <strong>{v.company}</strong>
                  </Link>
                </td>
                <td>{v.city || '—'}</td>
                <td>{v.plan || '—'}</td>
                <td><StatusPill status={v.status} /></td>
                <td>{v.createdAt?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default AdminDashboardPage