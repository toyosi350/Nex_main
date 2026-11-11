import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetVendorUsersQuery, useCreateVendorUserMutation, useUpdateVendorUserMutation } from '../admin/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { MdGroups } from 'react-icons/md'
import { MdMoreVert } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function TeamUsersPage() {
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const [update] = useUpdateVendorUserMutation()

  const setStatus = async (user, status) => {
    try {
      await update({ vendorId, userId: user.id, status }).unwrap()
      toast.success(`${user.name} → ${status}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <ListPage
      title="Team & users"
      subtitle="People with access to this workspace"
      icon={<MdGroups />}
      permission={P.USER_VIEW}
      columns={[
        {
          key: 'name', label: 'User', sortable: true,
          render: (r) => (
            <span className="flex items-center gap-2">
              <Avatar name={r.name} size="sm" />
              <span>
                <strong>{r.name}</strong>
                <div className="muted text-xs">{r.email}</div>
              </span>
            </span>
          ),
        },
        { key: 'role', label: 'Role', render: (r) => r.role?.replace('_', ' ') || '—' },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => (
            <Dropdown trigger={<IconButton label="User actions" size="sm"><MdMoreVert /></IconButton>}>
              {r.status === 'ACTIVE' && <DropdownItem onClick={() => setStatus(r, 'INACTIVE')}>Deactivate</DropdownItem>}
              {r.status !== 'ACTIVE' && <DropdownItem onClick={() => setStatus(r, 'ACTIVE')}>Activate</DropdownItem>}
            </Dropdown>
          ),
        },
      ]}
      queryHook={useGetVendorUsersQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={IAddUserForm}
      createTitle="Invite team member"
      createLabel="Invite user"
      options={{ searchPlaceholder: 'Search team…' }}
      emptyTitle="No team members yet"
    />
  )
}

function IAddUserForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateVendorUserMutation()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { role: 'STAFF', status: 'INVITED' } })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values }).unwrap()
      toast.success('User invited')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to invite user')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Full name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" invalid={!!errors.email} {...register('email', { required: 'Required' })} />
      </Field>
      <Field label="Role">
        <Select {...register('role')}>
          {['ADMIN', 'SALES', 'ACCOUNTANT', 'INVENTORY', 'HR', 'STAFF'].map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Field>
      <footer className="modal-footer">
        <Button variant="ghost" onClick={onDone} disabled={createState.isLoading}>Cancel</Button>
        <Button type="submit" loading={createState.isLoading}>Invite</Button>
      </footer>
    </form>
  )
}

export default TeamUsersPage