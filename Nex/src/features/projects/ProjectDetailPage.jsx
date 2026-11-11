import { useParams, useNavigate } from 'react-router-dom'
import { useGetProjectQuery, useUpdateProjectMutation, useUpdateTaskMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { ProgressBar } from '../../components/common/ProgressBar.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { ActivityTimeline } from '../../components/common/DocumentSections.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdFolderShared, MdMoreVert } from 'react-icons/md'

const PROJECT_NEXT = {
  PLANNING: ['IN_PROGRESS'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const vendorId = useCurrentVendor()
  const navigate = useNavigate()
  const toast = useToast()
  const [update] = useUpdateProjectMutation()
  const { data: project, isFetching, isError, error, refetch } = useGetProjectQuery({ vendorId, projectId }, { skip: !vendorId })

  if (isFetching && !project) return <LoadingState label="Loading project…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!project) return <ErrorState title="Project not found" onRetry={refetch} />

  const tasks = project.tasks || []
  const team = project.team || []
  const done = tasks.filter((t) => t.status === 'DONE').length

  const advance = async () => {
    const nexts = PROJECT_NEXT[project.status] || []
    const to = nexts[0]
    if (!to) return
    try {
      await update({ vendorId, projectId, ...{ status: to } }).unwrap()
      toast.success(`Project → ${to}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="stack">
      <Button variant="ghost" onClick={() => navigate('/projects')}>Back to projects</Button>
      <PageHeader
        title={project.name}
        subtitle={project.department}
        icon={<MdFolderShared />}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={project.status} />
            <Dropdown trigger={<IconButton label="Actions" size="sm"><MdMoreVert /></IconButton>}>
              {(PROJECT_NEXT[project.status] || []).map((to) => (
                <DropdownItem key={to} onClick={advance}>Mark {to.replace('_', ' ').toLowerCase()}</DropdownItem>
              ))}
              <DropdownItem onClick={() => navigate(`/tasks?project=${project.id}`)}>View tasks</DropdownItem>
            </Dropdown>
          </div>
        }
      />
      <div className="grid-4">
        <StatCard label="Budget" value={<Money value={project.budget} />} />
        <StatCard label="Spent" value={<Money value={project.spent} />} />
        <StatCard label="Progress" value={<ProgressBar value={project.progress} />} />
        <StatCard label="Tasks done" value={`${done}/${tasks.length}`} />
      </div>
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Tasks" subtitle="Click to open details">
            {tasks.length === 0 ? (
              <p className="muted">No tasks yet.</p>
            ) : (
              <ul className="activity-list">
                {tasks.map((t) => (
                  <li key={t.id} className="activity-item clickable" onClick={() => navigate(`/tasks`)}>
                    <span className="activity-badge">{t.status[0]}</span>
                    <span className="activity-text">
                      {t.title}
                      <span className="muted"> · {t.assigneeName || 'Unassigned'}</span>
                    </span>
                    <TaskStatusChip task={t} vendorId={vendorId} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Activity"><ActivityTimeline activity={project.activity} /></Card>
        </div>
        <aside className="doc-detail-side">
          <div className="stack-sm">
            <Card title="Team">
              {team.length === 0 ? <p className="muted">No members assigned.</p> : (
                <ul className="team-list">
                  {team.map((e) => e && (
                    <li key={e.id} className="team-item">
                      <Avatar name={e.name} size="sm" />
                      <span className="team-name">{e.name}</span>
                      <span className="muted text-sm">{e.position}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Dates">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Start</div><div className="detail-value">{project.startDate?.slice(0, 10)}</div></div>
                <div className="detail-item"><div className="detail-label">Deadline</div><div className="detail-value">{project.deadline?.slice(0, 10)}</div></div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

function TaskStatusChip({ task, vendorId }) {
  const [update] = useUpdateTaskMutation()
  const nexts = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_REVIEW', 'DONE'],
    IN_REVIEW: ['DONE'],
    DONE: [],
  }[task.status] || []
  return (
    <span className="task-chip">
      <StatusPill status={task.status} />
      {nexts.length > 0 && (
        <IconButton
          size="xs"
          label={`Advance task to ${nexts[0]}`}
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await update({ vendorId, taskId: task.id, ...{ status: nexts[0] } }).unwrap()
            } catch { /* ignore */ }
          }}
        >
          <MdMoreVert />
        </IconButton>
      )}
    </span>
  )
}

export default ProjectDetailPage