import { useParams, Link } from 'react-router-dom'
import { useGetEmployeeQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'

export function EmployeeDetailPage() {
  const { employeeId } = useParams()
  const vendorId = useCurrentVendor()
  const { data: employee, isFetching, isError, error, refetch } = useGetEmployeeQuery({ vendorId, employeeId }, { skip: !vendorId })

  if (isFetching && !employee) return <LoadingState label="Loading employee…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!employee) return <ErrorState title="Employee not found" onRetry={refetch} />

  const attendance = employee.attendance || []
  const leave = employee.leave || []
  const projects = employee.projects || []
  const recent = [...attendance].slice(-7).reverse()

  return (
    <div className="stack">
      <PageHeader
        title={employee.name}
        subtitle={`${employee.position || 'Staff'} · ${employee.departmentName || '—'}`}
        icon={<Avatar name={employee.name} size="md" />}
        actions={<StatusPill status={employee.status} />}
      />
      <div className="grid-3">
        <Card title="Details">
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Employee ID</div><div className="detail-value">{employee.employeeId}</div></div>
            <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{employee.email}</div></div>
            <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{employee.phone || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Department</div><div className="detail-value">{employee.departmentName}</div></div>
            <div className="detail-item"><div className="detail-label">Employed</div><div className="detail-value"><DateCell value={employee.employmentDate} /></div></div>
            <div className="detail-item"><div className="detail-label">Salary</div><div className="detail-value"><Money value={employee.salary} /></div></div>
          </div>
        </Card>
        <Card title="Recent attendance">
          {recent.length === 0 ? (
            <p className="muted">No attendance records.</p>
          ) : (
            <ul className="activity-list">
              {recent.map((a) => (
                <li key={a.id} className="activity-item">
                  <span className="activity-text"><DateCell value={a.date} /></span>
                  <span className="activity-time"><Badge tone={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'danger' : 'warning'}>{a.status}</Badge></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Tasks">
          {projects.length === 0 ? (
            <p className="muted">No assigned tasks.</p>
          ) : (
            <ul className="activity-list">
              {projects.map((t) => (
                <li key={t.id} className="activity-item">
                  <Link to={`/projects/${t.projectId}`} className="activity-text">{t.title}</Link>
                  <span className="activity-time"><StatusPill status={t.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <StatGrid leave={leave} />
    </div>
  )
}

function StatGrid({ leave }) {
  const stats = {
    total: leave.length,
    approved: leave.filter((l) => l.status === 'APPROVED').reduce((s, l) => s + l.days, 0),
    pending: leave.filter((l) => l.status === 'PENDING').length,
  }
  return (
    <div className="grid-3">
      <StatCard label="Leave requests" value={stats.total} />
      <StatCard label="Approved days" value={stats.approved} tone="success" />
      <StatCard label="Pending requests" value={stats.pending} tone="warning" />
    </div>
  )
}

export default EmployeeDetailPage