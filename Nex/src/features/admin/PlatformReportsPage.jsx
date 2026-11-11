import { useState } from 'react'
import { useGetVendorsQuery } from './api.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { BarChart } from '../../components/charts/Charts.jsx'
import { Select } from '../../components/form/Field.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { DataTable } from '../../components/common/DataTable.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { MdInsertChart } from 'react-icons/md'

export function PlatformReportsPage() {
  const [scope, setScope] = useState('ALL')
  const { data: vendorsData, isFetching, refetch } = useGetVendorsQuery({ perPage: 200, sortBy: 'createdAt', sortDir: 'asc' })

  if (isFetching && !vendorsData) return <LoadingState label="Loading reports…" />
  if (!vendorsData) return <ErrorState message="Could not load report data" onRetry={refetch} />

  const vendors = vendorsData?.items || []
  const revenueData = vendors
    .filter((v) => scope === 'ALL' || v.id === scope)
    .slice(0, 50)
    .map((v) => ({ name: v.company, revenue: 0 }))

  return (
    <div className="stack">
      <PageHeader title="Platform reports" subtitle="Aggregate metrics across tenants" icon={<MdInsertChart />} />
      <div className="grid-4">
        <StatCard label="Vendors" value={vendors.length} />
        <StatCard label="Active" value={vendors.filter((v) => v.status === 'ACTIVE').length} tone="success" />
        <StatCard label="Pending" value={vendors.filter((v) => v.status === 'PENDING').length} tone="warning" />
        <StatCard label="Suspended" value={vendors.filter((v) => v.status === 'SUSPENDED').length} tone="danger" />
      </div>
      <Card title="Vendor breakdown">
        <Select value={scope} onChange={(e) => setScope(e.target.value)} style={{ maxWidth: 280 }} aria-label="Scope">
          <option value="ALL">All vendors</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.company}</option>)}
        </Select>
        <div className="mt-3">
          <BarChart data={revenueData} xKey="name" series={[{ key: 'revenue', name: 'Revenue', color: '#4f46e5' }]} height={240} />
        </div>
      </Card>
      <Card title="Vendors" padded={false}>
        <DataTable
          columns={[
            { key: 'company', label: 'Vendor', render: (r) => <strong>{r.company}</strong> },
            { key: 'plan', label: 'Plan' },
            { key: 'userCount', label: 'Users', align: 'center' },
            { key: 'productCount', label: 'Products', align: 'center' },
            { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
            { key: 'createdAt', label: 'Onboarded', render: (r) => r.createdAt?.slice(0, 10) },
          ]}
          rows={vendors}
          rowKey="id"
          emptyTitle="No vendors"
        />
      </Card>
    </div>
  )
}

export default PlatformReportsPage