import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetExpensesQuery, useCreateExpenseMutation, useExpenseTransitionMutation } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Button, IconButton } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdReceipt } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import * as statuses from '../../constants/statuses.js'

export function ExpenseListPage() {
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const [transition] = useExpenseTransitionMutation()

  const advance = async (exp) => {
    const nexts = statuses.nextTransitions(statuses.EXPENSE_TRANSITIONS, exp.status)
    const to = nexts[0]
    if (!to) return
    try {
      await transition({ vendorId, expenseId: exp.id, to }).unwrap()
      toast.success(`Expense marked ${to}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Transition failed')
    }
  }

  return (
    <ListPage
      title="Expenses"
      subtitle="Operating costs and disbursements"
      icon={<MdReceipt />}
      permission={P.EXPENSE_VIEW}
      columns={[
        {
          key: 'number', label: 'Expense', sortable: true,
          render: (r) => (
            <span>
              <strong>{r.number}</strong>
              <div className="muted text-xs">{r.category}</div>
            </span>
          ),
        },
        { key: 'description', label: 'Description', render: (r) => r.description || <span className="muted">—</span> },
        { key: 'paidTo', label: 'Paid to', render: (r) => r.paidTo || '—' },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'submittedAt', label: 'Date', sortable: true, render: (r) => <DateCell value={r.submittedAt ?? r.createdAt} /> },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (r) => <Money value={r.amount} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => {
            const nexts = statuses.nextTransitions(statuses.EXPENSE_TRANSITIONS, r.status)
            if (!nexts.length) return null
            return (
              <Dropdown trigger={<IconButton label="Advance expense" size="sm"><MdReceipt /></IconButton>}>
                {nexts.map((to) => (
                  <DropdownItem key={to} onClick={() => advance(r)}>Mark {to.toLowerCase()}</DropdownItem>
                ))}
              </Dropdown>
            )
          },
        },
      ]}
      queryHook={useGetExpensesQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={ExpenseForm}
      createTitle="New expense"
      createLabel="Add expense"
      options={{
        searchPlaceholder: 'Search expenses…',
        statuses: statuses.EXPENSE_STATUS.map((st) => ({ value: st, label: st })).filter((x) => x.value !== 'DRAFT'),
      }}
      emptyTitle="No expenses yet"
    />
  )
}

function ExpenseForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateExpenseMutation()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { category: 'OPERATIONS', paymentMethod: 'BANK_TRANSFER' },
  })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, amount: Number(values.amount), paidTo: values.paidTo || '' }).unwrap()
      toast.success('Expense created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create expense')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid-2">
        <Field label="Category" required error={errors.category?.message}>
          <Select {...register('category', { required: 'Required' })}>
            {['OPERATIONS', 'OFFICE', 'SALARIES', 'MARKETING', 'UTILITIES', 'TRAVEL', 'EQUIPMENT', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Amount (₦)" required error={errors.amount?.message}>
          <Input type="number" step="any" min="0" invalid={!!errors.amount} {...register('amount', { required: 'Required', min: 0.01 })} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} placeholder="What was this for?" />
      </Field>
      <div className="grid-2">
        <Field label="Paid to">
          <Input {...register('paidTo')} placeholder="Beneficiary name" />
        </Field>
        <Field label="Payment method">
          <Select {...register('paymentMethod')}>
            {['BANK_TRANSFER', 'CASH', 'CARD', 'CHEQUE', 'MOBILE_MONEY'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </Select>
        </Field>
      </div>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create expense</Button>
      </footer>
    </form>
  )
}

export default ExpenseListPage