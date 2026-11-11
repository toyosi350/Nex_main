
/* eslint-disable no-useless-assignment */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MdAccountBalanceWallet,
  MdCalendarMonth,
  MdSchedule,
  MdTrendingUp,
  MdWarningAmber,
  MdErrorOutline,
} from 'react-icons/md'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useGetReceivablesQuery } from './api.js'
import { useListParams } from '../../hooks/useListParams.js'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DonutChart } from '../../components/charts/Charts.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'

import { PERMISSIONS as P } from '../../constants/roles.js'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'

const AGING_BUCKETS = [
  {
    key: 'current',
    label: 'Current',
    description: 'Not yet overdue',
    color: 'current',
    icon: MdCalendarMonth,
  },
  {
    key: 'days30',
    label: '1–30 days',
    description: 'Recently overdue',
    color: 'days30',
    icon: MdSchedule,
  },
  {
    key: 'days60',
    label: '31–60 days',
    description: 'Follow-up recommended',
    color: 'days60',
    icon: MdTrendingUp,
  },
  {
    key: 'days90',
    label: '61–90 days',
    description: 'Requires attention',
    color: 'days90',
    icon: MdWarningAmber,
  },
  {
    key: 'days90plus',
    label: '90+ days',
    description: 'Priority collection',
    color: 'days90plus',
    icon: MdErrorOutline,
  },
]

export function ReceivablesPage() {
  const vendorId = useCurrentVendor()

  const list = useListParams({
    perPage: 20,
    sortBy: 'dueDate',
  })

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetReceivablesQuery(
    {
      vendorId,
      params: {},
    },
    {
      skip: !vendorId,
    }
  )

  const filtered = useLocalFilter(data, list)
  const rows = filtered.items
  const total = filtered.total

  const aging = {
    current: Number(data?.agingByStatus?.current) || 0,
    days30: Number(data?.agingByStatus?.days30) || 0,
    days60: Number(data?.agingByStatus?.days60) || 0,
    days90: Number(data?.agingByStatus?.days90) || 0,
    days90plus: Number(data?.agingByStatus?.days90plus) || 0,
  }

  const outstanding = Number(data?.outstanding) || 0
  const overdue = Number(data?.overdue) || 0

  const agingItems = AGING_BUCKETS.map((bucket) => ({
    ...bucket,
    value: aging[bucket.key],
  }))

  const largestAgingValue = Math.max(
    0,
    ...agingItems.map((item) => item.value)
  )

  const donut = [
    { name: 'Current', value: aging.current },
    { name: '1–30 days', value: aging.days30 },
    { name: '31–60 days', value: aging.days60 },
    { name: '61–90 days', value: aging.days90 },
    { name: '90+ days', value: aging.days90plus },
  ].filter((item) => item.value > 0)

  return (
    <PermissionGate permission={P.ACCOUNTING_VIEW}>
      {isFetching && !data ? (
        <LoadingState label="Loading receivables…" />
      ) : isError ? (
        <ErrorState
          message={
            error?.data?.message ||
            'Unable to load receivables. Please try again.'
          }
          onRetry={refetch}
        />
      ) : (
        <div className="stack finance-receivables-page">
          <PageHeader
            title="Receivables"
            subtitle="Track outstanding customer invoices and overdue payments"
            icon={<MdAccountBalanceWallet />}
          />

          {/* FINANCIAL SUMMARY */}
          <div className="grid-3 finance-summary-grid">
            <StatCard
              label="Outstanding"
              value={<Money value={outstanding} />}
              sub="Total balance owed by customers"
              icon={<MdAccountBalanceWallet />}
              tone="brand"
            />

            <StatCard
              label="Overdue"
              value={<Money value={data?.overdue} />}
              sub="Payments past their due date"
              icon={<MdAccountBalanceWallet />}
              tone="danger"
            />

            <StatCard
              label="Total invoiced"
              value={<Money value={data?.totalInvoiced} />}
              sub="Total value of customer invoices"
              icon={<MdAccountBalanceWallet />}
              tone="success"
            />
          </div>

          {/* OUTSTANDING CHART AND INVOICE AGING */}
          <div className="grid-2 receivables-analysis-grid">
            <Card
              title="Outstanding by age"
              subtitle="Distribution of unpaid invoice balances"
            >
              {donut.length > 0 ? (
                <DonutChart
                  data={donut}
                  height={260}
                  centerLabel={{
                    main: formatMoney(outstanding),
                    sub: 'outstanding',
                  }}
                />
              ) : (
                <div className="receivables-chart-empty">
                  <div className="receivables-empty-icon">
                    <MdAccountBalanceWallet />
                  </div>

                  <strong>{formatMoney(outstanding)}</strong>

                  <p className="muted">
                    No outstanding balances to display.
                  </p>
                </div>
              )}
            </Card>

            {/* REDESIGNED INVOICE AGING */}
            <div className="invoice-aging-panel">
              <Card
                title="Invoice aging"
                subtitle="Outstanding balances grouped by overdue period"
              >
                <div className="invoice-aging-content">
                  <div className="invoice-aging-summary">
                    <div className="invoice-aging-summary-icon">
                      <MdAccountBalanceWallet />
                    </div>

                    <div className="invoice-aging-summary-copy">
                      <span>Total overdue</span>
                      <strong>
                        <Money value={overdue} />
                      </strong>
                    </div>

                    <Badge tone={overdue > 0 ? 'danger' : 'success'}>
                      {overdue > 0 ? 'Needs attention' : 'Up to date'}
                    </Badge>
                  </div>

                  <div className="invoice-aging-buckets">
                    {agingItems.map((item) => {
                      const Icon = item.icon

                      const barWidth =
                        largestAgingValue > 0
                          ? Math.max(
                              item.value > 0 ? 3 : 0,
                              (item.value / largestAgingValue) * 100
                            )
                          : 0

                      return (
                        <div
                          key={item.key}
                          className={`invoice-aging-bucket aging-${item.color}`}
                        >
                          <div className="invoice-aging-bucket-icon">
                            <Icon />
                          </div>

                          <div className="invoice-aging-bucket-main">
                            <div className="invoice-aging-bucket-heading">
                              <div className="invoice-aging-label-group">
                                <strong>{item.label}</strong>
                                <span>{item.description}</span>
                              </div>

                              <strong className="invoice-aging-amount">
                                <Money value={item.value} />
                              </strong>
                            </div>

                            <div
                              className="invoice-aging-track"
                              role="progressbar"
                              aria-label={`${item.label} balance relative to the largest aging bucket`}
                              aria-valuemin={0}
                              aria-valuemax={largestAgingValue}
                              aria-valuenow={item.value}
                            >
                              <div
                                className="invoice-aging-bar"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="invoice-aging-note">
                    Review older balances regularly and prioritise
                    follow-ups on long-overdue invoices.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* OUTSTANDING INVOICES TABLE */}
          <Card
            title="Outstanding invoices"
            subtitle="Search and review balances owed by customers"
            padded={false}
          >
            <div
              className="toolbar receivables-toolbar"
              style={{ padding: '16px 16px 0' }}
            >
              <input
                className="input"
                type="search"
                placeholder="Search invoice or customer…"
                aria-label="Search invoices or customers"
                value={list.search}
                onChange={(event) => {
                  list.setSearch(event.target.value)
                  list.setPage(1)
                }}
              />

              <select
                className="select toolbar-filter"
                value={list.sortBy}
                aria-label="Sort invoices by"
                onChange={(event) => {
                  list.setSortBy(event.target.value)
                  list.setPage(1)
                }}
              >
                <option value="dueDate">Sort by due date</option>
                <option value="outstanding">Sort by outstanding</option>
                <option value="total">Sort by invoice total</option>
                <option value="customerName">Sort by customer</option>
              </select>
            </div>

            <DataTable
              columns={[
                {
                  key: 'invoiceNumber',
                  label: 'Invoice',
                  render: (row) => (
                    <Link to={`/sales/invoices/${row.invoiceId}`}>
                      <strong>{row.invoiceNumber || '—'}</strong>
                    </Link>
                  ),
                },
                {
                  key: 'customerName',
                  label: 'Customer',
                  render: (row) => row.customerName || '—',
                },
                {
                  key: 'dueDate',
                  label: 'Due date',
                  render: (row) => <DateCell value={row.dueDate} />,
                },
                {
                  key: 'age',
                  label: 'Payment status',
                  render: (row) =>
                    Number(row.daysOverdue) > 0 ? (
                      <Badge tone="danger">
                        {row.daysOverdue} days overdue
                      </Badge>
                    ) : (
                      <Badge tone="success">Current</Badge>
                    ),
                },
                {
                  key: 'total',
                  label: 'Invoice total',
                  align: 'right',
                  render: (row) => <Money value={row.total} />,
                },
                {
                  key: 'outstanding',
                  label: 'Outstanding',
                  align: 'right',
                  render: (row) => (
                    <Money value={row.outstanding} tone="danger" />
                  ),
                },
              ]}
              rows={rows}
              rowKey="invoiceId"
              loading={isFetching}
              error={isError ? error : null}
              onRetry={refetch}
              emptyTitle="No outstanding invoices"
              emptyMessage="Invoices with outstanding balances will appear here."
              pagination={{
                page: list.page,
                totalPages: Math.max(
                  1,
                  Math.ceil(total / list.perPage)
                ),
                total,
                perPage: list.perPage,
                onPerPageChange: (value) => {
                  list.setPerPage(value)
                  list.setPage(1)
                },
                onPageChange: list.setPage,
                sortKey: list.sortBy,
                sortDirection: list.sortDir.toLowerCase(),
                onSort: list.onSort,
                disabled: isFetching,
              }}
            />
          </Card>
        </div>
      )}
    </PermissionGate>
  )
}

function formatMoney(value) {
  const amount = Number(value) || 0

  return amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  })
}

function useLocalFilter(data, list) {
  return useMemo(() => {
    const query = String(list.search || '').trim().toLowerCase()

    const items = (data?.items || []).filter((invoice) => {
      const invoiceNumber = String(
        invoice.invoiceNumber || ''
      ).toLowerCase()

      const customerName = String(
        invoice.customerName || ''
      ).toLowerCase()

      return (
        !query ||
        invoiceNumber.includes(query) ||
        customerName.includes(query)
      )
    })

    const sorted = [...items].sort((a, b) => {
      let result = 0

      if (list.sortBy === 'outstanding' || list.sortBy === 'total') {
        result =
          (Number(a[list.sortBy]) || 0) -
          (Number(b[list.sortBy]) || 0)
      } else {
        result = String(a[list.sortBy] || '').localeCompare(
          String(b[list.sortBy] || ''),
          undefined,
          { numeric: true, sensitivity: 'base' }
        )
      }

      return list.sortDir === 'ASC' ? result : -result
    })

    const total = sorted.length
    const start = (list.page - 1) * list.perPage

    return {
      items: sorted.slice(start, start + list.perPage),
      total,
    }
  }, [
    data,
    list.search,
    list.page,
    list.perPage,
    list.sortBy,
    list.sortDir,
  ])
}

export default ReceivablesPage
