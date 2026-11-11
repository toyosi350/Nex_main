import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetStockTransfersQuery, useCreateStockTransferMutation, useTransferTransitionMutation, useGetProductsQuery, useGetWarehousesQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Button } from '../../components/common/Button.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { MdSwapHoriz, MdMoreVert } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import * as statuses from '../../constants/statuses.js'
import { DateCell } from '../../components/common/DateCell.jsx'

export function TransferListPage() {
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const [transition] = useTransferTransitionMutation()

  const advance = async (transfer) => {
    const nexts = statuses.nextTransitions(statuses.STOCK_TRANSFER_TRANSITIONS, transfer.status)
    const to = nexts[0]
    if (!to) return
    try {
      await transition({ vendorId, transferId: transfer.id, to }).unwrap()
      toast.success(`Transfer marked ${to}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Transition failed')
    }
  }

  return (
    <ListPage
      title="Stock transfers"
      subtitle="Movements between warehouses"
      icon={<MdSwapHoriz />}
      permission={P.INVENTORY_VIEW}
      columns={[
        { key: 'reference', label: 'Reference', sortable: true, render: (r) => <strong>{r.reference}</strong> },
        { key: 'productName', label: 'Product', render: (r) => r.productName || '—' },
        {
          key: 'route', label: 'Route',
          render: (r) => (
            <span>
              {r.fromName || r.fromWarehouseId}
              <span className="muted"> → </span>
              {r.toName || r.toWarehouseId}
            </span>
          ),
        },
        { key: 'quantity', label: 'Qty', align: 'right', sortable: true },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'createdAt', label: 'Created', render: (r) => <DateCell value={r.createdAt} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => {
            const nexts = statuses.nextTransitions(statuses.STOCK_TRANSFER_TRANSITIONS, r.status)
            return (
              <Dropdown trigger={<IconButton label="Actions" size="sm"><MdMoreVert /></IconButton>}>
                {nexts.map((to) => (
                  <DropdownItem key={to} onClick={() => advance(r)}>Mark {to.replace('_', ' ').toLowerCase()}</DropdownItem>
                ))}
              </Dropdown>
            )
          },
        },
      ]}
      queryHook={useGetStockTransfersQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      options={{ searchPlaceholder: 'Search transfers…' }}
      emptyTitle="No transfers yet"
      createForm={TransferForm}
      createTitle="New stock transfer"
      createLabel="New transfer"
    />
  )
}

function TransferForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateStockTransferMutation()
  const toast = useToast()
  const { data: products } = useGetProductsQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { data: warehouses } = useGetWarehousesQuery(vendorId, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, quantity: Number(values.quantity) }).unwrap()
      toast.success('Transfer requested')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create transfer')
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
      <div className="grid-2">
        <Field label="From" required error={errors.fromWarehouseId?.message}>
          <Select invalid={!!errors.fromWarehouseId} {...register('fromWarehouseId', { required: 'Required' })}>
            <option value="">Select…</option>
            {(warehouses || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>
        <Field label="To" required error={errors.toWarehouseId?.message}>
          <Select invalid={!!errors.toWarehouseId} {...register('toWarehouseId', { required: 'Required' })}>
            <option value="">Select…</option>
            {(warehouses || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Quantity" required error={errors.quantity?.message}>
        <Input type="number" min="1" step="any" invalid={!!errors.quantity} {...register('quantity', { required: 'Required', min: 1 })} />
      </Field>
      <footer className="form-footer">
        <Button variant="ghost" onClick={onDone} disabled={createState.isLoading}>Cancel</Button>
        <Button type="submit" loading={createState.isLoading}>Request transfer</Button>
      </footer>
    </form>
  )
}

export default TransferListPage