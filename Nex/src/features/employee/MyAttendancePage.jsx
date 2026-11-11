import { useGetAttendanceQuery } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useMyEmployee } from './useMyEmployee.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { MdTimer } from 'react-icons/md'

export function MyAttendancePage() {
  const vendorId = useCurrentVendor()
  const { me, isFetching } = useMyEmployee()
  const { data } = useGetAttendanceQuery({ vendorId, params: {} }, { skip: !vendorId })

  if (isFetching) return <LoadingState label="Loading attendance…" />
  if (!me) return null

  const mine = (data?.rows || []).filter((a) => a.employeeId === me.id)
  const present = mine.filter((a) => a.status === 'PRESENT').length
  const late = mine.filter((a) => a.status === 'LATE').length
  const leave = mine.filter((a) => a.status === 'LEAVE').length
  const absent = mine.filter((a) => a.status === 'ABSENT').length
  const today = mine.find((a) => a.date === new Date().toISOString().slice(0, 10))

  return (
    <div className="stack">
      <PageHeader title="My attendance" subtitle="Your clock-in history" icon={<MdTimer />} />
      <div className="grid-4">
        <StatCard label="Present" value={present} tone="success" />
        <StatCard label="Late" value={late} tone="warning" />
        <StatCard label="Leave" value={leave} tone="info" />
        <StatCard label="Absent" value={absent} tone="danger" />
      </div>
      <Card title={`Today: ${today ? today.status : 'No record'}`}>
        {today ? (
          <div className="detail-grid">
            <div className="detail-item"><div className="detail-label">Check in</div><div className="detail-value">{today.checkIn || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Check out</div><div className="detail-value">{today.checkOut || '—'}</div></div>
            <div className="detail-item"><div className="detail-label">Recorded by</div><div className="detail-value">{today.recordedBy || '—'}</div></div>
          </div>
        ) : <p className="muted">No attendance recorded for today.</p>}
      </Card>
      <Card title="Recent entries" padded={false}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check in</th>
              <th>Check out</th>
            </tr>
          </thead>
          <tbody>
            {mine.slice().reverse().slice(0, 30).map((a) => (
              <tr key={a.id}>
                <td>{a.date}</td>
                <td><StatusPill status={a.status} /></td>
                <td>{a.checkIn || '—'}</td>
                <td>{a.checkOut || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default MyAttendancePage