import { useNavigate } from 'react-router-dom'
import { PurchaseForm, LinesEditor } from './PurchaseForms.jsx'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetPurchaseOrdersQuery, useCreatePurchaseOrderMutation, useGetSuppliersQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Link } from 'react-router-dom'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdShoppingBag } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function PurchaseOrderListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Purchase orders"
      subtitle="Orders placed with suppliers"
      icon={<MdShoppingBag />}
      permission={P.PURCHASE_VIEW}
      columns={[
        {
          key: 'number', label: 'PO', sortable: true,
          render: (r) => (
            <Link to={`/purchasing/orders/${r.id}`}><strong>{r.number}</strong></Link>
          ),
        },
        { key: 'supplierName', label: 'Supplier', render: (r) => r.supplierName || <span className="muted">—</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'expectedDelivery', label: 'Expected', render: (r) => <DateCell value={r.expectedDelivery} /> },
        { key: 'total', label: 'Total', align: 'right', sortable: true, render: (r) => <Money value={r.total} /> },
      ]}
      queryHook={useGetPurchaseOrdersQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={PurchaseOrderForm}
      createTitle="New purchase order"
      createLabel="New purchase order"
      options={{ searchPlaceholder: 'Search purchase orders…' }}
      emptyTitle="No purchase orders"
      onRowClick={(row) => navigate(`/purchasing/orders/${row.id}`)}
    />
  )
}

function PurchaseOrderForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreatePurchaseOrderMutation()
  const toast = useToast()
  const { data: suppliers } = useGetSuppliersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })

  return (
    <PurchaseForm
      title="purchase order"
      submitLabel="Create purchase order"
      submitting={createState.isLoading}
      extraFields={({ register, errors }) => (
        <>
          <Field label="Supplier" required error={errors.supplierId?.message}>
            <Select invalid={!!errors.supplierId} {...register('supplierId', { required: 'Supplier required' })}>
              <option value="">Select supplier…</option>
              {(suppliers?.items || suppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Expected delivery">
            <Input type="date" {...register('expectedDelivery')} />
          </Field>
        </>
      )}
      onSubmit={async (values) => {
        try {
          await create({ vendorId, ...values }).unwrap()
          toast.success('Purchase order created')
          onDone?.()
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to create purchase order')
        }
      }}
      onCancel={onDone}
    >
      {(fieldProps) => <LinesEditor {...fieldProps} />}
    </PurchaseForm>
  )
}

export default PurchaseOrderListPage