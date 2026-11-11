/* eslint-disable react-refresh/only-export-components */
import { useNavigate } from 'react-router-dom'
import { DocumentForm } from './DocumentForm.jsx'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { useGetInvoicesQuery, useCreateInvoiceMutation } from './api.js'
import { Link } from 'react-router-dom'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdReceiptLong } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export const INVOICE_COLUMNS = [
  {
    key: 'number',
    label: 'Invoice',
    sortable: true,
    render: (r) => (
      <span>
        <Link to={`/sales/invoices/${r.id}`}><strong>{r.number}</strong></Link>
        <div className="muted text-xs">{r.customerName}</div>
      </span>
    ),
  },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
  { key: 'issueDate', label: 'Issued', render: (r) => <DateCell value={r.issueDate} /> },
  { key: 'dueDate', label: 'Due', render: (r) => <DateCell value={r.dueDate} /> },
  { key: 'total', label: 'Amount', align: 'right', sortable: true, render: (r) => <Money value={r.total} /> },
  { key: 'outstanding', label: 'Outstanding', align: 'right', sortable: true, render: (r) => <Money value={r.outstanding} tone={r.outstanding > 0 ? 'danger' : undefined} /> },
]

export function InvoiceListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Invoices"
      subtitle="Bills you’ve sent to customers"
      icon={<MdReceiptLong />}
      permission={P.INVOICE_VIEW}
      columns={INVOICE_COLUMNS}
      queryHook={useGetInvoicesQuery}
      paramsToArgs={(vendorId, params) => ({ vendorId, params })}
      createForm={InvoiceForm}
      createTitle="New invoice"
      createLabel="New invoice"
      options={{
        searchPlaceholder: 'Search invoices…',
        statuses: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SENT', label: 'Sent' },
          { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
          { value: 'PAID', label: 'Paid' },
          { value: 'OVERDUE', label: 'Overdue' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
      }}
      emptyTitle="No invoices yet"
      onRowClick={(row) => navigate(`/sales/invoices/${row.id}`)}
    />
  )
}

function InvoiceForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateInvoiceMutation()
  const toast = useToast()

  return (
    <DocumentForm
      title="invoice"
      onDone={onDone}
      submitting={createState.isLoading}
      initial={{ dueDate: '' }}
      onSubmit={async (values) => {
        try {
          await create({ vendorId, ...values }).unwrap()
          toast.success('Invoice created')
          onDone()
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to create invoice')
        }
      }}
    />
  )
}

export default InvoiceListPage