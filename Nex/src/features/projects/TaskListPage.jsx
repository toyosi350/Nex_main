import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { DataTable } from '../../components/common/DataTable.jsx'
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useGetProjectsQuery } from './api.js'
import { useGetEmployeesQuery } from '../hr/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { useModal } from '../../hooks/useModal.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { MdTaskAlt, MdMoreVert } from 'react-icons/md'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'
import { PERMISSIONS as P } from '../../constants/roles.js'

const TASK_NEXT = { TODO: ['IN_PROGRESS'], IN_PROGRESS: ['IN_REVIEW', 'DONE'], IN_REVIEW: ['DONE'], DONE: [] }

export function TaskListPage() {
  const [searchParams] = useSearchParams()
  const vendorId = useCurrentVendor()
  const projectId = searchParams.get('project') || ''
  const status = searchParams.get('status') || ''
  const modal = useModal()
  const { data, isFetching, error, refetch } = useGetTasksQuery(
    { vendorId, ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) },
    { skip: !vendorId }
  )
  const rows = data?.items || []

  return (
    <PermissionGate permission={P.TASK_VIEW}>
      <div className="stack">
        <PageHeader
          title="Tasks"
          subtitle="All work items across projects"
          icon={<MdTaskAlt />}
          actions={<Button onClick={() => modal.open(null)}>New task</Button>}
        />
        <Card padded={false}>
          <DataTableLocal rows={rows} isFetching={isFetching} error={error} refetch={refetch} vendorId={vendorId} />
        </Card>
        <Modal open={modal.isOpen} onClose={modal.close} title="New task" size="md">
          {modal.isOpen && <TaskForm onDone={modal.close} presetProjectId={projectId} />}
        </Modal>
      </div>
    </PermissionGate>
  )
}

function DataTableLocal({ rows, isFetching, error, refetch, vendorId }) {
  const [update] = useUpdateTaskMutation()
  const toast = useToast()
  const columns = [
    {
      key: 'title', label: 'Task',
      render: (r) => (
        <span>
          <strong>{r.title}</strong>
          <div className="muted text-xs">{r.projectName || '—'}</div>
        </span>
      ),
    },
    { key: 'assigneeName', label: 'Assignee', render: (r) => r.assigneeName ? <span className="flex items-center gap-2"><Avatar name={r.assigneeName} size="xs" />{r.assigneeName}</span> : <span className="muted">Unassigned</span> },
    { key: 'priority', label: 'Priority', render: (r) => <PriorityBadge p={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'dueDate', label: 'Due', render: (r) => <DateCell value={r.dueDate} /> },
    {
      key: 'actions', label: '', align: 'center',
      render: (r) => {
        const nexts = TASK_NEXT[r.status] || []
        if (!nexts.length) return null
        return (
          <Dropdown trigger={<IconButton label="Advance task" size="sm"><MdMoreVert /></IconButton>}>
            {nexts.map((to) => (
              <DropdownItem
                key={to}
                onClick={async () => {
                  try {
                    await update({ vendorId, taskId: r.id, ...{ status: to } }).unwrap()
                    toast.success(`Task → ${to}`)
                  } catch (err) {
                    toast.error(err?.data?.message || 'Update failed')
                  }
                }}
              >
                Mark {to.replace('_', ' ').toLowerCase()}
              </DropdownItem>
            ))}
          </Dropdown>
        )
      },
    },
  ]
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey="id"
      loading={isFetching}
      error={error}
      onRetry={refetch}
      emptyTitle="No tasks found"
    />
  )
}

function PriorityBadge({ p }) {
  const tone = p === 'HIGH' || p === 'URGENT' ? 'danger' : p === 'MEDIUM' ? 'warning' : 'info'
  return <Badge tone={tone}>{p}</Badge>
}

function TaskForm({ onDone, presetProjectId }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateTaskMutation()
  const toast = useToast()
  const { data: projects } = useGetProjectsQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { data: employees } = useGetEmployeesQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { projectId: presetProjectId || '', status: 'TODO', priority: 'MEDIUM' },
  })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values }).unwrap()
      toast.success('Task created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create task')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Title" required error={errors.title?.message}>
        <Input invalid={!!errors.title} {...register('title', { required: 'Required' })} />
      </Field>
      <Field label="Project" required error={errors.projectId?.message}>
        <Select invalid={!!errors.projectId} {...register('projectId', { required: 'Required' })}>
          <option value="">Select project…</option>
          {(projects?.items || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <div className="grid-2">
        <Field label="Assignee">
          <Select {...register('assigneeId')}>
            <option value="">Unassigned…</option>
            {(employees?.items || []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select {...register('priority')}>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Due date">
        <Input type="date" {...register('dueDate')} />
      </Field>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} />
      </Field>
      <footer className="modal-footer">
        <Button variant="ghost" onClick={onDone} disabled={createState.isLoading}>Cancel</Button>
        <Button type="submit" loading={createState.isLoading}>Create task</Button>
      </footer>
    </form>
  )
}

export default TaskListPage