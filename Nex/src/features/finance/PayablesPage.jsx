
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdPayments,
  MdSearch,
  MdAccountBalanceWallet,
  MdTrendingUp,
  MdReceiptLong,
} from 'react-icons/md'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useGetPayablesQuery } from './api.js'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Badge } from '../../components/common/Badge.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'

import { PERMISSIONS as P } from '../../constants/roles.js'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'

export function PayablesPage() {
  const vendorId = useCurrentVendor()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('outstanding')

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetPayablesQuery(vendorId, {
    skip: !vendorId,
  })

  const items = data?.items || []

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = items.filter((item) => {
      const supplierName = String(item.supplierName || '').toLowerCase()
      return !query || supplierName.includes(query)
    })

    return [...filtered].sort((a, b) => {
      return sortBy === 'supplierName'
        ? String(a.supplierName || '').localeCompare(
            String(b.supplierName || '')
          )
        : (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0)
    })
  }, [items, search, sortBy])

  const totalOrdered = Number(data?.totalOrdered) || 0
  const totalPaid = Number(data?.totalPaid) || 0

  const totalOutstanding = items.reduce(
    (sum, item) => sum + (Number(item.outstanding) || 0),
    0
  )

  const supplierCount = items.length

  const outstandingCount = items.filter(
    (item) => Number(item.outstanding) > 0
  ).length

  if (isFetching && !data) {
    return <LoadingState label="Loading supplier payables…" />
  }

  if (isError) {
    return (
      <PermissionGate permission={P.ACCOUNTING_VIEW}>
        <ErrorState
          message={
            error?.data?.message ||
            'Unable to load supplier balances. Please try again.'
          }
          onRetry={refetch}
        />
      </PermissionGate>
    )
  }

  return (
    <PermissionGate permission={P.ACCOUNTING_VIEW}>
      <div className="stack finance-payables-page">
        <PageHeader
          title="Payables"
          subtitle="Monitor supplier balances, payments and outstanding obligations."
          icon={<MdPayments />}
        />

        <div className="grid-3 finance-summary-grid">
          <StatCard
            label="Total ordered"
            value={<Money value={totalOrdered} />}
            sub={`${supplierCount} supplier balance${supplierCount === 1 ? '' : 's'}`}
            icon={<MdReceiptLong />}
            tone="brand"
          />

          <StatCard
            label="Total paid"
            value={<Money value={totalPaid} />}
            sub="Payments made to suppliers"
            icon={<MdAccountBalanceWallet />}
            tone="success"
          />

          <StatCard
            label="Outstanding"
            value={<Money value={totalOutstanding} />}
            sub={`${outstandingCount} supplier${outstandingCount === 1 ? '' : 's'} with balances`}
            icon={<MdTrendingUp />}
            tone="warning"
          />
        </div>

        <Card
          title="Supplier balances"
          subtitle="Review what your business owes each supplier."
          padded={false}
        >
          <div className="payables-toolbar">
            <div className="payables-search">
              <MdSearch aria-hidden="true" />

              <input
                type="search"
                className="input"
                placeholder="Search suppliers…"
                aria-label="Search suppliers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="select payables-sort"
              aria-label="Sort supplier balances"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="outstanding">Highest outstanding</option>
              <option value="totalOrdered">Highest ordered</option>
              <option value="paid">Highest paid</option>
              <option value="supplierName">Supplier name</option>
            </select>
          </div>

          <DataTable
            columns={[
              {
                key: 'supplierName',
                label: 'Supplier',
                render: (row) => (
                  <Link
                    to={`/purchasing/suppliers/${row.supplierId}`}
                    className="payables-supplier-link"
                  >
                    <strong>{row.supplierName || 'Unnamed supplier'}</strong>
                    <span className="muted text-xs">
                      View supplier details
                    </span>
                  </Link>
                ),
              },
              {
                key: 'totalOrdered',
                label: 'Total ordered',
                align: 'right',
                render: (row) => (
                  <Money value={Number(row.totalOrdered) || 0} />
                ),
              },
              {
                key: 'paid',
                label: 'Total paid',
                align: 'right',
                render: (row) => (
                  <Money value={Number(row.paid) || 0} />
                ),
              },
              {
                key: 'outstanding',
                label: 'Outstanding',
                align: 'right',
                render: (row) => (
                  <strong className="payables-outstanding">
                    <Money value={Number(row.outstanding) || 0} />
                  </strong>
                ),
              },
              {
                key: 'status',
                label: 'Balance status',
                render: (row) => {
                  const outstanding = Number(row.outstanding) || 0

                  return outstanding <= 0 ? (
                    <Badge tone="success">Settled</Badge>
                  ) : (
                    <Badge tone="warning">Payment due</Badge>
                  )
                },
              },
            ]}
            rows={filteredItems}
            rowKey="supplierId"
            loading={isFetching}
            error={isError ? error : null}
            onRetry={refetch}
            emptyTitle={
              search
                ? 'No matching suppliers'
                : 'No supplier balances yet'
            }
            emptyMessage={
              search
                ? 'Try another supplier name.'
                : 'Supplier balances will appear here when purchasing records are available.'
            }
          />
        </Card>
      </div>
    </PermissionGate>
  )
}

export default PayablesPage
