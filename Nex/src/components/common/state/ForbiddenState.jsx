import { cn } from '../../../utils/misc.js'
import { useCurrentUser } from '../../../hooks/useTenant.js'
import { ROLE_LABELS } from '../../../constants/roles.js'

export function ForbiddenState({ permission, className }) {
  const user = useCurrentUser()
  const roleLabel = ROLE_LABELS[user?.role] || user?.role
  return (
    <div className={cn('state state-center', className)}>
      <div className="state-emoji" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
          <circle cx="12" cy="15" r="1.2" fill="currentColor" />
        </svg>
      </div>
      <h3 className="state-title">Access denied</h3>
      <p className="state-label">
        Your account{roleLabel ? ` (${roleLabel})` : ''} doesn't have permission to view this section.
      </p>
      {permission && <p className="state-label muted text-xs">Required: {permission}</p>}
    </div>
  )
}

export default ForbiddenState