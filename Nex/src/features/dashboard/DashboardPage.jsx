import { Link } from 'react-router-dom'

import {
  MdAccountBalanceWallet,
  MdAttachMoney,
  MdGroups,
  MdInventory2,
  MdPointOfSale,
  MdReceiptLong,
  MdRequestQuote,
  MdShoppingCart,
  MdTrendingUp,
  MdWarningAmber,
} from 'react-icons/md'

import { useGetVendorDashboardQuery } from '../vendor/api.js'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useCurrentUser } from '../../hooks/useTenant.js'

import {
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import {
  AreaChart,
  BarChart,
} from '../../components/charts/Charts.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'

import {
  formatNgn,
  formatRelativeTime,
} from '../../utils/format.js'

export function DashboardPage() {
  const vendorId = useCurrentVendor()
  const user = useCurrentUser()

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetVendorDashboardQuery(
    vendorId,
    {
      skip: !vendorId,
    },
  )

  if (isFetching && !data) {
    return (
      <LoadingState
        label="Loading dashboard…"
      />
    )
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error?.data?.message ||
          error?.message ||
          'Unable to load the vendor dashboard.'
        }
        onRetry={refetch}
      />
    )
  }

  if (!data) {
    return (
      <LoadingState
        label="Preparing dashboard…"
      />
    )
  }

  const metrics = data.metrics || {}

  const stats = [
    {
      label: 'Total Sales',
      value: formatNgn(
        metrics.sales || 0,
      ),
      icon: <MdPointOfSale />,
      tone: 'brand',
    },

    {
      label: 'Collected',
      value: formatNgn(
        metrics.collected || 0,
      ),
      icon: (
        <MdAccountBalanceWallet />
      ),
      tone: 'success',
    },

    {
      label: 'Expenses',
      value: formatNgn(
        metrics.expenses || 0,
      ),
      icon: <MdAttachMoney />,
      tone: 'warning',
    },

    {
      label: 'Gross Profit',
      value: formatNgn(
        metrics.grossProfit || 0,
      ),
      icon: <MdTrendingUp />,
      tone: 'teal',
    },

    {
      label: 'Receivables',
      value: formatNgn(
        metrics.receivables || 0,
      ),
      icon: <MdWarningAmber />,
      tone: 'danger',
    },

    {
      label: 'Payables',
      value: formatNgn(
        metrics.payables || 0,
      ),
      icon: <MdWarningAmber />,
      tone: 'warning',
    },

    {
      label: 'Customers',
      value: Number(
        metrics.customers || 0,
      ).toLocaleString(),

      icon: <MdGroups />,
      tone: 'info',
    },

    {
      label: 'Inventory Value',
      value: formatNgn(
        metrics.inventoryValue || 0,
      ),
      icon: <MdInventory2 />,
      tone: 'teal',
    },
  ]

  const invoiceColumns = [
    {
      key: 'number',
      label: 'Invoice',
    },

    {
      key: 'customerName',
      label: 'Customer',
    },

    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusPill
          status={row.status}
        />
      ),
    },

    {
      key: 'issueDate',
      label: 'Issued',
      render: (row) => (
        <DateCell
          value={row.issueDate}
        />
      ),
    },

    {
      key: 'total',
      label: 'Amount',
      align: 'right',
      render: (row) => (
        <Money
          value={row.total}
        />
      ),
    },
  ]

  const orderColumns = [
    {
      key: 'number',
      label: 'Order',
    },

    {
      key: 'customerName',
      label: 'Customer',
    },

    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusPill
          status={row.status}
        />
      ),
    },

    {
      key: 'orderDate',
      label: 'Date',
      render: (row) => (
        <DateCell
          value={row.orderDate}
        />
      ),
    },

    {
      key: 'grandTotal',
      label: 'Amount',
      align: 'right',
      render: (row) => (
        <Money
          value={row.grandTotal}
        />
      ),
    },
  ]

  const lowStockColumns = [
    {
      key: 'productName',
      label: 'Product',
    },

    {
      key: 'warehouseName',
      label: 'Warehouse',
    },

    {
      key: 'available',
      label: 'Available',
      align: 'right',
    },

    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      align: 'right',
    },

    {
      key: 'status',
      label: 'Status',

      render: (row) => (
        <StatusPill
          status={
            Number(row.available || 0) <= 0
              ? 'out_of_stock'
              : 'low'
          }
        />
      ),
    },
  ]

  const recentInvoices =
    data.recentInvoices || []

  const recentOrders =
    data.recentOrders || []

  const lowStock =
    data.lowStock || []

  const activities =
    data.activities || []

  return (
  <div className="dashboard-page stack">

      {/* =====================================================
          WELCOME
      ===================================================== */}

      <section className="welcome-row">
        <h1 className="page-title">
          Good {timeOfDay()},{' '}
          {getFirstName(user?.name)} 👋
        </h1>

        <p className="page-subtitle muted">
          Here's what's happening with
          your business today.
        </p>
      </section>

      {/* =====================================================
          MAIN KPIs
      ===================================================== */}

      <section className="grid grid-stats">
        {stats
          .slice(0, 4)
          .map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
            />
          ))}
      </section>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Revenue vs Collections"
          subtitle="Last 12 months"
        >
          <AreaChart
            data={
              data.salesSeries || []
            }
            xKey="label"
            series={[
              {
                key: 'revenue',
                name: 'Revenue',
              },
              {
                key: 'collected',
                name: 'Collected',
              },
            ]}
            currency
            height={280}
          />
        </Card>

        <Card
          title="Operating Expenses"
          subtitle="Last 12 months"
        >
          <BarChart
            data={
              data.expenseSeries || []
            }
            xKey="label"
            series={[
              {
                key: 'expenses',
                name: 'Expenses',
              },
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
        {stats
          .slice(4)
          .map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
            />
          ))}
      </section>

      {/* =====================================================
          INVOICES / ORDERS
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Recent Invoices"
          actions={
            <Link
              to="/sales/invoices"
              className="link-btn"
            >
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={invoiceColumns}
            rows={recentInvoices}
            rowKey="id"
            emptyTitle="No invoices yet"
          />
        </Card>

        <Card
          title="Recent Orders"
          actions={
            <Link
              to="/sales/orders"
              className="link-btn"
            >
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={orderColumns}
            rows={recentOrders}
            rowKey="id"
            emptyTitle="No orders yet"
          />
        </Card>

      </section>

      {/* =====================================================
          STOCK / ACTIVITY
      ===================================================== */}

      <section className="grid grid-2">

        <Card
          title="Low Stock Alerts"
          subtitle={`${metrics.lowStockCount || 0} items below reorder level`}
          padded={false}
        >
          <DataTable
            columns={lowStockColumns}
            rows={lowStock}
            rowKey="id"
            emptyTitle="All stock levels are healthy"
            dense
          />
        </Card>

        <Card
          title="Recent Activity"
          padded={false}
        >
          <ul className="activity-list">

            {activities.map(
              (activity) => (
                <li
                  key={activity.id}
                  className="activity-item"
                >
                  <span className="activity-badge">
                    {String(
                      activity.type ||
                        'A',
                    )[0]}
                  </span>

                  <span className="activity-text">
                    {activity.title}
                  </span>

                  <span className="activity-time muted">
                    {formatRelativeTime(
                      activity.at,
                    )}
                  </span>
                </li>
              ),
            )}

          </ul>
        </Card>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="quick-actions">

        <Link
          to="/customers"
          className="qa-chip"
        >
          <MdGroups />
          New Customer
        </Link>

        <Link
          to="/sales/quotes"
          className="qa-chip"
        >
          <MdRequestQuote />
          New Quote
        </Link>

        <Link
          to="/sales/orders"
          className="qa-chip"
        >
          <MdShoppingCart />
          New Order
        </Link>

        <Link
          to="/sales/invoices"
          className="qa-chip"
        >
          <MdReceiptLong />
          New Invoice
        </Link>

        <Link
          to="/inventory/products"
          className="qa-chip"
        >
          <MdInventory2 />
          Add Product
        </Link>

        <Link
          to="/finance/expenses"
          className="qa-chip"
        >
          <MdAttachMoney />
          Record Expense
        </Link>

      </section>

    </div>
  )
}

function getFirstName(name) {
  if (!name) {
    return 'there'
  }

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

export default DashboardPage