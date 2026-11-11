import { useParams, Link } from 'react-router-dom'
import { useGetInvoiceQuery, useInvoiceTransitionMutation, useRecordInvoicePaymentMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { DocDetailLayout } from './DocDetail.jsx'
import { Card } from '../../components/common/Card.jsx'
import { LinesTable, TotalsPanel, ActivityTimeline } from '../../components/common/DocumentSections.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { Money } from '../../components/common/Money.jsx'
import { useModal } from '../../hooks/useModal.js'
import { useToast } from '../../hooks/useToast.js'
import * as statuses from '../../constants/statuses.js'
import { useForm } from 'react-hook-form'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdReceiptLong, MdAddCard } from 'react-icons/md'

export function InvoiceDetailPage() {
  const { invoiceId } = useParams()
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const payModal = useModal()
  const { data: invoice, isFetching, isError, error, refetch } = useGetInvoiceQuery({ vendorId, invoiceId }, { skip: !vendorId })
  const [transition, tState] = useInvoiceTransitionMutation()

  if (isFetching && !invoice) return <LoadingState label="Loading invoice…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!invoice) return <ErrorState title="Invoice not found" onRetry={refetch} />

  const outstanding = invoice.outstanding ?? Math.max(0, invoice.total - invoice.amountPaid)
  const canPay = outstanding > 0 && !['PAID', 'CANCELLED'].includes(invoice.status)

  const summary = [
    ['Invoice number', invoice.number],
    ['Status', <StatusPill key="s" status={invoice.status} />],
    ['Issued', <DateCell key="d" value={invoice.issueDate} />],
    ['Due', <DateCell key="e" value={invoice.dueDate} />],
    ['Payment terms', invoice.paymentTerms],
    ['Linked order', invoice.orderId ? <Link key="o" to={`/sales/orders/${invoice.orderId}`}>View order</Link> : '—'],
  ]

  return (
    <DocDetailLayout
      title={invoice.number}
      subtitle={<Link to={`/customers/${invoice.customerId}`}>{invoice.customerName}</Link>}
      icon={<MdReceiptLong />}
      status={invoice.status}
      stateMap={statuses.INVOICE_TRANSITIONS}
      onTransition={async (to) => {
        try {
          await transition({ vendorId, invoiceId, to }).unwrap()
          toast.success(`Invoice marked ${to}`)
        } catch (err) {
          toast.error(err?.data?.message || 'Transition failed')
        }
      }}
      transitioning={tState.isLoading}
      actions={
        canPay && (
          <Button onClick={() => payModal.open(null)}><MdAddCard /> Record payment</Button>
        )
      }
      sidebar={
        <div className="stack-sm">
          <Card title="Summary"><SummaryList rows={summary} /></Card>
          <Card title="Activity"><ActivityTimeline activity={invoice.activity} /></Card>
        </div>
      }
    >
      <Card padded={false}>
        <LinesTable lines={invoice.lines} />
        <div className="divider" />
        <TotalsPanel
          subtotal={invoice.subtotal}
          discount={invoice.discount}
          tax={invoice.tax}
          total={invoice.total}
          paid={invoice.amountPaid}
          outstanding={outstanding}
        />
        <div className="divider" />
        <PaymentsList invoice={invoice} />
      </Card>

      <RecordPaymentModal modal={payModal} invoice={invoice} outstanding={outstanding} onDone={payModal.close} />
    </DocDetailLayout>
  )
}

function SummaryList({ rows }) {
  return (
    <div className="detail-grid">
      {rows.map(([l, v]) => (
        <div key={l} className="detail-item">
          <div className="detail-label">{l}</div>
          <div className="detail-value">{v}</div>
        </div>
      ))}
    </div>
  )
}

function PaymentsList({ invoice }) {
  const payments = invoice.payments || []
  if (!payments.length) return <p className="muted">No payments recorded yet.</p>
  return (
    <div>
      <h4 className="mb-4">Payments</h4>
      <ul className="activity-list">
        {payments.map((p) => (
          <li key={p.id} className="activity-item">
            <span className="activity-badge">₦</span>
            <span className="activity-text">
              {p.number} · {p.method} {p.reference ? `· ${p.reference}` : ''}
            </span>
            <span className="activity-time"><Money value={p.amount} /></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RecordPaymentModal({ modal, invoice, outstanding, onDone }) {
  const vendorId = useCurrentVendor()
  const [record, recordState] = useRecordInvoicePaymentMutation()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { amount: outstanding, method: 'BANK_TRANSFER', reference: '' },
  })

  const onSubmit = async (values) => {
    try {
      await record({ vendorId, invoiceId: invoice.id, amount: Number(values.amount), method: values.method, reference: values.reference }).unwrap()
      toast.success('Payment recorded')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Payment failed')
    }
  }

  return (
    <Modal open={modal.isOpen} onClose={onDone} title={`Record payment on ${invoice.number}`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Outstanding balance">
          <div className="stat-value"><Money value={outstanding} /></div>
        </Field>
        <Field label="Amount" required error={errors.amount?.message}>
          <Input
            type="number"
            step="any"
            invalid={!!errors.amount}
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be positive' }, max: { value: outstanding, message: 'Cannot exceed outstanding' } })}
          />
        </Field>
        <Field label="Method">
          <Select {...register('method')}>
            {['BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE', 'MOBILE_MONEY'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </Select>
        </Field>
        <Field label="Reference">
          <Input {...register('reference')} placeholder="Optional transaction reference" />
        </Field>
        <footer className="modal-footer">
          <Button variant="ghost" onClick={onDone} disabled={recordState.isLoading}>Cancel</Button>
          <Button type="submit" loading={recordState.isLoading}><MdAddCard /> Record</Button>
        </footer>
      </form>
    </Modal>
  )
}

export default InvoiceDetailPage