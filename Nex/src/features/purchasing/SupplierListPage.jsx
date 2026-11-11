/* eslint-disable react-refresh/only-export-components */
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetSuppliersQuery, useCreateSupplierMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { MdLocalShipping } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function SupplierListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Suppliers"
      subtitle="Vendors you buy from"
      icon={<MdLocalShipping />}
      permission={P.SUPPLIER_VIEW}
      columns={SUPPLIER_COLUMNS}
      queryHook={useGetSuppliersQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={SupplierForm}
      createTitle="New supplier"
      createLabel="Add supplier"
      options={{ searchPlaceholder: 'Search suppliers…' }}
      emptyTitle="No suppliers yet"
      onRowClick={(row) => navigate(`/purchasing/suppliers/${row.id}`)}
    />
  )
}

export const SUPPLIER_COLUMNS = [
  {
    key: 'name',
    label: 'Supplier',
    sortable: true,
    render: (r) => (
      <Link to={`/purchasing/suppliers/${r.id}`}>
        <strong>{r.name}</strong>
        <div className="muted text-xs">{r.contactPerson || ''}</div>
      </Link>
    ),
  },
  { key: 'email', label: 'Email', render: (r) => r.email || <span className="muted">—</span> },
  { key: 'phone', label: 'Phone', render: (r) => r.phone || <span className="muted">—</span> },
  { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
  { key: 'category', label: 'Products', render: (r) => r.productCount ?? '—' },
]

function SupplierForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [create, createState] = useCreateSupplierMutation()
  const toast = useToast()

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values }).unwrap()
      toast.success('Supplier created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create supplier')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Company name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <Field label="Contact person" required error={errors.contactPerson?.message}>
        <Input invalid={!!errors.contactPerson} {...register('contactPerson', { required: 'Required' })} />
      </Field>
      <Field label="Email">
        <Input type="email" {...register('email')} />
      </Field>
      <Field label="Phone">
        <Input {...register('phone')} />
      </Field>
      <Field label="Payment terms">
        <Select {...register('paymentTerms')}>
          {['NET7', 'NET15', 'NET30', 'NET45', 'NET60'].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <Field label="Address">
        <Textarea rows={2} {...register('address')} />
      </Field>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create supplier</Button>
      </footer>
    </form>
  )
}

export default SupplierListPage