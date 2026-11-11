import { useGetTasksQuery, useUpdateTaskMutation } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useMyEmployee } from './useMyEmployee.js'
import { PageHeader } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Select } from '../../components/form/Field.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdChecklist } from 'react-icons/md'
import { Link } from 'react-router-dom'
import { DateCell } from '../../components/common/DateCell.jsx'

const TASK_STATES = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']

export function MyTasksPage() {
  const vendorId = useCurrentVendor()
  const { me, isFetching } = useMyEmployee()
  const toast = useToast()
  const { data } = useGetTasksQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const [update] = useUpdateTaskMutation()

  if (isFetching) return <LoadingState label="Loading tasks…" />
  if (!me) return null

  const mine = (data?.items || []).filter((t) => t.assigneeId === me.id)
  const byStatus = (s) => mine.filter((t) => t.status === s)
  const groups = [
    { status: 'TODO', label: 'To do' },
    { status: 'IN_PROGRESS', label: 'In progress' },
    { status: 'BLOCKED', label: 'Blocked' },
    { status: 'DONE', label: 'Done' },
  ]

  const setStatus = async (task, status) => {
    try {
      await update({ vendorId, taskId: task.id, status }).unwrap()
      toast.success(`Task → ${status}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="stack">
      <PageHeader title="My tasks" subtitle="Everything assigned to you" icon={<MdChecklist />} />
      <div className="kanban">
        {groups.map((g) => (
          <div key={g.status} className="kanban-col">
            <div className="kanban-head">
              <span>{g.label}</span>
              <span className="kanban-count">{byStatus(g.status).length}</span>
            </div>
            <div className="kanban-list">
              {byStatus(g.status).map((t) => (
                <div key={t.id} className="kanban-card">
                  <div className="kanban-card-top">
                    <StatusPill status={t.status} />
                    <Select value={t.status} onChange={(e) => setStatus(t, e.target.value)} style={{ width: 130 }} aria-label="Move task">
                      {TASK_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div className="kanban-title">{t.title}</div>
                  <div className="kanban-meta">
                    <span>{t.projectName || 'Project'}</span>
                    <span>Due <DateCell value={t.dueDate} /></span>
                  </div>
                  {t.projectId && <Link className="link-btn" to={`/projects/${t.projectId}`}>Open project</Link>}
                </div>
              ))}
              {byStatus(g.status).length === 0 && <p className="muted kanban-empty">Nothing here.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyTasksPage