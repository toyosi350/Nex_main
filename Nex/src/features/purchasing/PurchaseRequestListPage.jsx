import { PurchaseForm, LinesEditor } from './PurchaseForms.jsx'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetPurchaseRequestsQuery, useCreatePurchaseRequestMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdFactCheck } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function PurchaseRequestListPage() {
  return (
    <ListPage
      title="Purchase requests"
      subtitle="Internal requests to buy goods"
      icon={<MdFactCheck />}
      permission={P.PURCHASE_VIEW}
      columns={[
        {
          key: 'number', label: 'Request', sortable: true,
          render: (r) => <strong>{r.number}</strong>,
        },
        { key: 'supplierName', label: 'Supplier', render: (r) => r.supplierName || <span className="muted">—</span> },
        { key: 'department', label: 'Department', render: (r) => r.department || '—' },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'createdAt', label: 'Created', render: (r) => <DateCell value={r.createdAt} /> },
      ]}
      queryHook={useGetPurchaseRequestsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={PurchaseRequestForm}
      createTitle="New purchase request"
      createLabel="New request"
      options={{ searchPlaceholder: 'Search requests…' }}
      emptyTitle="No purchase requests"
    />
  )
}

function PurchaseRequestForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreatePurchaseRequestMutation()
  const toast = useToast()

  return (
    <PurchaseForm
      title="purchase request"
      submitLabel="Create request"
      submitting={createState.isLoading}
      defaultDepartment="Operations"
      extraFields={({ register }) => (
        <>
          <Field label="Preferred supplier">
            <Input {...register('supplierName')} placeholder="Optional" />
          </Field>
          <Field label="Department">
            <Select {...register('department')}>
              {['Operations', 'Finance', 'IT', 'Sales', 'HR', 'Logistics', 'Admin'].map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
        </>
      )}
      onSubmit={async (values) => {
        try {
          await create({ vendorId, ...values }).unwrap()
          toast.success('Purchase request created')
          onDone?.()
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to create request')
        }
      }}
      onCancel={onDone}
    >
      {(fieldProps) => <LinesEditor {...fieldProps} />}
    </PurchaseForm>
  )
}

export default PurchaseRequestListPage