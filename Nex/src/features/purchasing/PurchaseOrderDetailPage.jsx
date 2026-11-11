import { useParams } from 'react-router-dom'
import { useGetPurchaseOrderQuery, usePurchaseOrderTransitionMutation, useReceivePurchaseOrderMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { Card } from '../../components/common/Card.jsx'
import { PageHeader } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { TransitionMenu } from '../../components/common/DocumentSections.jsx'
import { ActivityTimeline } from '../../components/common/DocumentSections.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { Money } from '../../components/common/Money.jsx'
import { useModal } from '../../hooks/useModal.js'
import { useToast } from '../../hooks/useToast.js'
import * as statuses from '../../constants/statuses.js'
import { useForm, useFieldArray } from 'react-hook-form'
import { Input } from '../../components/form/Field.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdShoppingBag, MdOutlineAssignmentTurnedIn, MdAdd } from 'react-icons/md'

export function PurchaseOrderDetailPage() {
  const { poId } = useParams()
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const receiveModal = useModal()
  const { data: po, isFetching, isError, error, refetch } = useGetPurchaseOrderQuery({ vendorId, poId }, { skip: !vendorId })
  const [transition, tState] = usePurchaseOrderTransitionMutation()

  if (isFetching && !po) return <LoadingState label="Loading purchase order…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!po) return <ErrorState title="Purchase order not found" onRetry={refetch} />

  const total = po.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitCost || 0), 0)
  const allReceived = po.lines.length > 0 && po.lines.every((l) => Number(l.receivedQty || 0) >= Number(l.quantity || 0))
  const canReceive = !['RECEIVED', 'CANCELLED'].includes(po.status)

  return (
    <div className="stack">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()}><MdShoppingBag /> Back</Button>
      <PageHeader
        title={po.number}
        subtitle={po.supplierName || 'No supplier'}
        icon={<MdShoppingBag />}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={po.status} />
            <TransitionMenu
              stateMap={statuses.PURCHASE_ORDER_TRANSITIONS}
              status={po.status}
              onTransition={async (to) => {
                try {
                  await transition({ vendorId, poId, to }).unwrap()
                  toast.success(`PO marked ${to}`)
                } catch (err) {
                  toast.error(err?.data?.message || 'Transition failed')
                }
              }}
              transitioning={tState.isLoading}
            />
            {canReceive && (
              <Button variant="primary" onClick={() => receiveModal.open(null)}><MdOutlineAssignmentTurnedIn /> Receive goods</Button>
            )}
          </div>
        }
      />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card padded={false}>
            <table className="table">
              <thead>
                <tr><th>Item</th><th className="center">Ordered</th><th className="center">Received</th><th className="right">Unit cost</th><th className="right">Line total</th></tr>
              </thead>
              <tbody>
                {po.lines.map((l, i) => (
                  <tr key={l.id || i}>
                    <td>{l.productName || 'Item'}</td>
                    <td className="center">{l.quantity}</td>
                    <td className="center">{l.receivedQty || 0}</td>
                    <td className="right"><Money value={l.unitCost} currencySymbol="" /></td>
                    <td className="right"><Money value={l.quantity * l.unitCost} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="divider" />
            <div className="doc-totals">
              <span className="doc-total-label">Total</span>
              <span className="doc-total-value"><Money value={total} /></span>
            </div>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <div className="stack-sm">
            <Card title="Summary">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Supplier</div><div className="detail-value">{po.supplierName || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Expected delivery</div><div className="detail-value"><DateCell value={po.expectedDelivery} /></div></div>
                <div className="detail-item"><div className="detail-label">Received</div><div className="detail-value">{allReceived ? 'Fully' : 'Partial'}</div></div>
              </div>
            </Card>
            <Card title="Activity"><ActivityTimeline activity={po.activity} /></Card>
          </div>
        </aside>
      </div>

      <ReceiveModal modal={receiveModal} po={po} onDone={receiveModal.close} />
    </div>
  )
}

function ReceiveModal({ modal, po, onDone }) {
  const vendorId = useCurrentVendor()
  const [receive, receiveState] = useReceivePurchaseOrderMutation()
  const toast = useToast()
  const { register, handleSubmit, control } = useForm({
    defaultValues: { lines: po.lines.map((l) => ({ id: l.id, productName: l.productName, quantity: l.quantity, receivedQty: l.receivedQty || 0, unitCost: l.unitCost })) },
  })
  const { fields, append } = useFieldArray({ control, name: 'lines' })

  const onSubmit = async (values) => {
    try {
      const lines = values.lines
        .filter((l) => Number(l.receivedQty) > 0)
        .map((l) => ({ id: l.id, productId: l.productId, productName: l.productName, quantity: l.quantity, unitCost: l.unitCost, receivedQty: Number(l.receivedQty) }))
      await receive({ vendorId, poId: po.id, lines }).unwrap()
      toast.success('Goods received')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Receive failed')
    }
  }

  return (
    <Modal open={modal.isOpen} onClose={onDone} title={`Receive goods — ${po.number}`} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="lines-editor">
          <div className="line-row line-head">
            <div className="line-grow">Item</div>
            <div className="line-qty">Ordered</div>
            <div className="line-qty">Receiving</div>
          </div>
          {fields.map((f, i) => (
            <div key={f.id} className="line-row">
              <div className="line-grow"><span className="muted text-sm">{f.productName}</span></div>
              <div className="line-qty"><span className="muted">{f.quantity}</span></div>
              <div className="line-qty">
                <Input type="number" step="any" min="0" {...register(`lines.${i}.receivedQty`)} />
              </div>
            </div>
          ))}
          {!fields.length && <Button variant="ghost" size="sm" onClick={() => append({})}><MdAdd /> Add line</Button>}
        </div>
        <footer className="modal-footer">
          <Button variant="ghost" onClick={onDone} disabled={receiveState.isLoading}>Cancel</Button>
          <Button type="submit" loading={receiveState.isLoading}>Receive goods</Button>
        </footer>
      </form>
    </Modal>
  )
}

export default PurchaseOrderDetailPage