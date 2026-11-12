import { Link } from 'react-router-dom'

import {
  MdGroups,
  MdHistory,
  MdInsertChart,
  MdInventory2,
  MdPeople,
  MdPointOfSale,
  MdReceiptLong,
  MdShoppingCart,
  MdStorefront,
  MdSupportAgent,
  MdWarningAmber,
} from 'react-icons/md'

import { useGetAdminDashboardQuery } from './api.js'
import { useCurrentUser } from '../../hooks/useTenant.js'

import {
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import {
  AreaChart,
  BarChart,
  LineChart,
} from '../../components/charts/Charts.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'

import { formatNgn } from '../../utils/format.js'

export function AdminDashboardPage() {
  const user = useCurrentUser()

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminDashboardQuery()

  if (isFetching && !data) {
    return <LoadingState label="Loading platform dashboard…" />
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error?.data?.message ||
          error?.message ||
          'Unable to load the platform dashboard.'
        }
        onRetry={refetch}
      />
    )
  }

  if (!data) {
    return <LoadingState label="Preparing dashboard…" />
  }

  const metrics = data.metrics || {}
  const revenueByVendor = (data.revenueByVendor || []).slice(0, 8)
  const customerGrowth = data.customerGrowth || []
  const monthlyActivity = data.monthlyActivity || []

  const stats = [
    {
      label: 'Platform Revenue',
      value: formatNgn(metrics.platformRevenue || 0),
      icon: <MdPointOfSale />,
      tone: 'brand',
    },
    {
      label: 'Active Vendors',
      value: Number(metrics.activeVendors || 0).toLocaleString(),
      icon: <MdStorefront />,
      tone: 'success',
    },
    {
      label: 'Pending Onboarding',
      value: Number(metrics.pendingVendors || 0).toLocaleString(),
      icon: <MdWarningAmber />,
      tone: 'warning',
    },
    {
      label: 'Active Users',
      value: Number(metrics.activeUsers || 0).toLocaleString(),
      icon: <MdGroups />,
      tone: 'info',
    },
    {
      label: 'Customers',
      value: Number(metrics.totalCustomers || 0).toLocaleString(),
      icon: <MdPeople />,
      tone: 'info',
    },
    {
      label: 'Products Listed',
      value: Number(metrics.totalProducts || 0).toLocaleString(),
      icon: <MdInventory2 />,
      tone: 'teal',
    },
    {
      label: 'Transactions',
      value: Number(metrics.totalTransactions || 0).toLocaleString(),
      icon: <MdReceiptLong />,
      tone: 'teal',
    },
    {
      label: 'Open Tickets',
      value: Number(metrics.openTickets || 0).toLocaleString(),
      icon: <MdWarningAmber />,
      tone: 'danger',
    },
  ]

  const vendorColumns = [
    {
      key: 'company',
      label: 'Vendor',
      render: (v) => (
        <Link to={`/admin/vendors/${v.id}`} className="flex items-center gap-2">
          <Avatar name={v.company} size="sm" />
          <strong>{v.company}</strong>
        </Link>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (v) => v.city || '—',
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (v) => v.plan || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusPill status={v.status} />,
    },
    {
      key: 'createdAt',
      label: 'Signed up',
      render: (v) => v.createdAt?.slice(0, 10),
    },
  ]

  return (
    <div className="dashboard-page stack">

      {/* =====================================================
          WELCOME
      ===================================================== */}

      <section className="welcome-row">
        <h1 className="page-title">
          Good {timeOfDay()}, {getFirstName(user?.name)}
        </h1>

        <p className="page-subtitle muted">
          Here's what's happening across the platform today.
        </p>
      </section>

      {/* =====================================================
          MAIN KPIs
      ===================================================== */}

      <section className="grid grid-stats">
        {stats.slice(0, 4).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Platform revenue"
          subtitle="Last 12 months"
        >
          <AreaChart
            data={monthlyActivity}
            xKey="label"
            series={[
              { key: 'revenue', name: 'Revenue' },
            ]}
            currency
            height={280}
          />
        </Card>

        <Card
          title="Revenue by vendor"
          subtitle="Top 8 vendors"
        >
          <BarChart
            data={revenueByVendor}
            xKey="name"
            series={[
              { key: 'revenue', name: 'Revenue' },
            ]}
            currency
            height={280}
          />
        </Card>

      </section>

      {/* =====================================================
          SECONDARY KPIs
      ===================================================== */}

      <section className="grid grid-stats">
        {stats.slice(4).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* =====================================================
          REVENUE / SIGNUPS / GROWTH
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Recent vendor signups"
          actions={
            <Link to="/admin/vendors" className="link-btn">
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={vendorColumns}
            rows={data.recentVendors || []}
            rowKey="id"
            emptyTitle="No vendor signups yet"
            dense
          />
        </Card>

        <Card
          title="Customer growth"
          subtitle="New customers — last 9 months"
        >
          <LineChart
            data={customerGrowth}
            xKey="label"
            series={[
              { key: 'customers', name: 'Customers' },
            ]}
            height={280}
          />
        </Card>

      </section>

      {/* =====================================================
          ACTIVITY / HEALTH
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Monthly activity"
          subtitle="Invoices and orders filed — last 12 months"
        >
          <BarChart
            data={monthlyActivity}
            xKey="label"
            series={[
              { key: 'invoices', name: 'Invoices' },
              { key: 'orders', name: 'Orders' },
            ]}
            height={280}
          />
        </Card>

        <Card title="Platform at a glance">
          <ul className="activity-list">
            <li className="activity-item">
              <span className="activity-badge">
                {String(metrics.totalVendors || 0)}
              </span>
              <span className="activity-text">
                Vendors registered on the platform
              </span>
            </li>

            <li className="activity-item">
              <span className="activity-badge">
                {String(metrics.totalEmployees ?? 0)}
              </span>
              <span className="activity-text">
                Employees across all vendors
              </span>
            </li>

            <li className="activity-item">
              <span className="activity-badge">
                {String(metrics.totalTickets || 0)}
              </span>
              <span className="activity-text">
                Support tickets raised in total
              </span>
            </li>

            <li className="activity-item">
              <span className="activity-badge">
                {String(data.lowStockCount ?? 0)}
              </span>
              <span className="activity-text">
                Products at or below reorder level
              </span>
            </li>
          </ul>
        </Card>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="quick-actions">

        <Link to="/admin/vendors" className="qa-chip">
          <MdStorefront />
          Onboard Vendor
        </Link>

        <Link to="/admin/users" className="qa-chip">
          <MdGroups />
          Manage Users
        </Link>

        <Link to="/admin/reports" className="qa-chip">
          <MdInsertChart />
          View Reports
        </Link>

        <Link to="/admin/audit" className="qa-chip">
          <MdHistory />
          Audit Logs
        </Link>

        <Link to="/home" className="qa-chip">
          <MdShoppingCart />
          Storefront
        </Link>

        <Link to="/admin/support" className="qa-chip">
          <MdSupportAgent />
          Help & Support
        </Link>

      </section>

    </div>
  )
}

function getFirstName(name) {
  if (!name) return 'there'

  return name
    .trim()
    .split(/\s+/)[0]
}

function timeOfDay() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'morning'
  }

  if (hour < 17) {
    return 'afternoon'
  }

  return 'evening'
}

export default AdminDashboardPage
