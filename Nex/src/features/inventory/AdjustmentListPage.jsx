import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetStockAdjustmentsQuery, useCreateStockAdjustmentMutation, useGetProductsQuery, useGetWarehousesQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { MdTune } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import { statusLabel } from '../../constants/statuses.js'
import { DateCell } from '../../components/common/DateCell.jsx'

export function AdjustmentListPage() {
  return (
    <ListPage
      title="Stock adjustments"
      subtitle="Counts, damage, expiry and corrections"
      icon={<MdTune />}
      permission={P.INVENTORY_VIEW}
      columns={[
        { key: 'number', label: 'Adjustment', sortable: true, render: (r) => <strong>{r.number}</strong> },
        { key: 'productName', label: 'Product', render: (r) => r.productName || '—' },
        { key: 'type', label: 'Type', render: (r) => <Badge tone={['ADD', 'CORRECTION'].includes(r.type) ? 'success' : 'danger'}>{statusLabel(r.type)}</Badge> },
        { key: 'quantity', label: 'Qty', align: 'right', render: (r) => r.quantity },
        { key: 'reason', label: 'Reason', render: (r) => r.reason || <span className="muted">—</span> },
        { key: 'createdAt', label: 'Created', render: (r) => <DateCell value={r.createdAt} /> },
      ]}
      queryHook={useGetStockAdjustmentsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      options={{ searchPlaceholder: 'Search adjustments…' }}
      emptyTitle="No adjustments yet"
      createForm={AdjustmentForm}
      createTitle="New stock adjustment"
      createLabel="New adjustment"
    />
  )
}

function AdjustmentForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateStockAdjustmentMutation()
  const toast = useToast()
  const { data: products } = useGetProductsQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { data: warehouses } = useGetWarehousesQuery(vendorId, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { type: 'ADD' } })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, quantity: Number(values.quantity) }).unwrap()
      toast.success('Stock adjusted')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Adjustment failed')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Product" required error={errors.productId?.message}>
        <Select invalid={!!errors.productId} {...register('productId', { required: 'Required' })}>
          <option value="">Select product…</option>
          {(products?.items || []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </Select>
      </Field>
      <Field label="Warehouse" required error={errors.warehouseId?.message}>
        <Select invalid={!!errors.warehouseId} {...register('warehouseId', { required: 'Required' })}>
          <option value="">Select warehouse…</option>
          {(warehouses || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
      </Field>
      <div className="grid-2">
        <Field label="Type" required>
          <Select {...register('type')}>
            {['ADD', 'REMOVE', 'DAMAGED', 'EXPIRED', 'LOST', 'CORRECTION'].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Quantity" required error={errors.quantity?.message}>
          <Input type="number" min="1" step="any" invalid={!!errors.quantity} {...register('quantity', { required: 'Required', min: 1 })} />
        </Field>
      </div>
      <Field label="Reason">
        <Textarea rows={2} {...register('reason')} placeholder="e.g. Cycle count variance" />
      </Field>
      <footer className="form-footer">
        <Button variant="ghost" onClick={onDone} disabled={createState.isLoading}>Cancel</Button>
        <Button type="submit" loading={createState.isLoading}>Save adjustment</Button>
      </footer>
    </form>
  )
}

export default AdjustmentListPage