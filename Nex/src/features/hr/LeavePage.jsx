import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetLeaveQuery, useCreateLeaveMutation, useLeaveTransitionMutation, useGetEmployeesQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Button, IconButton } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdBeachAccess } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import * as statuses from '../../constants/statuses.js'

export function LeavePage() {
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const [transition] = useLeaveTransitionMutation()

  const advance = async (request) => {
    const nexts = statuses.nextTransitions(statuses.LEAVE_TRANSITIONS, request.status)
    const to = nexts[0]
    if (!to) return
    try {
      await transition({ vendorId, leaveId: request.id, to }).unwrap()
      toast.success(`Leave marked ${to}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Transition failed')
    }
  }

  return (
    <ListPage
      title="Leave requests"
      subtitle="Time off across the team"
      icon={<MdBeachAccess />}
      permission={P.EMPLOYEE_VIEW}
      columns={[
        { key: 'employeeName', label: 'Employee', render: (r) => r.employeeName || '—' },
        { key: 'type', label: 'Type', render: (r) => <StatusPill status={r.type} /> },
        { key: 'dates', label: 'Dates', render: (r) => <span><DateCell value={r.startDate} /> → <DateCell value={r.endDate} /></span> },
        { key: 'days', label: 'Days', align: 'right', sortable: true },
        { key: 'reason', label: 'Reason', render: (r) => r.reason || <span className="muted">—</span> },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => {
            const nexts = statuses.nextTransitions(statuses.LEAVE_TRANSITIONS, r.status)
            if (!nexts.length) return null
            return (
              <Dropdown trigger={<IconButton label="Review leave" size="sm"><MdBeachAccess /></IconButton>}>
                {nexts.map((to) => (
                  <DropdownItem key={to} onClick={() => advance(r)}>Mark {to.toLowerCase()}</DropdownItem>
                ))}
              </Dropdown>
            )
          },
        },
      ]}
      queryHook={useGetLeaveQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={LeaveForm}
      createTitle="New leave request"
      createLabel="Add request"
      options={{
        searchPlaceholder: 'Search leave…',
        statuses: statuses.LEAVE_STATUS.map((st) => ({ value: st, label: st })),
      }}
      emptyTitle="No leave requests"
    />
  )
}

function LeaveForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateLeaveMutation()
  const toast = useToast()
  const { data: employees } = useGetEmployeesQuery({ vendorId, params: { perPage: 200, status: 'ALL' } }, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { type: 'ANNUAL' } })

  const onSubmit = async (values) => {
    try {
      const emp = (employees?.items || []).find((e) => e.id === values.employeeId)
      await create({ vendorId, ...values, employeeName: emp?.name }).unwrap()
      toast.success('Leave request created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create leave request')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Employee" required error={errors.employeeId?.message}>
        <Select invalid={!!errors.employeeId} {...register('employeeId', { required: 'Required' })}>
          <option value="">Select employee…</option>
          {(employees?.items || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </Field>
      <Field label="Type">
        <Select {...register('type')}>
          {statuses.LEAVE_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <div className="grid-2">
        <Field label="Start date" required>
          <Input type="date" {...register('startDate', { required: 'Required' })} />
        </Field>
        <Field label="End date" required>
          <Input type="date" {...register('endDate', { required: 'Required' })} />
        </Field>
      </div>
      <Field label="Reason">
        <Textarea rows={2} {...register('reason')} />
      </Field>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create request</Button>
      </footer>
    </form>
  )
}

export default LeavePage