import { usePermissions } from '../../hooks/usePermissions.js'
import { ForbiddenState } from './empty/ForbiddenState.jsx'

/**
 * Blocks a whole section. When `silent` is true it renders children only when
 * allowed; otherwise it shows the ForbiddenState.
 */
export function PermissionGate({ permission, children, silent = false, else: elseNode = null }) {
  const { hasPermission } = usePermissions()
  if (hasPermission(permission)) return children
  if (silent) return null
  return elseNode || <ForbiddenState permission={permission} />
}

export default PermissionGate