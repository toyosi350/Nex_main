import { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/misc.js'
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '../../features/vendor/api.js'
import { MdNotifications, MdNotificationsOff, MdDoneAll } from 'react-icons/md'
import { useAuth } from '../../hooks/useAuth.js'
import { Link } from 'react-router-dom'

function notificationIcon(type) {
  const icons = {
    invoice: '💵',
    order: '📦',
    quote: '📄',
    payment: '💰',
    product: '🏷️',
    ticket: '🎫',
    employee: '👤',
    leave: '🏖️',
    expense: '🧾',
    purchase_order: '📥',
    system: '🔔',
  }
  return icons[type] || '🔔'
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const { data } = useGetNotificationsQuery(undefined, { skip: !isAuthenticated })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll] = useMarkAllNotificationsReadMutation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const items = data?.items || []
  const unread = data?.unread || 0
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id)

  const openAll = () => {
    if (unreadIds.every((id) => items.some((n) => n.id === id && !n.read))) {
      // only mark-all when everything here is unread
    }
    markAll()
  }

  return (
    <div className="notif" ref={ref}>
      <button type="button" className="topbar-btn" onClick={() => setOpen((v) => !v)} aria-label={`Notifications (${unread} unread)`}>
        <MdNotifications />
        {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={openAll}>
                <MdDoneAll /> Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {items.length === 0 && (
              <div className="notif-empty">
                <MdNotificationsOff /> No notifications
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn('notif-item', !n.read && 'notif-item-unread')}
                onClick={() => markRead(n.id)}
              >
                <span className="notif-icon">{notificationIcon(n.type)}</span>
                <span className="notif-body">
                  <span className="notif-text">{n.message || n.action}</span>
                  <span className="notif-time">{n.at || n.createdAt}</span>
                </span>
                {!n.read && <span className="notif-flag" />}
              </button>
            ))}
          </div>
          <Link to="/notifications" className="notif-footer" onClick={() => setOpen(false)}>
            View all
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationBell