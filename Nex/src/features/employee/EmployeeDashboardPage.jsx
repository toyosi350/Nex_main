import { useGetAttendanceQuery, useGetLeaveQuery, useGetTasksQuery, useGetExpensesQuery } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useMyEmployee } from './useMyEmployee.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { Link } from 'react-router-dom'
import { MdDashboard } from 'react-icons/md'

export function EmployeeDashboardPage() {
  const vendorId = useCurrentVendor()
  const { me, employees, isFetching } = useMyEmployee()
  const { data: att } = useGetAttendanceQuery({ vendorId, params: {} }, { skip: !vendorId })
  const { data: leaveData } = useGetLeaveQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const { data: tasksData } = useGetTasksQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const { data: expData } = useGetExpensesQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })

  if (isFetching) return <LoadingState label="Loading your workspace…" />
  if (!me) return null

  const id = me.id
  const myAttendance = (att?.rows || []).filter((a) => a.employeeId === id)
  const present = myAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length
  const late = myAttendance.filter((a) => a.status === 'LATE').length

  const myLeave = (leaveData?.items || []).filter((l) => l.employeeId === id)
  const pendingLeave = myLeave.filter((l) => l.status === 'PENDING').length
  const openTasks = (tasksData?.items || []).filter((t) => t.assigneeId === id && t.status !== 'DONE')
  const myExpenses = (expData?.items || []).filter((e) => e.submittedBy === me.userId || e.paidTo === me.name?.toUpperCase())

  return (
    <div className="stack">
      <PageHeader title={`Hi, ${me.name.split(' ')[0]}`} subtitle={`${me.position} · ${me.employeeId}`} icon={<MdDashboard />} />
      <div className="grid-4">
        <StatCard label="Attendance (last 30d)" value={`${present} days`} tone="success" />
        <StatCard label="Late arrivals" value={late} tone="warning" />
        <StatCard label="Leave requests" value={pendingLeave} tone="info" />
        <StatCard label="Open tasks" value={openTasks.length} tone={openTasks.length ? 'warning' : 'success'} />
      </div>
      <div className="grid-2">
        <Card title="My recent tasks">
          {openTasks.length === 0 ? (
            <p className="muted">No open tasks — enjoy the clean slate.</p>
          ) : (
            <ul className="activity-list">
              {openTasks.slice(0, 6).map((t) => (
                <li key={t.id} className="activity-item">
                  <div className="activity-badge">{t.priority || 'MEDIUM'}</div>
                  <div className="activity-text">
                    <div><strong>{t.title}</strong></div>
                    <div className="muted text-sm">{t.projectName || 'Project'} · <DateCell value={t.dueDate} /></div>
                  </div>
                  <div className="activity-time"><StatusPill status={t.status} /></div>
                </li>
              ))}
            </ul>
          )}
          <Link className="link-btn" to="/employee/tasks">All my tasks</Link>
        </Card>
        <Card title="My expenses">
          {myExpenses.length === 0 ? (
            <p className="muted">No submitted expenses yet.</p>
          ) : (
            <ul className="activity-list">
              {myExpenses.slice(0, 6).map((e) => (
                <li key={e.id} className="activity-item">
                  <div className="activity-badge">{e.category}</div>
                  <div className="activity-text">
                    <div><strong>{e.number}</strong></div>
                    <div className="muted text-sm">{e.description || 'Expense'}</div>
                  </div>
                  <div className="activity-time"><Money value={e.amount} /></div>
                </li>
              ))}
            </ul>
          )}
          <Link className="link-btn" to="/employee/expenses">All my expenses</Link>
        </Card>
      </div>
      <Card title="My team" padded={false}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter((e) => e.managerId === id || e.id === id).slice(0, 10).map((e) => (
              <tr key={e.id}>
                <td className="flex items-center gap-2"><Avatar name={e.name} size="sm" /> <strong>{e.name}</strong></td>
                <td>{e.position}</td>
                <td><StatusPill status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default EmployeeDashboardPage