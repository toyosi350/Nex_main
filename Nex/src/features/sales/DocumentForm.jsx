/* eslint-disable react-hooks/incompatible-library */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useGetCustomersQuery } from '../crm/api.js'
import { useGetProductsQuery } from '../inventory/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Button, IconButton } from '../../components/common/Button.jsx'
import { cn } from '../../utils/misc.js'
import { calculateInvoiceTotal } from '../../utils/money.js'
import { formatMoney } from '../../utils/format.js'
import { MdAdd, MdClose } from 'react-icons/md'

/**
 * Shared draft form for quotes / orders / invoices.
 * Emits { customerId, lines, discountType, discountValue, taxRate, ...extra }
 */
export function DocumentForm({
  title,
  onDone,
  onSubmit,
  submitting,
  initial = {},
  extra = null,
  statusDefault = 'DRAFT',
}) {
  const vendorId = useCurrentVendor()
  const { data: customers } = useGetCustomersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { data: products } = useGetProductsQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      customerId: initial.customerId || '',
      discountType: initial.discountType || 'FIXED',
      discountValue: initial.discountValue || 0,
      taxRate: initial.taxRate ?? 7.5,
      orderId: initial.orderId || '',
      dueDate: initial.dueDate || '',
      validUntil: initial.validUntil || '',
      status: initial.status || statusDefault,
    },
  })

  const initialLines =
    initial.lines?.length
      ? initial.lines.map((l) => ({ ...l, lineTotal: (l.quantity || 0) * (l.unitPrice || l.price || l.unitCost || 0) }))
      : [{ id: 1, productId: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]

  const [lines, setLines] = useState(initialLines)

  const discountType = watch('discountType')
  const discountValue = Number(watch('discountValue')) || 0
  const taxRate = Number(watch('taxRate')) || 0

  const totals = calculateInvoiceTotal({
    lines: lines.map((l) => ({ quantity: l.quantity || 0, unitPrice: l.unitPrice || 0 })),
    discountType,
    discountValue,
    taxRate,
  })

  const productOptions = products?.items || []
  const productById = (id) => productOptions.find((p) => p.id === id)

  const updateLine = (id, patch) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const next = { ...l, ...patch }
        next.lineTotal = (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0)
        return next
      })
    )
  }

  const addLine = () => {
    setLines((prev) => [...prev, { id: Date.now(), productId: '', quantity: 1, unitPrice: 0, lineTotal: 0 }])
  }

  const removeLine = (id) => {
    if (lines.length === 1) {
      setLines([{ id: Date.now(), productId: '', quantity: 1, unitPrice: 0, lineTotal: 0 }])
      return
    }
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const onProductChange = (id, productId) => {
    const prod = productById(productId)
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, productId, unitPrice: prod ? prod.sellingPrice || prod.price || 0 : l.unitPrice }
          : l
      )
    )
  }

  const submit = (values) => {
    const payload = {
      ...values,
      lines: lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-grid-2">
        <Field label="Customer" required error={errors.customerId?.message}>
          <Select invalid={!!errors.customerId} {...register('customerId', { required: 'Select a customer' })}>
            <option value="">Select customer…</option>
            {(customers?.items || []).map((c) => (
              <option key={c.id} value={c.id}>{c.company || `${c.firstName} ${c.lastName}`}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select {...register('status')}>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PENDING">Pending</option>
          </Select>
        </Field>
      </div>

      {extra && <div className="form-grid-2">{extra}</div>}

      <div className="doc-lines">
        <div className="doc-lines-head">
          <span className="doc-lines-col-product">Product</span>
          <span className="doc-lines-col-qty">Qty</span>
          <span className="doc-lines-col-price">Unit price</span>
          <span className="doc-lines-col-total">Line total</span>
          <span />
        </div>
        {lines.map((line, idx) => (
          <div key={line.id} className={cn('doc-lines-row')}>
            <Select
              className="doc-lines-col-product"
              aria-label={`Line ${idx + 1} product`}
              value={line.productId}
              onChange={(e) => onProductChange(line.id, e.target.value)}
            >
              <option value="">Select product…</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.sellingPrice || p.price || 0)}</option>
              ))}
            </Select>
            <Input
              className="doc-lines-col-qty"
              type="number"
              min="1"
              aria-label={`Line ${idx + 1} quantity`}
              value={line.quantity}
              onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
            />
            <Input
              className="doc-lines-col-price"
              type="number"
              step="any"
              aria-label={`Line ${idx + 1} unit price`}
              value={line.unitPrice}
              onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
            />
            <span className="doc-lines-col-total money">{formatMoney(line.lineTotal)}</span>
            <IconButton label="Remove line" size="sm" onClick={() => removeLine(line.id)}>
              <MdClose />
            </IconButton>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addLine}>
          <MdAdd /> Add line
        </Button>
      </div>

      <div className="doc-totals-edit">
        <div className="form-grid-2">
          <Field label="Discount type">
            <Select {...register('discountType')}>
              <option value="FIXED">Fixed amount</option>
              <option value="PERCENT">Percentage</option>
            </Select>
          </Field>
          <Field label={discountType === 'PERCENT' ? 'Discount (%)' : 'Discount (₦)'}>
            <Input type="number" step="any" {...register('discountValue')} />
          </Field>
        </div>
        <div className="form-grid-2">
          <Field label="Tax rate (%)">
            <Input type="number" step="any" {...register('taxRate')} />
          </Field>
          {initial?.validUntil !== undefined && (
            <Field label="Valid until">
              <Input type="date" {...register('validUntil')} />
            </Field>
          )}
          {initial?.dueDate !== undefined && (
            <Field label="Due date">
              <Input type="date" {...register('dueDate')} />
            </Field>
          )}
        </div>
      </div>

      <div className="doc-totals-preview">
        <div className="doc-total-line"><span>Subtotal</span><span className="money">{formatMoney(totals.subtotal)}</span></div>
        <div className="doc-total-line"><span>Discount</span><span className="money">− {formatMoney(totals.discount)}</span></div>
        <div className="doc-total-line"><span>Tax</span><span className="money">{formatMoney(totals.tax)}</span></div>
        <div className="doc-total-line doc-total-grand"><span>Total</span><span className="money">{formatMoney(totals.total)}</span></div>
      </div>

      <footer className="drawer-footer">
        <Button variant="ghost" onClick={onDone} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save {title}</Button>
      </footer>
    </form>
  )
}

export default DocumentForm