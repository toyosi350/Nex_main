import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetVendorsQuery, useCreateVendorMutation, useUpdateVendorStatusMutation } from './api.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { MdStorefront } from 'react-icons/md'
import { MdMoreVert } from 'react-icons/md'

const VENDOR_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']

export function VendorOnboardingListPage() {
  const toast = useToast()
  const [setStatus] = useUpdateVendorStatusMutation()

  const changeStatus = async (vendor, status) => {
    try {
      await setStatus({ vendorId: vendor.id, status }).unwrap()
      toast.success(`${vendor.company} → ${status}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <ListPage
      title="Vendors"
      subtitle="Tenant companies on the platform"
      icon={<MdStorefront />}
      columns={[
        {
          key: 'company', label: 'Vendor', sortable: true,
          render: (r) => (
            <span className="flex items-center gap-2">
              <Avatar name={r.company} size="sm" />
              <span>
                <strong>{r.company}</strong>
                <div className="muted text-xs">{r.email}</div>
              </span>
            </span>
          ),
        },
        { key: 'plan', label: 'Plan', sortable: true },
        { key: 'city', label: 'City', sortable: true },
        { key: 'userCount', label: 'Users', align: 'center' },
        { key: 'productCount', label: 'Products', align: 'center' },
        { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusPill status={r.status} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => (
            <Dropdown trigger={<IconButton label="Vendor actions" size="sm"><MdMoreVert /></IconButton>}>
              {VENDOR_STATUSES.filter((s) => s !== r.status).map((s) => (
                <DropdownItem key={s} onClick={() => changeStatus(r, s)}>{s === 'ACTIVE' ? 'Activate' : s === 'PENDING' ? 'Mark pending' : s === 'SUSPENDED' ? 'Suspend' : 'Deactivate'}</DropdownItem>
              ))}
            </Dropdown>
          ),
        },
      ]}
      queryHook={useGetVendorsQuery}
      requiresVendor={false}
      paramsToArgs={(_vid, params) => params}
      createForm={ICreateVendorForm}
      createTitle="Onboard vendor"
      createLabel="Onboard vendor"
      options={{ searchPlaceholder: 'Search vendors…' }}
      emptyTitle="No vendors yet"
    />
  )
}

function ICreateVendorForm({ onDone }) {
  const [create, createState] = useCreateVendorMutation()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { plan: 'BASIC', city: 'Lagos', status: 'ACTIVE' } })

  const onSubmit = async (values) => {
    try {
      await create(values).unwrap()
      toast.success('Vendor onboarded')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Onboarding failed')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Company name" required error={errors.company?.message}>
        <Input invalid={!!errors.company} {...register('company', { required: 'Required' })} />
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" invalid={!!errors.email} {...register('email', { required: 'Required' })} />
      </Field>
      <div className="grid-2">
        <Field label="City">
          <Input {...register('city')} />
        </Field>
        <Field label="Industry">
          <Input {...register('industry')} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Plan">
          <Select {...register('plan')}>
            <option value="BASIC">Basic</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </Select>
        </Field>
        <Field label="Credit limit (₦)">
          <Input type="number" {...register('creditLimit')} />
        </Field>
      </div>
      <Field label="Tax ID">
        <Input {...register('taxId')} />
      </Field>
      <footer className="modal-footer">
        <Button variant="ghost" onClick={onDone} disabled={createState.isLoading}>Cancel</Button>
        <Button type="submit" loading={createState.isLoading}>Onboard</Button>
      </footer>
    </form>
  )
}

export default VendorOnboardingListPage