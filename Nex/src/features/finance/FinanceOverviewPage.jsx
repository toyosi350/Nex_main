
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useGetFinancialQuery } from './api.js'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Money } from '../../components/common/Money.jsx'
import { BarChart, LineChart } from '../../components/charts/Charts.jsx'

import { MdAccountBalanceWallet } from 'react-icons/md'

import { PERMISSIONS as P } from '../../constants/roles.js'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'

export function FinanceOverviewPage() {
  const vendorId = useCurrentVendor()

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetFinancialQuery(
    {
      vendorId,
      params: {},
    },
    {
      skip: !vendorId,
    }
  )

  return (
    <PermissionGate permission={P.ACCOUNTING_VIEW}>
      {isFetching && !data ? (
        <LoadingState label="Loading financials…" />
      ) : isError ? (
        <ErrorState
          message={
            error?.data?.message ||
            'Unable to load financial information. Please try again.'
          }
          onRetry={refetch}
        />
      ) : (
        <FinanceOverviewContent data={data || {}} />
      )}
    </PermissionGate>
  )
}

function FinanceOverviewContent({ data }) {
  const revenue = Number(data.revenue) || 0
  const collected = Number(data.collected) || 0
  const expenses = Number(data.expenses) || 0
  const net = Number(data.net) || 0
  const outstanding = Number(data.outstanding) || 0
  const receivables = Number(data.receivables) || 0
  const payables = Number(data.payables) || 0

  const cash = (data.cashFlow || []).map((item) => ({
    ...item,
    label: item.label || '',
    inflow: Number(item.inflow) || 0,
    outflow: Number(item.outflow) || 0,
  }))

  const series = (data.series || []).map((item) => ({
    ...item,
    label: item.label || '',
    revenue: Number(item.revenue) || 0,
    expenses: Number(item.expenses) || 0,
  }))

  return (
    <div className="stack finance-overview-page">
      <PageHeader
        title="Finance overview"
        subtitle="Revenue, expenses and cash position"
        icon={<MdAccountBalanceWallet />}
      />

      <div className="grid-4 finance-summary-grid">
        <StatCard
          label="Revenue"
          value={<Money value={revenue} />}
          tone="brand"
        />

        <StatCard
          label="Collected"
          value={<Money value={collected} />}
          tone="success"
        />

        <StatCard
          label="Expenses"
          value={<Money value={expenses} />}
          tone="danger"
        />

        <StatCard
          label="Net profit"
          value={<Money value={net} />}
          tone={net >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid-2">
        <Card title="Revenue vs expenses">
          {series.length > 0 ? (
            <BarChart
              data={series}
              xKey="label"
              series={[
                {
                  key: 'revenue',
                  name: 'Revenue',
                  color: '#3b82f6',
                },
                {
                  key: 'expenses',
                  name: 'Expenses',
                  color: '#ef4444',
                },
              ]}
              height={280}
            />
          ) : (
            <p className="muted">
              No revenue or expense trend data is available yet.
            </p>
          )}
        </Card>

        <Card title="Cash flow">
          {cash.length > 0 ? (
            <LineChart
              data={cash}
              xKey="label"
              series={[
                {
                  key: 'inflow',
                  name: 'Inflow',
                  color: '#22c55e',
                },
                {
                  key: 'outflow',
                  name: 'Outflow',
                  color: '#f59e0b',
                },
              ]}
              height={280}
            />
          ) : (
            <p className="muted">
              No cash flow data is available yet.
            </p>
          )}
        </Card>
      </div>

      <div className="grid-3 finance-summary-grid">
        <StatCard
          label="Outstanding invoices"
          value={<Money value={outstanding} />}
          tone="danger"
        />

        <StatCard
          label="Receivables"
          value={<Money value={receivables} />}
          tone="brand"
        />

        <StatCard
          label="Payables"
          value={<Money value={payables} />}
          tone="warning"
        />
      </div>
    </div>
  )
}

export default FinanceOverviewPage
