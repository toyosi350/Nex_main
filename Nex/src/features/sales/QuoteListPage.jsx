/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from 'react-router-dom'
import { DocumentForm } from './DocumentForm.jsx'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { useGetQuotesQuery, useCreateQuoteMutation } from './api.js'
import { Link } from 'react-router-dom'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdRequestQuote } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export const QUOTE_COLUMNS = [
  {
    key: 'number',
    label: 'Quote',
    sortable: true,
    render: (r) => (
      <span>
        <Link to={`/sales/quotes/${r.id}`}><strong>{r.number}</strong></Link>
        <div className="muted text-xs">{r.customerName}</div>
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
  { key: 'validUntil', label: 'Valid until', render: (r) => <DateCell value={r.validUntil} /> },
  { key: 'total', label: 'Total', align: 'right', sortable: true, render: (r) => <Money value={r.total} /> },
]

export function QuoteListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Quotes"
      subtitle="Proposals and price quotes"
      icon={<MdRequestQuote />}
      permission={P.QUOTE_VIEW}
      columns={QUOTE_COLUMNS}
      queryHook={useGetQuotesQuery}
      paramsToArgs={(vendorId, params) => ({ vendorId, params })}
      createForm={QuoteForm}
      createTitle="New quote"
      createLabel="New quote"
      options={{
        searchPlaceholder: 'Search quotes…',
        statuses: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SENT', label: 'Sent' },
          { value: 'ACCEPTED', label: 'Accepted' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'EXPIRED', label: 'Expired' },
        ],
      }}
      emptyTitle="No quotes yet"
      onRowClick={(row) => navigate(`/sales/quotes/${row.id}`)}
    />
  )
}

function QuoteForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateQuoteMutation()
  const toast = useToast()

  return (
    <DocumentForm
      title="quote"
      onDone={onDone}
      submitting={createState.isLoading}
      initial={{ dueDate: undefined }}
      onSubmit={async (values) => {
        try {
          await create({ vendorId, ...values }).unwrap()
          toast.success('Quote created')
          onDone()
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to create quote')
        }
      }}
    />
  )
}

export default QuoteListPage