import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetTicketsQuery, useCreateTicketMutation } from './api.js'
import { useGetCustomersQuery } from '../crm/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Link } from 'react-router-dom'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdHeadset } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import * as statuses from '../../constants/statuses.js'

export function TicketListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Support tickets"
      subtitle="Customer issues and requests"
      icon={<MdHeadset />}
      permission={P.TICKET_VIEW}
      columns={[
        {
          key: 'number', label: 'Ticket', sortable: true,
          render: (r) => (
            <Link to={`/support/tickets/${r.id}`}>
              <strong>{r.number}</strong>
              <div className="muted text-xs">{r.subject}</div>
            </Link>
          ),
        },
        { key: 'customerName', label: 'Customer', render: (r) => r.customerName || <span className="muted">—</span> },
        { key: 'priority', label: 'Priority', render: (r) => <PriorityBadge p={r.priority} /> },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'assignedName', label: 'Assigned to', render: (r) => r.assignedName || <span className="muted">—</span> },
        { key: 'updatedAt', label: 'Updated', render: (r) => <DateCell value={r.updatedAt} /> },
      ]}
      queryHook={useGetTicketsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={TicketForm}
      createTitle="New ticket"
      createLabel="New ticket"
      options={{
        searchPlaceholder: 'Search tickets…',
        statuses: statuses.TICKET_STATUS.map((st) => ({ value: st, label: st.replace('_', ' ') })),
      }}
      emptyTitle="No tickets yet"
      onRowClick={(row) => navigate(`/support/tickets/${row.id}`)}
    />
  )
}

export function PriorityBadge({ p }) {
  const tone = p === 'URGENT' ? 'danger' : p === 'HIGH' ? 'danger' : p === 'MEDIUM' ? 'warning' : 'info'
  return <Badge tone={tone}>{p}</Badge>
}

function TicketForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateTicketMutation()
  const toast = useToast()
  const { data: customers } = useGetCustomersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { priority: 'MEDIUM', source: 'WEB' } })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values }).unwrap()
      toast.success('Ticket created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create ticket')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Subject" required error={errors.subject?.message}>
        <Input invalid={!!errors.subject} {...register('subject', { required: 'Required' })} />
      </Field>
      <Field label="Customer" required error={errors.customerId?.message}>
        <Select invalid={!!errors.customerId} {...register('customerId', { required: 'Required' })}>
          <option value="">Select customer…</option>
          {(customers?.items || []).map((c) => (
            <option key={c.id} value={c.id}>{c.company || `${c.firstName} ${c.lastName}`}</option>
          ))}
        </Select>
      </Field>
      <div className="grid-2">
        <Field label="Priority">
          <Select {...register('priority')}>
            {statuses.TICKET_PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Source">
          <Select {...register('source')}>
            {statuses.TICKET_SOURCE.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={3} {...register('description')} />
      </Field>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create ticket</Button>
      </footer>
    </form>
  )
}

export default TicketListPage