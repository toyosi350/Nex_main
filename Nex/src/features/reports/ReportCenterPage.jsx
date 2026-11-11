import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdAssessment,
  MdRefresh,
  MdSearch,
  MdPointOfSale,
  MdShoppingCart,
  MdInventory2,
  MdReceiptLong,
  MdPeople,
  MdLocalShipping,
  MdBadge,
  MdAccountBalance,
} from 'react-icons/md'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useGetReportQuery } from '../vendor/api.js'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import {
  BarChart,
  DonutChart,
} from '../../components/charts/Charts.jsx'
import { Money } from '../../components/common/Money.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'
import { PERMISSIONS as P } from '../../constants/roles.js'

import './ReportCenterPage.css'

const REPORTS = [
  { key: 'sales', label: 'Sales', icon: MdPointOfSale },
  { key: 'purchases', label: 'Purchases', icon: MdShoppingCart },
  { key: 'inventory', label: 'Inventory', icon: MdInventory2 },
  { key: 'expenses', label: 'Expenses', icon: MdReceiptLong },
  { key: 'customers', label: 'Customers', icon: MdPeople },
  { key: 'suppliers', label: 'Suppliers', icon: MdLocalShipping },
  { key: 'employees', label: 'Employees', icon: MdBadge },
  { key: 'financial', label: 'Tax & Revenue', icon: MdAccountBalance },
]

const CURRENCY_METRICS = {
  sales: ['Sales', 'Collected', 'Outstanding'],
  purchases: ['Total ordered', 'Received', 'Pending'],
  inventory: ['Value'],
  expenses: ['Total expenses', 'Approved', 'Pending'],
  customers: ['Outstanding', 'Lifetime'],
  suppliers: [],
  employees: [],
  financial: ['Revenue', 'VAT collected'],
}

