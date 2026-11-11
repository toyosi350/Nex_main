import { useForm } from 'react-hook-form'
import { useGetLeaveQuery, useCreateLeaveMutation } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useMyEmployee } from './useMyEmployee.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdBeachAccess } from 'react-icons/md'
import { LEAVE_TYPE } from '../../constants/statuses.js'

export function MyLeavePage() {
  const vendorId = useCurrentVendor()
  const { me, isFetching } = useMyEmployee()
  const toast = useToast()
  const { data } = useGetLeaveQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const [create, createState] = useCreateLeaveMutation()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  if (isFetching) return <LoadingState label="Loading leave…" />
  if (!me) return null

  const mine = (data?.items || []).filter((l) => l.employeeId === me.id)

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, employeeId: me.id, employeeName: me.name, ...values }).unwrap()
      toast.success('Leave requested')
      reset()
    } catch (err) {
      toast.error(err?.data?.message || 'Request failed')
    }
  }

  const days = (start, end) => {
    if (!start || !end) return 0
    return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1)
  }

  return (
    <div className="stack">
      <PageHeader title="My leave" subtitle="Request and track your time off" icon={<MdBeachAccess />} />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="History" padded={false}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((l) => (
                  <tr key={l.id}>
                    <td>{l.type}</td>
                    <td>{l.startDate}</td>
                    <td>{l.endDate}</td>
                    <td>{l.days ?? days(l.startDate, l.endDate)}</td>
                    <td><StatusPill status={l.status} /></td>
                  </tr>
                ))}
                {mine.length === 0 && <tr><td colSpan={5} className="muted">No leave on record.</td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <Card title="Request leave">
            <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field label="Type" required error={errors.type?.message}>
                <Select {...register('type', { required: 'Required' })}>
                  <option value="">Choose…</option>
                  {(LEAVE_TYPE || ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID']).map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </Select>
              </Field>
              <div className="grid-2">
                <Field label="Start" required error={errors.startDate?.message}>
                  <Input type="date" invalid={!!errors.startDate} {...register('startDate', { required: 'Required' })} />
                </Field>
                <Field label="End" required error={errors.endDate?.message}>
                  <Input type="date" invalid={!!errors.endDate} {...register('endDate', { required: 'Required' })} />
                </Field>
              </div>
              <Field label="Reason">
                <Input {...register('reason')} placeholder="Brief reason" />
              </Field>
              <Button type="submit" loading={createState.isLoading}>Submit request</Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default MyLeavePage