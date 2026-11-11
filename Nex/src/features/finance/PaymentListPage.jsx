import { Link, useNavigate } from 'react-router-dom'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetPaymentsQuery } from '../sales/api.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdPayments } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function PaymentListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Payments"
      subtitle="Money received from customers"
      icon={<MdPayments />}
      permission={P.PAYMENT_VIEW}
      columns={[
        { key: 'number', label: 'Payment', sortable: true, render: (r) => <strong>{r.number}</strong> },
        { key: 'customerName', label: 'Customer', render: (r) => r.customerName || '—' },
        {
          key: 'invoiceNumber', label: 'Invoice',
          render: (r) => r.invoiceId ? <Link to={`/sales/invoices/${r.invoiceId}`}>{r.invoiceNumber}</Link> : <span className="muted">—</span>,
        },
        { key: 'method', label: 'Method', render: (r) => <span className="text-sm">{r.method?.replace('_', ' ')}</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'paidAt', label: 'Paid', sortable: true, render: (r) => <DateCell value={r.paidAt} /> },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (r) => <Money value={r.amount} /> },
      ]}
      queryHook={useGetPaymentsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      options={{ searchPlaceholder: 'Search payments…' }}
      emptyTitle="No payments yet"
      onRowClick={(row) => navigate(`/finance/payments/${row.id}`)}
    />
  )
}

export default PaymentListPage