function reportColumns(reportType) {
  switch (reportType) {
    case 'sales':
      return [
        {
          key: 'number',
          label: 'Invoice',
          render: (r) => (
            <Link to={`/sales/invoices/${r.id}`}>
              <strong>{r.number || '—'}</strong>
            </Link>
          ),
        },
        { key: 'customerName', label: 'Customer' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
        {
          key: 'total',
          label: 'Total',
          align: 'right',
          render: (r) => <Money value={r.total ?? 0} />,
        },
      ]

    case 'purchases':
      return [
        {
          key: 'number',
          label: 'PO',
          render: (r) => <strong>{r.number || '—'}</strong>,
        },
        { key: 'supplierName', label: 'Supplier' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
        {
          key: 'total',
          label: 'Total',
          align: 'right',
          render: (r) => <Money value={r.total ?? 0} />,
        },
      ]

    case 'inventory':
      return [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Product' },
        { key: 'available', label: 'Available', align: 'right' },
        { key: 'reorderLevel', label: 'Low at', align: 'right' },
      ]

    case 'expenses':
      return [
        {
          key: 'number',
          label: 'Expense',
          render: (r) => <strong>{r.number || '—'}</strong>,
        },
        { key: 'category', label: 'Category' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
        {
          key: 'amount',
          label: 'Amount',
          align: 'right',
          render: (r) => <Money value={r.amount ?? 0} />,
        },
      ]

    case 'customers':
      return [
        {
          key: 'firstName',
          label: 'Customer',
          render: (r) => (
            <span>
              {r.company ||
                [r.firstName, r.lastName].filter(Boolean).join(' ') ||
                '—'}
            </span>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
        {
          key: 'totalInvoiced',
          label: 'Lifetime',
          align: 'right',
          render: (r) => (
            <Money value={r.totalInvoiced ?? 0} />
          ),
        },
        {
          key: 'outstanding',
          label: 'Outstanding',
          align: 'right',
          render: (r) => (
            <Money value={r.outstanding ?? 0} />
          ),
        },
      ]

    case 'suppliers':
      return [
        {
          key: 'name',
          label: 'Supplier',
          render: (r) => <strong>{r.name || '—'}</strong>,
        },
        { key: 'contactPerson', label: 'Contact' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
      ]

    case 'employees':
      return [
        { key: 'employeeId', label: 'ID' },
        {
          key: 'name',
          label: 'Name',
          render: (r) => <strong>{r.name || '—'}</strong>,
        },
        { key: 'position', label: 'Position' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <StatusPill status={r.status || 'Unknown'} />
          ),
        },
      ]

    case 'financial':
      return [
        {
          key: 'number',
          label: 'Invoice',
          render: (r) => <strong>{r.number || '—'}</strong>,
        },
        { key: 'customerName', label: 'Customer' },
        {
          key: 'total',
          label: 'Total',
          align: 'right',
          render: (r) => <Money value={r.total ?? 0} />,
        },
        {
          key: 'tax',
          label: 'VAT',
          align: 'right',
          render: (r) => <Money value={r.tax ?? 0} />,
        },
      ]

    default:
      return []
  }
}

function summaryCards(reportType, data) {
  const summary = data?.summary || {}

  switch (reportType) {
    case 'sales':
      return [
        ['Sales', summary.totalSales],
        ['Collected', summary.collected],
        ['Outstanding', summary.outstanding, 'danger'],
        ['Orders', summary.orderCount],
      ]

    case 'purchases':
      return [
        ['Purchase orders', summary.poCount],
        ['Total ordered', summary.totalOrdered],
        ['Received', summary.received],
        ['Pending', summary.pending, 'warning'],
      ]

    case 'inventory':
      return [
        ['SKUs', summary.totalSKUs],
        ['Value', summary.totalValue],
        ['Low stock', summary.lowStock, 'warning'],
        ['Out of stock', summary.outOfStock, 'danger'],
      ]

    case 'expenses':
      return [
        ['Total expenses', summary.totalExpenses],
        ['Approved', summary.approved],
        ['Pending', summary.pending, 'warning'],
        ['Count', summary.count],
      ]

    case 'customers':
      return [
        ['Customers', summary.total],
        ['Active', summary.active],
        ['Outstanding', summary.outstanding, 'danger'],
        ['Lifetime', summary.totalLifetime],
      ]

    case 'suppliers':
      return [['Suppliers', summary.total]]

    case 'employees':
      return [['Employees', summary.total]]

    case 'financial':
      return [
        ['Revenue', summary.revenue],
        ['VAT collected', summary.taxCollected],
        ['Invoices', summary.invoiceCount],
      ]

    default:
      return []
  }
}

function formatMetric(reportType, label, value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (CURRENCY_METRICS[reportType]?.includes(label)) {
    return <Money value={Number(value) || 0} />
  }

  return value
}

function ReportCenterContent() {
  const [reportType, setReportType] = useState('sales')
  const [search, setSearch] = useState('')

  const vendorId = useCurrentVendor()

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetReportQuery(
    {
      vendorId,
      reportType,
      params: {},
    },
    {
      skip: !vendorId,
    },
  )

  const cards = useMemo(
    () => summaryCards(reportType, data || {}),
    [reportType, data],
  )

  const columns = useMemo(
    () => reportColumns(reportType),
    [reportType],
  )

  const items = Array.isArray(data?.items) ? data.items : []

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) {
      return items
    }

    return items.filter((item) =>
      Object.values(item || {}).some((value) => {
        if (value === null || value === undefined) {
          return false
        }

        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(term)
        }

        return String(value).toLowerCase().includes(term)
      }),
    )
  }, [items, search])

  const chartData =
    reportType === 'expenses'
      ? Array.isArray(data?.byCategory)
        ? data.byCategory
        : []
      : reportType === 'sales'
        ? (Array.isArray(data?.series) ? data.series : []).map(
            (item) => ({
              ...item,
              label: item.label || item.month || item.date || '',
            }),
          )
        : []

  const activeReport = REPORTS.find(
    (report) => report.key === reportType,
  )

  function handleReportChange(nextReport) {
    setReportType(nextReport)
    setSearch('')
  }

  return (
    <div className="stack report-center">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Understand sales, expenses, inventory and business performance."
        icon={<MdAssessment />}
      />

      {/* Report category selector */}
      <section className="report-selector">
        <div className="report-selector-heading">
          <div>
            <span className="report-selector-eyebrow">
              REPORT CENTRE
            </span>
            <h2>Explore your reports</h2>
            <p>
              Select a category to view its key figures and detailed
              records.
            </p>
          </div>

          <span className="report-category-count">
            {REPORTS.length} categories
          </span>
        </div>

        <div
          className="report-tabs"
          role="group"
          aria-label="Report categories"
        >
          {REPORTS.map((report) => {
            const Icon = report.icon
            const isActive = report.key === reportType

            return (
              <button
                key={report.key}
                type="button"
                className={`report-tab ${
                  isActive ? 'report-tab-active' : ''
                }`}
                aria-pressed={isActive}
                onClick={() => handleReportChange(report.key)}
              >
                <span className="report-tab-icon">
                  <Icon aria-hidden="true" />
                </span>

                <span className="report-tab-label">
                  {report.label}
                </span>

                {isActive && (
                  <span className="report-tab-indicator" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {isFetching && !data ? (
        <LoadingState label="Generating report…" />
      ) : isError && !data ? (
        <ErrorState
          message={
            error?.data?.message ||
            error?.message ||
            'Unable to load this report.'
          }
          onRetry={refetch}
        />
      ) : (
        <>
          {isError && data && (
            <div className="report-inline-error" role="status">
              The latest refresh failed. Showing the report data
              already available.
              <button type="button" onClick={refetch}>
                Try again
              </button>
            </div>
          )}

          <div className="report-section-heading">
            <div>
              <h2>{activeReport?.label || 'Report'} overview</h2>
              <p>Key figures for your selected report.</p>
            </div>

            <button
              type="button"
              className="report-refresh-button"
              onClick={refetch}
              disabled={isFetching || !vendorId}
            >
              <MdRefresh
                className={
                  isFetching ? 'report-refresh-spinning' : ''
                }
                aria-hidden="true"
              />
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {cards.length > 0 && (
            <div className="grid-4 report-summary-grid">
              {cards.map(([label, value, tone]) => (
                <StatCard
                  key={label}
                  label={label}
                  value={formatMetric(reportType, label, value)}
                  tone={tone}
                />
              ))}
            </div>
          )}

          {(reportType === 'sales' ||
            reportType === 'expenses') && (
            <Card
              title={
                reportType === 'sales'
                  ? 'Sales performance'
                  : 'Expenses by category'
              }
            >
              {chartData.length > 0 ? (
                reportType === 'sales' ? (
                  <BarChart
                    data={chartData}
                    xKey="label"
                    series={[
                      {
                        key: 'revenue',
                        name: 'Revenue',
                        color: '#2563eb',
                      },
                      {
                        key: 'collected',
                        name: 'Collected',
                        color: '#15965c',
                      },
                    ]}
                    height={260}
                  />
                ) : (
                  <DonutChart
                    data={chartData}
                    height={260}
                  />
                )
              ) : (
                <div className="report-chart-empty">
                  <MdAssessment aria-hidden="true" />
                  <p>
                    No chart data is available for this report yet.
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card
            title={`${activeReport?.label || 'Report'} details`}
            padded={false}
          >
            <div className="report-table-toolbar">
              <div className="report-search">
                <MdSearch aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder={`Search ${
                    activeReport?.label.toLowerCase() || 'records'
                  }…`}
                  aria-label={`Search ${
                    activeReport?.label || 'report'
                  } records`}
                />
              </div>

              <span className="report-result-count">
                {filteredItems.length}{' '}
                {filteredItems.length === 1 ? 'record' : 'records'}
                {search.trim() ? ' found' : ''}
              </span>
            </div>

            <DataTable
              columns={columns}
              rows={filteredItems}
              rowKey="id"
              loading={isFetching}
              error={null}
              emptyTitle={
                search.trim()
                  ? 'No matching records'
                  : 'No data for this report'
              }
            />
          </Card>
        </>
      )}
    </div>
  )
}

export function ReportCenterPage() {
  return (
    <PermissionGate permission={P.REPORT_VIEW}>
      <ReportCenterContent />
    </PermissionGate>
  )
}

export default ReportCenterPage