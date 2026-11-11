import { useForm } from 'react-hook-form'
import { useGetExpensesQuery, useCreateExpenseMutation } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useMyEmployee } from './useMyEmployee.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdReceiptLong } from 'react-icons/md'

const CATEGORIES = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Fuel', 'Accommodation', 'Other']

export function MyExpensesPage() {
  const vendorId = useCurrentVendor()
  const { me, isFetching } = useMyEmployee()
  const toast = useToast()
  const { data } = useGetExpensesQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const [create, createState] = useCreateExpenseMutation()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  if (isFetching) return <LoadingState label="Loading expenses…" />
  if (!me) return null

  const mine = (data?.items || []).filter((e) => e.submittedBy === me.userId || e.paidTo === me.name?.toUpperCase())

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, paidTo: me.name }).unwrap()
      toast.success('Expense submitted')
      reset()
    } catch (err) {
      toast.error(err?.data?.message || 'Submission failed')
    }
  }

  return (
    <div className="stack">
      <PageHeader title="My expenses" subtitle="Submit and track reimbursements" icon={<MdReceiptLong />} />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="History" padded={false}>
            <table className="table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.number}</strong>
                      <div className="muted text-xs">{e.description || '—'}</div>
                    </td>
                    <td>{e.category}</td>
                    <td><Money value={e.amount} /></td>
                    <td><StatusPill status={e.status} /></td>
                  </tr>
                ))}
                {mine.length === 0 && <tr><td colSpan={4} className="muted">No expenses yet.</td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <Card title="Submit expense">
            <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field label="Category" required error={errors.category?.message}>
                <Select {...register('category', { required: 'Required' })}>
                  <option value="">Choose…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Amount (₦)" required error={errors.amount?.message}>
                <Input type="number" min="1" step="0.01" invalid={!!errors.amount} {...register('amount', { required: 'Required', min: 1 })} />
              </Field>
              <Field label="Description">
                <Input {...register('description')} placeholder="What was it for?" />
              </Field>
              <Field label="Payment method">
                <Select {...register('paymentMethod')}>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </Select>
              </Field>
              <Button type="submit" loading={createState.isLoading}>Submit</Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default MyExpensesPage