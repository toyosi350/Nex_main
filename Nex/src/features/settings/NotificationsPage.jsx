import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '../vendor/api.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Button } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdNotifications } from 'react-icons/md'
import { DateCell } from '../../components/common/DateCell.jsx'

export function NotificationsPage() {
  const toast = useToast()
  const { data, isFetching, isError, error, refetch } = useGetNotificationsQuery()
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll] = useMarkAllNotificationsReadMutation()

  if (isFetching && !data) return <LoadingState label="Loading notifications…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />

  const items = data?.items || []
  const unread = data?.unread || items.filter((n) => !n.read).length

  const onMarkAll = async () => {
    try {
      await markAll().unwrap()
      toast.success('All notifications read')
    } catch (err) {
      toast.error(err?.data?.message || 'Failed')
    }
  }

  const onRead = async (id) => {
    try {
      await markRead(id).unwrap()
    } catch {
      /* noop */
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        icon={<MdNotifications />}
        actions={unread > 0 && <Button variant="ghost" onClick={onMarkAll}>Mark all read</Button>}
      />
      <Card padded={false}>
        {items.length === 0 ? (
          <div className="stack p-4"><p className="muted">You're all caught up.</p></div>
        ) : (
          <ul className="activity-list">
            {items.map((n) => (
              <li key={n.id} className="activity-item" style={n.read ? {} : { background: 'var(--brand-50, #eef2ff)' }} onClick={() => !n.read && onRead(n.id)}>
                <div className="activity-badge">{n.type || 'info'}</div>
                <div className="activity-text">
                  <div><strong>{n.title}</strong></div>
                  <div className="muted text-sm">{n.message}</div>
                </div>
                <div className="activity-time"><DateCell value={n.createdAt} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default NotificationsPage