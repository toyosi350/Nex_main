import { cn } from '../../../utils/misc.js'

export function EmptyState({ title = 'Nothing here yet', message, action, className }) {
  return (
    <div className={cn('state state-center', className)}>
      <div className="state-emoji" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      </div>
      <h3 className="state-title">{title}</h3>
      {message && <p className="state-label">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}