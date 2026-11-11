import { useForm } from 'react-hook-form'
import { useCreateCustomerMutation, useUpdateCustomerMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'

export function CustomerForm({ customer, onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateCustomerMutation()
  const [update, updateState] = useUpdateCustomerMutation()
  const toast = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: customer || {
      firstName: '', lastName: '', company: '', email: '', phone: '', address: '',
      paymentTerms: 'NET30', creditLimit: 0, status: 'ACTIVE',
    },
  })

  const saving = createState.isLoading || updateState.isLoading

  const onSubmit = async (values) => {
    try {
      if (customer) {
        await update({ vendorId, customerId: customer.id, ...values }).unwrap()
        toast.success('Customer updated')
      } else {
        await create({ vendorId, ...values }).unwrap()
        toast.success('Customer created')
      }
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed', 'Error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid-2">
        <Field label="First name" required error={errors.firstName?.message}>
          <Input invalid={!!errors.firstName} {...register('firstName', { required: 'Required' })} />
        </Field>
        <Field label="Last name" required error={errors.lastName?.message}>
          <Input invalid={!!errors.lastName} {...register('lastName', { required: 'Required' })} />
        </Field>
      </div>
      <Field label="Company">
        <Input {...register('company')} />
      </Field>
      <div className="form-grid-2">
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" invalid={!!errors.email} {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
        </Field>
        <Field label="Phone">
          <Input {...register('phone')} />
        </Field>
      </div>
      <Field label="Address">
        <Textarea rows={2} {...register('address')} />
      </Field>
      <div className="form-grid-2">
        <Field label="Payment terms">
          <Select {...register('paymentTerms')}>
            {['NET15', 'NET30', 'NET45', 'NET60', 'COD'].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Credit limit (₦)">
          <Input type="number" step="any" {...register('creditLimit')} />
        </Field>
      </div>
      <Field label="Status">
        <Select {...register('status')}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </Field>
      <footer className="drawer-footer">
        <Button variant="ghost" onClick={onDone} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{customer ? 'Save changes' : 'Create customer'}</Button>
      </footer>
    </form>
  )
}