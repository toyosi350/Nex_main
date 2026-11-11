import { useForm } from 'react-hook-form'
import { useCreateLeadMutation, useUpdateLeadMutation } from './api.js'
import { useGetVendorUsersQuery } from '../admin/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'

const STAGES = ['LEADS', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
const SOURCES = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SOCIAL', 'EVENT', 'WALK_IN', 'PARTNER']

export function LeadForm({ lead, onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateLeadMutation()
  const [update, updateState] = useUpdateLeadMutation()
  const toast = useToast()
  const { data: users } = useGetVendorUsersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: lead || { name: '', company: '', email: '', phone: '', stage: 'LEADS', value: 0, assignedUser: '', source: 'WEBSITE', nextAction: '' },
  })

  const saving = createState.isLoading || updateState.isLoading

  const onSubmit = async (values) => {
    try {
      if (lead) {
        await update({ vendorId, leadId: lead.id, ...values }).unwrap()
        toast.success('Lead updated')
      } else {
        await create({ vendorId, ...values }).unwrap()
        toast.success('Lead created')
      }
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Contact name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <div className="form-grid-2">
        <Field label="Company">
          <Input {...register('company')} />
        </Field>
        <Field label="Phone">
          <Input {...register('phone')} />
        </Field>
      </div>
      <div className="form-grid-2">
        <Field label="Email">
          <Input type="email" {...register('email')} />
        </Field>
        <Field label="Deal value (₦)">
          <Input type="number" step="any" {...register('value')} />
        </Field>
      </div>
      <div className="form-grid-2">
        <Field label="Stage">
          <Select {...register('stage')}>
            {STAGES.map((s) => <option key={s} value={s}>{labelFor(s)}</option>)}
          </Select>
        </Field>
        <Field label="Source">
          <Select {...register('source')}>
            {SOURCES.map((s) => <option key={s} value={s}>{labelFor(s)}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Assigned to">
        <Select {...register('assignedUser')}>
          <option value="">Unassigned</option>
          {(users?.items || []).map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Next action">
        <Input {...register('nextAction')} placeholder="e.g. Send proposal by Friday" />
      </Field>
      <footer className="drawer-footer">
        <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{lead ? 'Save changes' : 'Create lead'}</Button>
      </footer>
    </form>
  )
}

function labelFor(value) {
  return String(value || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export default LeadForm